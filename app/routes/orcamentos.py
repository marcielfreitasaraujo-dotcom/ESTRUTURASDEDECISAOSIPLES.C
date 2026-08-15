from datetime import date

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.services.auditoria import registrar
from app.services.orcamentos import painel, salvar_limites
from app.utils.formatters import nome_mes, parse_moeda, somar_meses
from app.utils.casa import id_casa

orcamentos_bp = Blueprint("orcamentos", __name__)


def _mes_atual():
    hoje = date.today()
    texto = request.args.get("competencia") or request.form.get("competencia")
    if texto:
        try:
            ano, mes = texto.split("-")[:2]
            return date(int(ano), int(mes), 1)
        except (ValueError, TypeError):
            pass
    return date(hoje.year, hoje.month, 1)


@orcamentos_bp.route("/orcamento")
@login_required
def index():
    competencia = _mes_atual()
    itens = painel(id_casa(), competencia.year, competencia.month)
    com_limite = [i for i in itens if i["limite"] > 0]
    total_limite = sum((i["limite"] for i in com_limite), 0)
    total_gasto = sum((i["gasto"] for i in com_limite), 0)
    return render_template(
        "orcamentos/index.html",
        competencia=competencia,
        competencia_ant=somar_meses(competencia, -1),
        competencia_prox=somar_meses(competencia, 1),
        titulo_mes=nome_mes(competencia.year, competencia.month),
        itens=itens,
        total_limite=total_limite,
        total_gasto=total_gasto,
    )


@orcamentos_bp.route("/orcamento/salvar", methods=["POST"])
@login_required
def salvar():
    competencia = _mes_atual()
    pares = []
    for chave, valor in request.form.items():
        if not chave.startswith("limite_"):
            continue
        try:
            categoria_id = int(chave.split("_", 1)[1])
        except ValueError:
            continue
        pares.append((categoria_id, parse_moeda(valor)))
    qtd = salvar_limites(id_casa(), competencia.year, competencia.month, pares)
    registrar("editar", "orcamento", None, competencia.isoformat())
    db.session.commit()
    flash(f"Orçamento de {nome_mes(competencia.year, competencia.month)} salvo ({qtd} categoria(s)).", "sucesso")
    return redirect(
        url_for("orcamentos.index", competencia=competencia.strftime("%Y-%m"))
    )
