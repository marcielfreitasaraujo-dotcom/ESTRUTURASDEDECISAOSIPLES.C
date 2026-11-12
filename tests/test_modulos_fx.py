"""Etapa 4/6: módulos no FinUP Design System — funções novas e telas."""

from datetime import date, timedelta
from decimal import Decimal

from app.extensions import db
from app.models import Conta, ContaPagar, Movimentacao


def _movs(app, n, tipo="despesa", valor="10.00"):
    hoje = date.today()
    with app.app_context():
        conta = Conta.query.filter_by(usuario_id=1).first()
        for i in range(n):
            db.session.add(Movimentacao(
                usuario_id=1, conta_id=conta.id, tipo=tipo, descricao=f"Teste {tipo} {i}",
                valor=Decimal(valor), data=hoje - timedelta(days=i % 20), forma_pagamento="pix", ativo=True,
            ))
        db.session.commit()


def test_movimentacoes_pagina_de_30_em_30(admin_client, app):
    _movs(app, 65)
    html = admin_client.get("/movimentacoes?periodo=ultimos_30").get_data(as_text=True)
    assert "Mostrando 1–30 de 65" in html
    assert 'aria-label="Próxima página"' in html
    html3 = admin_client.get("/movimentacoes?periodo=ultimos_30&pagina=3").get_data(as_text=True)
    assert "Mostrando 61–65 de 65" in html3
    # página fora do intervalo cai na última, sem erro
    assert admin_client.get("/movimentacoes?periodo=ultimos_30&pagina=99").status_code == 200
    assert admin_client.get("/movimentacoes?pagina=abc").status_code == 200


def test_paginacao_preserva_filtros(admin_client, app):
    _movs(app, 40, tipo="receita")
    html = admin_client.get("/movimentacoes?periodo=ultimos_30&tipo=receita").get_data(as_text=True)
    assert "tipo=receita" in html and "pagina=2" in html
    assert "<h1 class=\"fx-h1\">Receitas</h1>" in html


def test_totais_do_filtro(admin_client, app):
    _movs(app, 3, tipo="receita", valor="100.00")
    _movs(app, 2, tipo="despesa", valor="30.00")
    html = admin_client.get("/movimentacoes?periodo=ultimos_30").get_data(as_text=True)
    assert "Entradas" in html and "Saídas" in html and "Resultado" in html
    assert "R$ 300,00" in html  # entradas
    assert "R$ 60,00" in html   # saídas
    assert "R$ 240,00" in html  # resultado


def test_janela_lancamento_mantem_campos(admin_client):
    html = admin_client.get("/").get_data(as_text=True)
    for gancho in ('id="modal-lancamento"', 'id="form-lancamento"', 'id="campo-tipo"', 'name="valor"',
                   'name="descricao"', 'id="campo-categoria"', 'name="conta_id"', 'id="campo-destino"',
                   'name="forma_pagamento"', 'name="comprovante"', 'name="observacao"', 'data-set-tipo="transferencia"'):
        assert gancho in html
    # conta de destino começa escondida (só aparece em transferência)
    assert 'id="wrap-destino" hidden' in html


def test_vencimentos_calendario(admin_client, app):
    hoje = date.today()
    with app.app_context():
        db.session.add(ContaPagar(usuario_id=1, tipo="pagar", descricao="Luz do mês", valor=Decimal("150.00"),
                                  vencimento=date(hoje.year, hoje.month, 10), status="pendente", ativo=True))
        db.session.commit()
    html = admin_client.get(f"/vencimentos?ver=calendario&mes={hoje.strftime('%Y-%m')}").get_data(as_text=True)
    assert 'class="fx-cal"' in html
    assert "Luz do mês" in html
    assert "R$ 150,00" in html
    # mês inválido não quebra
    assert admin_client.get("/vencimentos?ver=calendario&mes=xx").status_code == 200


def test_vencimentos_lista_tem_selos(admin_client, app):
    with app.app_context():
        db.session.add(ContaPagar(usuario_id=1, tipo="pagar", descricao="Boleto vencido",
                                  valor=Decimal("80.00"), vencimento=date.today() - timedelta(days=3),
                                  status="pendente", ativo=True))
        db.session.commit()
    html = admin_client.get("/vencimentos?situacao=atrasadas").get_data(as_text=True)
    assert "Boleto vencido" in html
    assert "fx-badge--neg" in html and "Atrasado" in html


def test_telas_dos_modulos_abrem(admin_client):
    for url, texto in (
        ("/contas", "Transferir entre contas"),
        ("/cartoes", "Novo cartão"),
        ("/orcamento", "Limites por categoria"),
        ("/recorrentes", "Contas recorrentes"),
        ("/relatorios", "Gastos por categoria"),
        ("/vencimentos?tipo=receber", "Contas a receber"),
        ("/configuracoes", "Visual FinUP"),
    ):
        resp = admin_client.get(url)
        assert resp.status_code == 200, url
        assert texto in resp.get_data(as_text=True), url


def test_orcamento_salva_limite(admin_client, app):
    from app.models import Categoria, Orcamento

    with app.app_context():
        cat = Categoria.query.filter(Categoria.tipo == "despesa").first()
        cid = cat.id
    comp = date.today().strftime("%Y-%m")
    resp = admin_client.post("/orcamento/salvar", data={"competencia": comp, f"limite_{cid}": "250,00"})
    assert resp.status_code == 302
    with app.app_context():
        orc = Orcamento.query.filter_by(categoria_id=cid, ativo=True).first()
        assert orc is not None and orc.limite == Decimal("250.00")
    assert "No controle" in admin_client.get("/orcamento").get_data(as_text=True)
