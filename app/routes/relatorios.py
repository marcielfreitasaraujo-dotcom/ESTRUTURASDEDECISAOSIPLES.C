from flask import Blueprint, render_template, request, send_file
from flask_login import current_user, login_required

from app.services.relatorios import gerar_excel, gerar_pdf, montar
from app.utils.formatters import periodo_preset
from app.utils.casa import id_casa

relatorios_bp = Blueprint("relatorios", __name__)


def _periodo():
    chave = request.args.get("periodo", "este_mes")
    inicio, fim = periodo_preset(chave, request.args.get("inicio"), request.args.get("fim"))
    return chave, inicio, fim


@relatorios_bp.route("/relatorios")
@login_required
def index():
    chave, inicio, fim = _periodo()
    dados = montar(id_casa(), inicio, fim)
    return render_template(
        "relatorios/index.html",
        periodo=chave,
        inicio=inicio,
        fim=fim,
        resumo=dados["resumo"],
        categorias=dados["categorias"],
        lancamentos=dados["lancamentos"],
        titulo_periodo=dados["titulo_periodo"],
    )


@relatorios_bp.route("/relatorios/pdf")
@login_required
def pdf():
    _, inicio, fim = _periodo()
    arquivo = gerar_pdf(id_casa(), inicio, fim, current_user.nome)
    nome = f"fincasa-relatorio-{inicio.isoformat()}_{fim.isoformat()}.pdf"
    return send_file(arquivo, mimetype="application/pdf", as_attachment=True, download_name=nome)


@relatorios_bp.route("/relatorios/excel")
@login_required
def excel():
    _, inicio, fim = _periodo()
    arquivo = gerar_excel(id_casa(), inicio, fim)
    nome = f"fincasa-relatorio-{inicio.isoformat()}_{fim.isoformat()}.xlsx"
    return send_file(
        arquivo,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=nome,
    )
