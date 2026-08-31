from datetime import date, timedelta

import pytest

from app.extensions import db
from app.models import Usuario
from app.services.seed import criar_membro_familia
from app.utils.assinatura import (
    bloqueio_assinatura_ativo,
    definir_bloqueio_assinatura,
    liberar_assinatura,
    liberar_teste_gratis,
    obter_plano_assinatura,
    pode_iniciar_teste_gratis,
    resumo_financeiro_assinatura,
    salvar_plano_assinatura,
    sincronizar_vencimentos,
    usuario_tem_acesso,
)


def _login(client, username, senha):
    client.get("/logout", follow_redirects=True)
    resp = client.post("/login", data={"username": username, "senha": senha}, follow_redirects=False)
    assert resp.status_code == 302
    client.get(resp.headers["Location"], follow_redirects=True)
    return client.get("/", follow_redirects=True)


def test_admin_ve_aba_assinatura(admin_client):
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert admin_client.get("/assinatura").status_code == 200
    assert "Assinatura" in html
    assert "Bloqueio" in html
    assert "Assinaturas ativas" in html
    assert "Valores da assinatura" in html
    home = admin_client.get("/").get_data(as_text=True)
    assert "Financeiro" in home
    assert 'href="/assinatura"' in home


def test_membro_nao_acessa_aba_assinatura(admin_client, client, app):
    with app.app_context():
        criar_membro_familia("Ana Fam", "ana_ass", "senha123", eh_familia=True)
        db.session.commit()
    _login(client, "ana_ass", "senha123")
    assert client.get("/assinatura").status_code == 403
    home = client.get("/").get_data(as_text=True)
    assert 'href="/assinatura"' not in home


def test_familia_acessa_sem_assinatura(admin_client, client, app):
    with app.app_context():
        criar_membro_familia(
            "Beta Fam",
            "beta_fam",
            "senha123",
            eh_familia=True,
            assinatura_ativa=False,
        )
        db.session.commit()
    resp = _login(client, "beta_fam", "senha123")
    assert resp.status_code == 200
    assert client.get("/contas").status_code == 200
    assert "Assinatura necessária" not in client.get("/").get_data(as_text=True)


def test_sem_familia_sem_pagamento_e_bloqueado(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Pago Nao",
            "pago_nao",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
        assert bloqueio_assinatura_ativo() is True
    client.get("/logout", follow_redirects=True)
    resp = client.post(
        "/login",
        data={"username": "pago_nao", "senha": "senha123"},
        follow_redirects=False,
    )
    assert resp.status_code == 302
    loc = resp.headers.get("Location") or ""
    assert "/sessao/iniciar" in loc
    assert "bloqueado" in loc
    client.get(loc)  # marca sessão do navegador (JS não roda no test client)
    pagina = client.get("/assinatura/bloqueado", follow_redirects=True)
    assert pagina.status_code == 200
    html = pagina.get_data(as_text=True)
    assert "Escolha como começar" in html
    assert client.get("/contas", follow_redirects=True).status_code == 200
    assert "Escolha como começar" in client.get("/contas", follow_redirects=True).get_data(as_text=True)
    assert client.get("/assinatura/bloqueado").status_code == 200


def test_pix_na_tela_bloqueado_e_confirmacao_automatica_libera(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        salvar_plano_assinatura(
            nome="Mensal",
            valor="29.90",
            dias=30,
            instrucoes="Pague no PIX",
            pix_chave="pix-teste@example.com",
            pix_nome="Maciel FinUP",
            pix_cidade="Fortaleza",
        )
        criar_membro_familia(
            "Cliente Pix",
            "cliente_pix",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    _login(client, "cliente_pix", "senha123")
    pagina = client.get("/assinatura/bloqueado", follow_redirects=True)
    html = pagina.get_data(as_text=True)
    assert pagina.status_code == 200
    assert "Pagar assinatura" in html
    assert "PIX copia e cola" in html
    assert "Já paguei" not in html
    assert "data:image/png;base64," in html
    assert "000201" in html

    from app.models import CobrancaAssinatura

    with app.app_context():
        u = Usuario.query.filter_by(username="cliente_pix").first()
        cobranca = (
            CobrancaAssinatura.query.filter_by(usuario_id=u.id)
            .order_by(CobrancaAssinatura.id.desc())
            .first()
        )
        assert cobranca is not None
        cobranca_id = cobranca.id

    resp = client.post(f"/assinatura/test/simular-pagamento/{cobranca_id}")
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True
    assert client.get("/contas").status_code == 200
    with app.app_context():
        u = Usuario.query.filter_by(username="cliente_pix").first()
        assert u.assinatura_ativa is True
        assert u.assinatura_vence_em is not None


def test_marcar_pago_libera_acesso(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        membro = criar_membro_familia(
            "Cliente X",
            "cliente_x",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()
        membro_id = membro.id

    admin_client.post(
        f"/assinatura/{membro_id}/pagamento",
        data={"acao": "liberar"},
        follow_redirects=True,
    )
    with app.app_context():
        u = db.session.get(Usuario, membro_id)
        assert u.assinatura_ativa is True
        assert u.assinatura_vence_em is not None
        assert u.assinatura_vence_em >= date.today()

    _login(client, "cliente_x", "senha123")
    assert client.get("/contas").status_code == 200
    assert "Assinatura necessária" not in client.get("/").get_data(as_text=True)


def test_desligar_bloqueio_libera_todos(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        criar_membro_familia(
            "Emergencia",
            "emerg_user",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    admin_client.post("/assinatura/bloqueio", data={"ativo": "0"}, follow_redirects=True)
    with app.app_context():
        assert bloqueio_assinatura_ativo() is False

    _login(client, "emerg_user", "senha123")
    assert client.get("/contas").status_code == 200


def test_saude_continua_ok_com_bloqueio(client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        db.session.commit()
    resp = client.get("/api/saude")
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True


def test_admin_sempre_tem_acesso_mesmo_sem_flags(app):
    with app.app_context():
        admin = Usuario.query.filter_by(perfil="admin").first()
        admin.eh_familia = False
        admin.assinatura_ativa = False
        db.session.commit()
        assert usuario_tem_acesso(admin) is True


def test_salvar_plano_e_resumo_financeiro(admin_client, app):
    resp = admin_client.post(
        "/assinatura/plano",
        data={
            "plano_nome": "Pro",
            "plano_valor": "49,90",
            "plano_dias": "30",
            "plano_instrucoes": "PIX 11999999999",
            "pix_chave": "pix@finup.app",
            "pix_nome": "FinUP",
            "pix_cidade": "Sao Paulo",
        },
        follow_redirects=True,
    )
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "Pro" in html
    with app.app_context():
        plano = obter_plano_assinatura()
        assert plano["nome"] == "Pro"
        assert str(plano["valor"]) == "49.90"
        assert plano["dias"] == 30
        assert "11999999999" in plano["instrucoes"]
        assert plano["pix_chave"] == "pix@finup.app"
        assert plano["pix_configurado"] is True

        definir_bloqueio_assinatura(True)
        ativo = criar_membro_familia(
            "Ativo 1", "fin_ativo", "senha123", eh_familia=False, assinatura_ativa=False
        )
        liberar_assinatura(ativo, dias=30)
        criar_membro_familia(
            "Bloq 1", "fin_bloq", "senha123", eh_familia=False, assinatura_ativa=False
        )
        criar_membro_familia(
            "Fam 1", "fin_fam", "senha123", eh_familia=True, assinatura_ativa=False
        )
        db.session.commit()
        resumo = resumo_financeiro_assinatura()
        assert resumo["ativos"] >= 1
        assert resumo["bloqueados"] >= 1
        assert resumo["familia"] >= 1


def test_vencimento_bloqueia_automaticamente(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        membro = criar_membro_familia(
            "Venceu",
            "venceu_user",
            "senha123",
            eh_familia=False,
            assinatura_ativa=True,
        )
        membro.assinatura_vence_em = date.today() - timedelta(days=1)
        db.session.commit()
        assert sincronizar_vencimentos() >= 1
        db.session.commit()
        assert db.session.get(Usuario, membro.id).assinatura_ativa is False

    _login(client, "venceu_user", "senha123")
    resp = client.get("/contas", follow_redirects=True)
    assert "Escolha como começar" in resp.get_data(as_text=True)


def test_cadastro_publico_cria_conta_bloqueada(client, app):
    from app.services.email import limpar_outbox
    from app.utils.tokens import gerar_token_verificacao

    limpar_outbox()
    with app.app_context():
        definir_bloqueio_assinatura(True)
        salvar_plano_assinatura(
            nome="Mensal",
            valor="29.90",
            dias=30,
            instrucoes="Pague via PIX teste",
        )
        db.session.commit()

    assert client.get("/cadastro").status_code == 200
    login_html = client.get("/login").get_data(as_text=True)
    assert "teste grátis" in login_html.lower()

    resp = client.post(
        "/cadastro",
        data={
            "nome": "Novo Cliente",
            "username": "novo_cli@exemplo.com",
            "senha": "senha123",
            "senha2": "senha123",
        },
        follow_redirects=False,
    )
    assert resp.status_code == 302
    with app.app_context():
        u = Usuario.query.filter_by(username="novo_cli@exemplo.com").first()
        assert u is not None
        assert u.eh_familia is False
        assert u.assinatura_ativa is False
        assert u.email_verificado is False
        token = gerar_token_verificacao(u.id)

    client.get(resp.headers["Location"], follow_redirects=True)
    assert "Confirme seu e-mail" in client.get("/aguardando-verificacao").get_data(as_text=True)

    client.get(f"/verificar-email/{token}", follow_redirects=True)
    with app.app_context():
        assert Usuario.query.filter_by(username="novo_cli@exemplo.com").first().email_verificado is True

    bloqueado = client.get("/assinatura/bloqueado")
    assert bloqueado.status_code == 200
    texto = bloqueado.get_data(as_text=True)
    assert "Escolha como começar" in texto
    assert "Teste grátis" in texto
    assert "Pague via PIX teste" in texto
    assert (
        client.get("/contas", follow_redirects=True)
        .get_data(as_text=True)
        .find("Escolha como começar")
        >= 0
    )


def test_admin_ve_botao_remover_usuario(admin_client, app):
    with app.app_context():
        criar_membro_familia("Removivel", "rem_user", "senha123", eh_familia=True)
        db.session.commit()
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert "Remover usuário" in html
    assert "form-remover-usuario" in html
    assert "modal-remover-usuario" in html
    assert "senha_confirmacao" in html


def test_remover_usuario_exige_confirmacao(admin_client, app):
    with app.app_context():
        membro = criar_membro_familia("Nao Apaga", "nao_apaga", "senha123", eh_familia=False)
        db.session.commit()
        uid = membro.id

    resp = admin_client.post(
        f"/assinatura/{uid}/remover",
        data={"senha_confirmacao": "senha_errada"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "Senha incorreta" in resp.get_data(as_text=True)
    with app.app_context():
        assert db.session.get(Usuario, uid) is not None


def test_remover_usuario_com_cobranca_pix(admin_client, app):
    from app.models import CobrancaAssinatura
    from app.models.cobranca_assinatura import METODO_PIX, PROVEDOR_MERCADOPAGO, STATUS_PENDENTE

    with app.app_context():
        membro = criar_membro_familia("Com Pix", "com_pix", "senha123", eh_familia=False)
        db.session.add(
            CobrancaAssinatura(
                usuario_id=membro.id,
                provedor=PROVEDOR_MERCADOPAGO,
                metodo=METODO_PIX,
                valor="9.90",
                status=STATUS_PENDENTE,
                referencia_externa="999001",
            )
        )
        db.session.commit()
        uid = membro.id

    resp = admin_client.post(
        f"/assinatura/{uid}/remover",
        data={"senha_confirmacao": "admin123"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "removido permanentemente" in resp.get_data(as_text=True)
    with app.app_context():
        assert db.session.get(Usuario, uid) is None
        assert CobrancaAssinatura.query.filter_by(usuario_id=uid).count() == 0


def test_remover_usuario_com_confirmacao(admin_client, app):
    with app.app_context():
        membro = criar_membro_familia("Apaga Ja", "apaga_ja", "senha123", eh_familia=True)
        db.session.commit()
        uid = membro.id

    resp = admin_client.post(
        f"/assinatura/{uid}/remover",
        data={"senha_confirmacao": "admin123"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "removido permanentemente" in resp.get_data(as_text=True)
    with app.app_context():
        assert db.session.get(Usuario, uid) is None
        assert Usuario.query.filter_by(username="apaga_ja").first() is None


def test_nao_remove_admin(admin_client, app):
    with app.app_context():
        admin = Usuario.query.filter_by(perfil="admin").first()
        admin_id = admin.id
        admin_user = admin.username

    resp = admin_client.post(
        f"/assinatura/{admin_id}/remover",
        data={"senha_confirmacao": admin_user},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    html = resp.get_data(as_text=True).lower()
    assert "administrador" in html or "própria conta" in html or "propria conta" in html
    with app.app_context():
        assert db.session.get(Usuario, admin_id) is not None


def test_teste_gratis_libera_acesso_por_24h(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        salvar_plano_assinatura(
            nome="Mensal",
            valor="29.90",
            dias=30,
            instrucoes="Teste",
            teste_ativo=True,
            teste_horas=24,
        )
        criar_membro_familia(
            "Trial User",
            "trial_user",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    _login(client, "trial_user", "senha123")
    pagina = client.get("/assinatura/bloqueado", follow_redirects=True)
    html = pagina.get_data(as_text=True)
    assert "Iniciar teste grátis de 24h" in html

    resp = client.post("/assinatura/iniciar-teste-gratis", follow_redirects=True)
    assert resp.status_code == 200
    assert "Teste grátis ativado" in resp.get_data(as_text=True)
    assert client.get("/contas").status_code == 200

    with app.app_context():
        u = Usuario.query.filter_by(username="trial_user").first()
        assert u.teste_gratis_usado is True
        assert u.assinatura_ativa is True
        assert u.assinatura_expira_em is not None
        assert usuario_tem_acesso(u) is True
        assert pode_iniciar_teste_gratis(u) is False

        with pytest.raises(ValueError, match="já usou"):
            liberar_teste_gratis(u)


def test_cartao_mock_libera_acesso(admin_client, client, app):
    with app.app_context():
        definir_bloqueio_assinatura(True)
        salvar_plano_assinatura(
            nome="Mensal",
            valor="29.90",
            dias=30,
            instrucoes="Pague",
            pix_chave="pix@finup.app",
        )
        criar_membro_familia(
            "Cliente Card",
            "cliente_card",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        db.session.commit()

    _login(client, "cliente_card", "senha123")
    resp = client.post(
        "/assinatura/pagar-cartao",
        json={"token": "mock", "payment_method_id": "visa", "installments": 3},
    )
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "pago"
    with app.app_context():
        u = Usuario.query.filter_by(username="cliente_card").first()
        assert u.assinatura_ativa is True


def test_teste_gratis_expirado_bloqueia(admin_client, client, app):
    from datetime import datetime, timedelta

    from app.models.usuario import agora

    with app.app_context():
        definir_bloqueio_assinatura(True)
        membro = criar_membro_familia(
            "Exp Trial",
            "exp_trial",
            "senha123",
            eh_familia=False,
            assinatura_ativa=False,
        )
        liberar_teste_gratis(membro, horas=24)
        membro.assinatura_expira_em = agora() - timedelta(hours=1)
        db.session.commit()

    _login(client, "exp_trial", "senha123")
    resp = client.get("/contas", follow_redirects=True)
    assert "Escolha como começar" in resp.get_data(as_text=True)
    assert "já usou o teste grátis" in resp.get_data(as_text=True).lower()
