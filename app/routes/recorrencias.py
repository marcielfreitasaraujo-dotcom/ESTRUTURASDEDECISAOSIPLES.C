from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Categoria, Conta, PERIODICIDADES, Recorrencia
from app.models.usuario import agora
from app.services.auditoria import registrar
from app.services.recorrencias import gerar_titulos_recorrentes
from app.utils.formatters import parse_moeda
from app.utils.casa import id_casa
from app.utils.permissoes import exigir_dono

recorrencias_bp = Blueprint("recorrencias", __name__)


def _obter(rec_id: int) -> Recorrencia:
    rec = db.get_or_404(Recorrencia, rec_id)
    exigir_dono(rec.usuario_id)
    return rec


def _contas():
    return (
        Conta.query.filter_by(usuario_id=id_casa(), ativo=True)
        .order_by(Conta.nome)
        .all()
    )


def _categorias():
    return Categoria.query.filter_by(ativo=True).order_by(Categoria.nome).all()


def _aplicar(rec: Recorrencia, form) -> None:
    descricao = (form.get("descricao") or "").strip()
    if not descricao:
        raise ValueError("Informe a descrição.")
    valor = parse_moeda(form.get("valor"))
    if valor <= 0:
        raise ValueError("Informe um valor maior que zero.")
    dia = int(form.get("dia_vencimento") or 1)
    if dia < 1 or dia > 31:
        raise ValueError("O dia de vencimento deve ser entre 1 e 31.")
    tipo = form.get("tipo") or "pagar"
    if tipo not in ("pagar", "receber"):
        tipo = "pagar"
    periodicidade = form.get("periodicidade") or "mensal"
    if periodicidade not in ("mensal", "anual"):
        periodicidade = "mensal"
    rec.descricao = descricao[:180]
    rec.valor = valor
    rec.tipo = tipo
    rec.periodicidade = periodicidade
    rec.dia_vencimento = dia
    rec.mes_vencimento = int(form.get("mes_vencimento") or 0) or None
    rec.pessoa = (form.get("pessoa") or "").strip()[:120] or None
    rec.observacao = (form.get("observacao") or "").strip() or None
    conta_id = form.get("conta_id") or None
    rec.conta_id = int(conta_id) if conta_id else None
    cat_id = form.get("categoria_id") or None
    rec.categoria_id = int(cat_id) if cat_id else None
    rec.atualizado_em = agora()


@recorrencias_bp.route("/recorrentes")
@login_required
def index():
    gerar_titulos_recorrentes(id_casa())
    db.session.commit()
    itens = (
        Recorrencia.query.filter_by(usuario_id=id_casa(), ativo=True)
        .order_by(Recorrencia.dia_vencimento, Recorrencia.descricao)
        .all()
    )
    return render_template(
        "recorrencias/index.html",
        itens=itens,
        contas=_contas(),
        categorias=_categorias(),
        periodicidades=PERIODICIDADES,
    )


@recorrencias_bp.route("/recorrentes/nova", methods=["POST"])
@login_required
def nova():
    rec = Recorrencia(
        usuario_id=id_casa(),
        descricao="",
        valor=0,
        tipo="pagar",
        periodicidade="mensal",
        dia_vencimento=1,
        ativo=True,
    )
    try:
        _aplicar(rec, request.form)
        db.session.add(rec)
        db.session.flush()
        gerar_titulos_recorrentes(id_casa())
        registrar("criar", "recorrencia", rec.id, rec.descricao)
        db.session.commit()
        flash("Recorrência criada. Os próximos vencimentos foram gerados.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("recorrencias.index"))


@recorrencias_bp.route("/recorrentes/<int:rec_id>/editar", methods=["POST"])
@login_required
def editar(rec_id):
    rec = _obter(rec_id)
    try:
        _aplicar(rec, request.form)
        gerar_titulos_recorrentes(id_casa())
        registrar("editar", "recorrencia", rec.id, rec.descricao)
        db.session.commit()
        flash("Recorrência atualizada.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("recorrencias.index"))


@recorrencias_bp.route("/recorrentes/<int:rec_id>/desativar", methods=["POST"])
@login_required
def desativar(rec_id):
    rec = _obter(rec_id)
    rec.ativo = False
    registrar("excluir", "recorrencia", rec.id, rec.descricao)
    db.session.commit()
    flash("Recorrência desativada. Os títulos já gerados continuam em Vencimentos.", "sucesso")
    return redirect(url_for("recorrencias.index"))
