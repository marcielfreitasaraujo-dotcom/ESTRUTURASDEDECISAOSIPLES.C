from datetime import date

from flask import Blueprint, jsonify, render_template, request
from flask_login import current_user, login_required

from app.services import dashboard as dash
from app.utils.formatters import periodo_preset

dashboard_bp = Blueprint("dashboard", __name__)


def _periodo():
    chave = request.args.get("periodo", "este_mes")
    return chave, *periodo_preset(
        chave,
        request.args.get("inicio"),
        request.args.get("fim"),
    )


@dashboard_bp.route("/")
@login_required
def index():
    chave, inicio, fim = _periodo()
    resumo = dash.resumo_periodo(current_user.id, inicio, fim)
    ultimas = dash.ultimas_movimentacoes(current_user.id)
    receitas_despesas = dash.receitas_despesas_por_dia(current_user.id, inicio, fim)
    categorias = dash.gastos_por_categoria(current_user.id, inicio, fim)
    evolucao = dash.evolucao_saldo(current_user.id, inicio, fim)
    return render_template(
        "dashboard/index.html",
        resumo=resumo,
        ultimas=ultimas,
        periodo=chave,
        grafico_rd=receitas_despesas,
        grafico_cat=categorias,
        grafico_evo=evolucao,
        hoje=date.today(),
    )


@dashboard_bp.route("/api/dashboard/graficos")
@login_required
def graficos():
    _, inicio, fim = _periodo()
    return jsonify(
        {
            "receitas_despesas": dash.receitas_despesas_por_dia(current_user.id, inicio, fim),
            "categorias": dash.gastos_por_categoria(current_user.id, inicio, fim),
            "evolucao": dash.evolucao_saldo(current_user.id, inicio, fim),
        }
    )
