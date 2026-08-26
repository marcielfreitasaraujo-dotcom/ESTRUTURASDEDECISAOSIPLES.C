from datetime import date, timedelta

from app.extensions import db
from app.models import Usuario
from app.services.seed import criar_membro_familia
from app.utils.assinatura import (
    bloqueio_assinatura_ativo,
    definir_bloqueio_assinatura,
    liberar_assinatura,
    obter_plano_assinatura,
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
    _login(client, "pago_nao", "senha123")
    resp = client.get("/contas", follow_redirects=True)
    assert resp.status_code == 200
    assert "Assinatura necessária" in resp.get_data(as_text=True)
    assert client.get("/assinatura/bloqueado").status_code == 200


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
    assert "Assinatura necessária" in resp.get_data(as_text=True)


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
    assert "Criar conta e assinar" in login_html

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
    assert "Assinatura necessária" in texto
    assert "Pague via PIX teste" in texto
    assert (
        client.get("/contas", follow_redirects=True)
        .get_data(as_text=True)
        .find("Assinatura necessária")
        >= 0
    )


def test_admin_ve_botao_remover_usuario(admin_client, app):
    with app.app_context():
        criar_membro_familia("Removivel", "rem_user", "senha123", eh_familia=True)
        db.session.commit()
    html = admin_client.get("/assinatura").get_data(as_text=True)
    assert "Remover usuário" in html
    assert "form-remover-usuario" in html


def test_remover_usuario_exige_confirmacao(admin_client, app):
    with app.app_context():
        membro = criar_membro_familia("Nao Apaga", "nao_apaga", "senha123", eh_familia=False)
        db.session.commit()
        uid = membro.id

    resp = admin_client.post(
        f"/assinatura/{uid}/remover",
        data={"confirmacao": "errado"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "Remoção cancelada" in resp.get_data(as_text=True)
    with app.app_context():
        assert db.session.get(Usuario, uid) is not None


def test_remover_usuario_com_confirmacao(admin_client, app):
    with app.app_context():
        membro = criar_membro_familia("Apaga Ja", "apaga_ja", "senha123", eh_familia=True)
        db.session.commit()
        uid = membro.id

    resp = admin_client.post(
        f"/assinatura/{uid}/remover",
        data={"confirmacao": "apaga_ja"},
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
        data={"confirmacao": admin_user},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    assert "administrador" in resp.get_data(as_text=True).lower()
    with app.app_context():
        assert db.session.get(Usuario, admin_id) is not None
