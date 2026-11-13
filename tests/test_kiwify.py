import hashlib
import hmac
import json
from datetime import date, timedelta

from app.extensions import db
from app.models import Usuario
from app.models.kiwify_pedido import STATUS_APLICADO, STATUS_CANCELADO, STATUS_PENDENTE, KiwifyPedido
from app.services.seed import criar_membro_familia
from app.utils.assinatura import definir_bloqueio_assinatura, usuario_tem_acesso
from app.utils.tokens import gerar_token_verificacao

TOKEN = "token-kiwify-de-teste-finup"


def _payload(email="cliente.kiwify@email.com", evento="order_approved", pedido="KW-1",
             sub="SUB-1", proxima=None, produto="prod-finup"):
    proxima = proxima or (date.today() + timedelta(days=30)).isoformat() + "T12:00:00.000Z"
    return {
        "order_id": pedido,
        "order_status": "paid",
        "webhook_event_type": evento,
        "payment_method": "pix",
        "subscription_id": sub,
        "Product": {"product_id": produto, "product_name": "FinUP"},
        "Customer": {"email": email, "full_name": "Cliente Kiwify"},
        "Subscription": {
            "id": sub,
            "status": "active",
            "next_payment": proxima,
            "customer_access": {"has_access": True},
        },
    }


def _post(client, payload, token=TOKEN, assinatura=None):
    corpo = json.dumps(payload).encode("utf-8")
    if assinatura is None:
        assinatura = hmac.new(token.encode(), corpo, hashlib.sha1).hexdigest()
    return client.post(f"/webhooks/kiwify?signature={assinatura}", data=corpo,
                       content_type="application/json")


def _cliente(app, email="cliente.kiwify@email.com", verificado=True):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia("Cliente", email, "senha123", eh_familia=False,
                             assinatura_ativa=False, email_verificado=verificado)
        db.session.commit()


def test_vetor_de_teste_da_documentacao(app):
    """Exemplo oficial: https://docs.kiwify.com.br/api-reference/webhooks/receiving"""
    from app.services.kiwify import assinatura_valida

    app.config["KIWIFY_TOKEN"] = "kiwify-token-de-teste"
    corpo = (b'{"order_id":"9b1c2d3e-0000-4000-8000-000000000001",'
             b'"order_status":"paid","webhook_event_type":"order_approved"}')
    with app.app_context():
        assert assinatura_valida(corpo, "bf18f352a4f981b91dfa3f6d8742a81080ab8c86") is True
        assert assinatura_valida(corpo, "0" * 40) is False


def test_get_e_sem_token(client, app):
    assert client.get("/webhooks/kiwify").get_json()["provedor"] == "kiwify"
    app.config["KIWIFY_TOKEN"] = ""
    assert _post(client, _payload()).status_code == 503


def test_assinatura_invalida_recusa(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    _cliente(app)
    assert _post(client, _payload(), assinatura="abc").status_code == 401
    assert _post(client, _payload(), token="outro-token").status_code == 401
    with app.app_context():
        assert KiwifyPedido.query.count() == 0


def test_compra_aprovada_libera_e_renovacao_estende(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    _cliente(app)
    resp = _post(client, _payload())
    assert resp.status_code == 200
    assert resp.get_json()["acao"] == "liberou"
    with app.app_context():
        u = Usuario.query.filter_by(username="cliente.kiwify@email.com").one()
        assert usuario_tem_acesso(u)
        venc1 = u.assinatura_vence_em
        assert venc1 >= date.today() + timedelta(days=30)

    proxima = (date.today() + timedelta(days=61)).isoformat() + "T12:00:00.000Z"
    resp = _post(client, _payload(evento="subscription_renewed", pedido="KW-2", proxima=proxima))
    assert resp.get_json()["acao"] == "liberou"
    with app.app_context():
        u = Usuario.query.filter_by(username="cliente.kiwify@email.com").one()
        assert u.assinatura_vence_em > venc1


def test_aviso_repetido_nao_duplica(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    _cliente(app)
    assert _post(client, _payload()).status_code == 200
    assert _post(client, _payload()).status_code == 200
    with app.app_context():
        assert KiwifyPedido.query.filter_by(pedido_id="KW-1").count() == 1


def test_reembolso_chargeback_e_cancelamento_bloqueiam(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    for i, evento in enumerate(("order_refunded", "chargeback", "subscription_canceled")):
        email = f"bloq{i}@email.com"
        _cliente(app, email)
        _post(client, _payload(email=email, pedido=f"P{i}", sub=f"S{i}"))
        resp = _post(client, _payload(email=email, evento=evento, pedido=f"P{i}", sub=f"S{i}"))
        assert resp.get_json()["acao"] == "bloqueou", evento
        with app.app_context():
            u = Usuario.query.filter_by(username=email).one()
            assert not usuario_tem_acesso(u), evento
            assert KiwifyPedido.query.filter_by(pedido_id=f"P{i}").one().status == STATUS_CANCELADO


def test_atraso_nao_bloqueia_na_hora(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    _cliente(app)
    _post(client, _payload())
    resp = _post(client, _payload(evento="subscription_late", pedido="KW-1"))
    assert resp.get_json()["acao"] == "ignorado"
    with app.app_context():
        assert usuario_tem_acesso(Usuario.query.filter_by(username="cliente.kiwify@email.com").one())


def test_compra_sem_conta_fica_guardada_e_libera_ao_confirmar_email(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    with app.app_context():
        definir_bloqueio_assinatura(True)
        db.session.commit()
    email = "novo.kiwify@email.com"
    assert _post(client, _payload(email=email, pedido="KW-N")).get_json()["acao"] == "pendente"

    client.post("/cadastro", data={"nome": "Novo", "username": email, "senha": "senha123", "senha2": "senha123"})
    with app.app_context():
        u = Usuario.query.filter_by(username=email).one()
        assert KiwifyPedido.query.filter_by(pedido_id="KW-N").one().status == STATUS_PENDENTE
        token = gerar_token_verificacao(u.id)
    client.get(f"/verificar-email/{token}")
    with app.app_context():
        u = Usuario.query.filter_by(username=email).one()
        assert usuario_tem_acesso(u)
        assert KiwifyPedido.query.filter_by(pedido_id="KW-N").one().status == STATUS_APLICADO


def test_conta_sem_email_confirmado_nao_pega_compra(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    _cliente(app, "intruso.kw@email.com", verificado=False)
    resp = _post(client, _payload(email="intruso.kw@email.com", pedido="KW-I"))
    assert resp.get_json()["acao"] == "pendente"
    with app.app_context():
        assert not usuario_tem_acesso(Usuario.query.filter_by(username="intruso.kw@email.com").one())


def test_produto_de_outro_item_e_ignorado(client, app):
    app.config["KIWIFY_TOKEN"] = TOKEN
    app.config["KIWIFY_PRODUCT_ID"] = "prod-finup"
    _cliente(app)
    resp = _post(client, _payload(produto="outro-produto"))
    assert resp.get_json()["acao"] == "ignorado"
    with app.app_context():
        assert not usuario_tem_acesso(Usuario.query.filter_by(username="cliente.kiwify@email.com").one())


def test_admin_configura_e_cliente_ve_botao(admin_client, client, app):
    resp = admin_client.post("/assinatura/kiwify", data={
        "kiwify_checkout": "https://pay.kiwify.com.br/FINUPTESTE",
        "kiwify_token": TOKEN,
        "kiwify_produto": "",
    })
    assert resp.status_code == 302
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert "/webhooks/kiwify" in html and "vendendo" in html
    # token salvo no banco também vale para o webhook
    app.config["KIWIFY_TOKEN"] = ""
    _cliente(app, "botao@email.com")
    c = app.test_client()
    r = c.post("/login", data={"username": "botao@email.com", "senha": "senha123"})
    c.get(r.headers["Location"])
    pagina = c.get("/assinatura/bloqueado").get_data(as_text=True)
    assert "https://pay.kiwify.com.br/FINUPTESTE" in pagina
    assert _post(client, _payload(email="botao@email.com", pedido="KW-B")).get_json()["acao"] == "liberou"


def test_link_precisa_ser_https(admin_client):
    admin_client.post("/assinatura/kiwify", data={"kiwify_checkout": "http://x.com", "kiwify_token": TOKEN})
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert "http://x.com" not in html
