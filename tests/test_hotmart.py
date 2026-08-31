from datetime import date, timedelta

from app.extensions import db
from app.models import Usuario
from app.models.hotmart_pedido import STATUS_APLICADO, STATUS_PENDENTE, HotmartPedido
from app.services.hotmart import CHAVE_CHECKOUT, CHAVE_HOTTOK
from app.services.seed import criar_membro_familia
from app.utils.assinatura import _definir_cfg, definir_bloqueio_assinatura, usuario_tem_acesso


HOTTOK = "hottok-teste-finup"


def _payload(email="cliente.hotmart@email.com", evento="PURCHASE_APPROVED", tx="HP-1", produto=None):
    data = {
        "product": {"id": produto or 111, "name": "FinUP"},
        "buyer": {"email": email, "name": "Cliente Hotmart"},
        "purchase": {
            "transaction": tx,
            "status": "APPROVED",
            "date_next_charge": int((date.today() + timedelta(days=30)).strftime("%s")) * 1000,
        },
    }
    return {"id": f"evt-{tx}", "event": evento, "version": "2.0.0", "data": data}


def _post(client, payload, hottok=HOTTOK):
    return client.post(
        "/webhooks/hotmart",
        json=payload,
        headers={"X-HOTMART-HOTTOK": hottok} if hottok is not None else {},
    )


def test_webhook_hotmart_get(client):
    resp = client.get("/webhooks/hotmart")
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True


def test_webhook_sem_hottok_configurado(client, app):
    app.config["HOTMART_HOTTOK"] = ""
    resp = _post(client, _payload())
    assert resp.status_code == 503


def test_webhook_hottok_invalido(client, app):
    app.config["HOTMART_HOTTOK"] = HOTTOK
    resp = _post(client, _payload(), hottok="errado")
    assert resp.status_code == 401


def test_compra_aprovada_libera_usuario_existente(client, app):
    app.config["HOTMART_HOTTOK"] = HOTTOK
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Cliente Hot",
            "cliente.hotmart@email.com",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
        uid = Usuario.query.filter_by(username="cliente.hotmart@email.com").one().id

    resp = _post(client, _payload())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["ok"] is True
    assert body["acao"] == "liberou"

    with app.app_context():
        usuario = db.session.get(Usuario, uid)
        assert usuario_tem_acesso(usuario) is True
        pedido = HotmartPedido.query.filter_by(transacao="HP-1").one()
        assert pedido.status == STATUS_APLICADO
        assert pedido.usuario_id == uid


def test_compra_sem_conta_fica_pendente_e_libera_no_cadastro(client, app):
    app.config["HOTMART_HOTTOK"] = HOTTOK
    email = "novo.hotmart@email.com"
    resp = _post(client, _payload(email=email, tx="HP-pendente"))
    assert resp.status_code == 200
    assert resp.get_json()["acao"] == "pendente"

    with app.app_context():
        pedido = HotmartPedido.query.filter_by(transacao="HP-pendente").one()
        assert pedido.status == STATUS_PENDENTE
        assert pedido.usuario_id is None

    resp = client.post(
        "/cadastro",
        data={
            "nome": "Novo Hot",
            "username": email,
            "senha": "senha123",
            "senha2": "senha123",
        },
        follow_redirects=False,
    )
    assert resp.status_code in {302, 303}

    with app.app_context():
        usuario = Usuario.query.filter_by(username=email).one()
        assert usuario_tem_acesso(usuario) is True
        pedido = HotmartPedido.query.filter_by(transacao="HP-pendente").one()
        assert pedido.status == STATUS_APLICADO
        assert pedido.usuario_id == usuario.id


def test_reembolso_bloqueia(client, app):
    app.config["HOTMART_HOTTOK"] = HOTTOK
    email = "reembolso.hotmart@email.com"
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Reembolso",
            email,
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    assert _post(client, _payload(email=email, tx="HP-ref")).status_code == 200
    resp = _post(client, _payload(email=email, tx="HP-ref", evento="PURCHASE_REFUNDED"))
    assert resp.status_code == 200
    assert resp.get_json()["acao"] == "bloqueou"
    with app.app_context():
        usuario = Usuario.query.filter_by(username=email).one()
        assert usuario.assinatura_ativa is False


def test_obrigado_hotmart_publico(client):
    resp = client.get("/assinatura/hotmart-obrigado")
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "Hotmart" in html
    assert "/cadastro" in html


def test_evento_duplicado_nao_quebra(client, app):
    app.config["HOTMART_HOTTOK"] = HOTTOK
    email = "dup.hotmart@email.com"
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Dup",
            email,
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
    assert _post(client, _payload(email=email, tx="HP-dup")).status_code == 200
    resp = _post(client, _payload(email=email, tx="HP-dup"))
    assert resp.status_code == 200
    with app.app_context():
        assert HotmartPedido.query.filter_by(transacao="HP-dup").count() == 1


def test_hottok_e_checkout_pelo_admin(client, app, admin_client):
    app.config["HOTMART_HOTTOK"] = ""
    app.config["HOTMART_CHECKOUT_URL"] = ""
    with app.app_context():
        _definir_cfg(CHAVE_HOTTOK, HOTTOK)
        _definir_cfg(CHAVE_CHECKOUT, "https://pay.hotmart.com/FINUPTESTE")
        db.session.commit()

    resp = client.get("/api/checkout-hotmart")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["habilitado"] is True
    assert body["url"] == "https://pay.hotmart.com/FINUPTESTE"

    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Via Admin",
            "via.admin.hotmart@email.com",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
    resp = _post(client, _payload(email="via.admin.hotmart@email.com", tx="HP-admin"))
    assert resp.status_code == 200
    assert resp.get_json()["acao"] == "liberou"

    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert "Hotmart" in html
    assert "/webhooks/hotmart" in html
