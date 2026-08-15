from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Cartao, Conta, Movimentacao, Parcela, Usuario
from app.services.cartoes import competencia_da_compra, dividir_parcelas, limite_usado, parcelas_competencia
from app.services.orcamentos import painel
from app.services.saldo import saldo_conta
from app.utils.formatters import somar_meses


def test_somar_meses():
    assert somar_meses(date(2026, 8, 1), 1) == date(2026, 9, 1)
    assert somar_meses(date(2026, 1, 1), -1) == date(2025, 12, 1)


def test_dividir_parcelas_nao_perde_centavos():
    partes = dividir_parcelas(Decimal("100.00"), 3)
    assert sum(partes, Decimal("0")) == Decimal("100.00")
    assert len(partes) == 3


def test_relatorio_exige_login(client):
    assert client.get("/relatorios").status_code == 302


def test_relatorio_pdf_e_excel(admin_client):
    pdf = admin_client.get("/relatorios/pdf?periodo=este_mes")
    assert pdf.status_code == 200
    assert pdf.mimetype == "application/pdf"
    assert pdf.data[:4] == b"%PDF"

    xlsx = admin_client.get("/relatorios/excel?periodo=este_mes")
    assert xlsx.status_code == 200
    assert xlsx.data[:2] == b"PK"


def test_relatorio_nao_vaza_lancamento_alheio(app, client):
    with app.app_context():
        ana = Usuario(nome="Ana", username="ana_rel", perfil="usuario", ativo=True)
        ana.definir_senha("senha123")
        beta = Usuario(nome="Beta", username="beta_rel", perfil="usuario", ativo=True)
        beta.definir_senha("senha123")
        db.session.add_all([ana, beta])
        db.session.flush()
        conta = Conta(usuario_id=ana.id, nome="Carteira Ana Rel", tipo="carteira", saldo_inicial=0)
        db.session.add(conta)
        db.session.flush()
        db.session.add(
            Movimentacao(
                usuario_id=ana.id,
                conta_id=conta.id,
                tipo="despesa",
                descricao="SegredoAnaXYZ",
                valor=Decimal("33.00"),
                data=date.today(),
                forma_pagamento="dinheiro",
                criado_por=ana.id,
            )
        )
        db.session.commit()

    client.post("/login", data={"username": "beta_rel", "senha": "senha123"})
    html = client.get("/relatorios?periodo=ultimos_30").get_data(as_text=True)
    assert "SegredoAnaXYZ" not in html
    pdf = client.get("/relatorios/pdf?periodo=ultimos_30")
    assert b"SegredoAnaXYZ" not in pdf.data


def test_cartao_compra_e_fatura(admin_client, app):
    resp = admin_client.post(
        "/cartoes/nova",
        data={
            "nome": "Nubank teste",
            "limite": "1000,00",
            "dia_fechamento": "28",
            "dia_vencimento": "10",
        },
        follow_redirects=False,
    )
    assert resp.status_code == 302
    with app.app_context():
        cartao = Cartao.query.filter_by(nome="Nubank teste").first()
        assert cartao is not None
        cartao_id = cartao.id
        conta_id = Conta.query.filter_by(nome="Carteira").first().id
        saldo_antes = saldo_conta(Conta.query.filter_by(nome="Carteira").first())

    admin_client.post(
        f"/cartoes/{cartao_id}/compra",
        data={
            "descricao": "Mercado cartao",
            "valor": "90,00",
            "data": date.today().isoformat(),
            "parcelas": "3",
        },
        follow_redirects=True,
    )
    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        qtd = Parcela.query.filter_by(cartao_id=cartao.id, ativo=True).count()
        assert qtd == 3
        assert limite_usado(cartao) == Decimal("90.00")
        saldo_ainda = saldo_conta(Conta.query.filter_by(nome="Carteira").first())
        assert saldo_ainda == saldo_antes
        competencia = competencia_da_compra(cartao, date.today())

    detalhe = admin_client.get(f"/cartoes/{cartao_id}")
    assert detalhe.status_code == 200
    assert "Mercado cartao" in detalhe.get_data(as_text=True)

    with app.app_context():
        cartao = db.session.get(Cartao, cartao_id)
        abertas = [p for p in parcelas_competencia(cartao, competencia) if not p.pago]
        esperado = sum((p.valor_parcela for p in abertas), Decimal("0"))

    pagar = admin_client.post(
        f"/cartoes/{cartao_id}/pagar",
        data={
            "conta_id": str(conta_id),
            "competencia": competencia.strftime("%Y-%m"),
            "data_pagamento": date.today().isoformat(),
        },
        follow_redirects=True,
    )
    assert pagar.status_code == 200
    with app.app_context():
        carteira = Conta.query.filter_by(nome="Carteira").first()
        assert saldo_conta(carteira) == saldo_antes - esperado
        fatura = Movimentacao.query.filter_by(
            descricao=f"Fatura Nubank teste {competencia.strftime('%m/%Y')}"
        ).first()
        assert fatura is not None


def test_usuario_nao_acessa_cartao_alheio(app, client):
    with app.app_context():
        ana = Usuario(nome="Ana", username="ana_card", perfil="usuario", ativo=True)
        ana.definir_senha("senha123")
        beta = Usuario(nome="Beta", username="beta_card", perfil="usuario", ativo=True)
        beta.definir_senha("senha123")
        db.session.add_all([ana, beta])
        db.session.flush()
        cartao = Cartao(
            usuario_id=ana.id,
            nome="Cartao Ana",
            limite=500,
            dia_fechamento=5,
            dia_vencimento=12,
        )
        db.session.add(cartao)
        db.session.commit()
        cartao_id = cartao.id

    client.post("/login", data={"username": "beta_card", "senha": "senha123"})
    assert client.get(f"/cartoes/{cartao_id}").status_code == 403


def test_orcamento_salva_e_mostra_gasto(admin_client, app):
    with app.app_context():
        from app.models import Categoria

        alimentacao = Categoria.query.filter_by(nome="Alimentação").first()
        cat_id = alimentacao.id
        hoje = date.today()
        carteira_id = Conta.query.filter_by(nome="Carteira").first().id

    admin_client.post(
        "/orcamento/salvar",
        data={
            "competencia": f"{hoje.year}-{hoje.month:02d}",
            f"limite_{cat_id}": "50,00",
        },
        follow_redirects=True,
    )
    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "despesa",
            "valor": "80,00",
            "descricao": "Almoco orcamento",
            "conta_id": str(carteira_id),
            "categoria_id": str(cat_id),
            "data": hoje.isoformat(),
            "forma_pagamento": "dinheiro",
        },
        follow_redirects=True,
    )
    pagina = admin_client.get(f"/orcamento?competencia={hoje.year}-{hoje.month:02d}")
    html = pagina.get_data(as_text=True)
    assert pagina.status_code == 200
    assert "Alimentação" in html
    with app.app_context():
        admin = Usuario.query.filter_by(username="admin").first()
        itens = painel(admin.id, hoje.year, hoje.month)
        alim = next(i for i in itens if i["categoria"].id == cat_id)
        assert alim["limite"] == Decimal("50.00")
        assert alim["gasto"] >= Decimal("80.00")
        assert alim["status"] == "estouro"
