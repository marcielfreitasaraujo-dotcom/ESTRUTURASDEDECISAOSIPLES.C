from datetime import date, timedelta
from decimal import Decimal

from app.extensions import db
from app.models import Conta, Movimentacao
from app.services import dashboard as dash


def test_periodo_anterior_tem_mesmo_tamanho():
    ini, fim = dash.periodo_anterior(date(2026, 11, 1), date(2026, 11, 30))
    assert (ini, fim) == (date(2026, 10, 2), date(2026, 10, 31))


def test_variacao_pct():
    assert dash.variacao_pct(Decimal("110"), Decimal("100")) == 10.0
    assert dash.variacao_pct(Decimal("0"), Decimal("0")) == 0.0
    assert dash.variacao_pct(Decimal("5"), Decimal("0")) is None
    assert dash.variacao_pct(Decimal("50"), Decimal("100")) == -50.0


def test_comparativo_usa_janela_anterior(app):
    hoje = date.today()
    with app.app_context():
        conta = Conta.query.filter_by(usuario_id=1).first()
        for dias, valor in ((2, "200.00"), (40, "100.00")):
            db.session.add(Movimentacao(
                usuario_id=1, conta_id=conta.id, tipo="receita", descricao="Teste",
                valor=Decimal(valor), data=hoje - timedelta(days=dias), forma_pagamento="pix", ativo=True,
            ))
        db.session.commit()
        inicio, fim = hoje - timedelta(days=29), hoje
        atual = dash.resumo_periodo(1, inicio, fim)
        cmp = dash.comparativo(1, inicio, fim, atual)
        assert cmp["anterior"]["receitas"] == Decimal("100.00")
        assert atual["receitas"] == Decimal("200.00")
        assert cmp["pct"]["receitas"] == 100.0


def test_painel_novo_renderiza(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    assert "base_fx" not in html  # nada de nome de template vazando
    assert "css/fx-shell.css" in html
    assert "icons/lucide.svg" in html
    for texto in ("Receitas", "Despesas", "Saldo do período", "Próximos vencimentos",
                  "Suas contas", "Últimas movimentações", "Sistema AraujoIA"):
        assert texto in html
    # ganchos do app.js continuam presentes
    for gancho in ('id="sidebar"', 'id="busca-global"', "data-open-lancamento", 'id="notify-panel"'):
        assert gancho in html


def test_painel_aceita_todos_os_periodos(admin_client):
    for p in ("hoje", "esta_semana", "este_mes", "ultimos_30", "ultimos_90", "este_ano"):
        assert admin_client.get(f"/?periodo={p}").status_code == 200


def test_legenda_agrupa_outras():
    dados = {"labels": list("abcdefghij"), "valores": [10.0] * 10, "cores": ["#000"] * 10}
    leg = dash.legenda_categorias(dados)
    assert len(leg["itens"]) == 7
    assert leg["itens"][-1]["nome"] == "Outras"
    assert round(sum(i["pct"] for i in leg["itens"])) == 100
