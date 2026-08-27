from datetime import date

from flask import Blueprint, jsonify, render_template, request
from flask_login import current_user, login_required

from app.services import dashboard as dash
from app.utils.casa import id_casa
from app.utils.formatters import periodo_preset

dashboard_bp = Blueprint("dashboard", __name__)


def _periodo():
    chave = request.args.get("periodo", "ultimos_90")
    return chave, *periodo_preset(
        chave,
        request.args.get("inicio"),
        request.args.get("fim"),
    )


@dashboard_bp.route("/")
@login_required
def index():
    chave, inicio, fim = _periodo()
    uid = id_casa()
    resumo = dash.resumo_periodo(uid, inicio, fim)
    ultimas = dash.ultimas_movimentacoes(uid)
    receitas_despesas = dash.receitas_despesas_por_dia(uid, inicio, fim)
    categorias = dash.gastos_por_categoria(uid, inicio, fim)
    evolucao = dash.evolucao_saldo(uid, inicio, fim)
    from app.services.vencimentos import proximos, sincronizar_status
    from app.extensions import db

    sincronizar_status(uid)
    db.session.commit()
    from app.services.orcamentos import estourados
    from app.services.cartoes import (
        competencia_da_compra,
        parcelas_competencia,
        query_cartoes,
        total_fatura,
        vencimento_fatura,
    )

    hoje = date.today()
    faturas_abertas = []
    for cartao in query_cartoes(uid).all():
        competencia = competencia_da_compra(cartao, hoje)
        aberto = total_fatura(parcelas_competencia(cartao, competencia), somente_abertas=True)
        if aberto > 0:
            faturas_abertas.append(
                {
                    "cartao": cartao,
                    "aberto": aberto,
                    "vencimento": vencimento_fatura(cartao, competencia),
                }
            )
    return render_template(
        "dashboard/index.html",
        resumo=resumo,
        ultimas=ultimas,
        periodo=chave,
        grafico_rd=receitas_despesas,
        grafico_cat=categorias,
        grafico_evo=evolucao,
        proximos_pagar=proximos(uid, "pagar", 5),
        proximos_receber=proximos(uid, "receber", 4),
        hoje=hoje,
        orcamentos_estouro=estourados(uid, hoje.year, hoje.month),
        faturas_abertas=faturas_abertas,
    )


@dashboard_bp.route("/api/dashboard/graficos")
@login_required
def graficos():
    _, inicio, fim = _periodo()
    uid = id_casa()
    return jsonify(
        {
            "receitas_despesas": dash.receitas_despesas_por_dia(uid, inicio, fim),
            "categorias": dash.gastos_por_categoria(uid, inicio, fim),
            "evolucao": dash.evolucao_saldo(uid, inicio, fim),
        }
    )
