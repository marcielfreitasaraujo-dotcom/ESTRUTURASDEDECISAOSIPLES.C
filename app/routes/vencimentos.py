from datetime import date

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Categoria, Conta, ContaPagar, FORMAS_PAGAMENTO
from app.models.usuario import agora
from app.services.auditoria import registrar
from app.services.comprovantes import ComprovanteInvalido, salvar_comprovante
from app.services import vencimentos as svc
from app.utils.formatters import parse_data, parse_moeda
from app.utils.permissoes import exigir_dono

vencimentos_bp = Blueprint("vencimentos", __name__)


def _obter(titulo_id: int) -> ContaPagar:
    titulo = db.get_or_404(ContaPagar, titulo_id)
    exigir_dono(titulo.usuario_id)
    return titulo


def _contas():
    return (
        Conta.query.filter_by(usuario_id=current_user.id, ativo=True)
        .order_by(Conta.nome)
        .all()
    )


def _categorias():
    return Categoria.query.filter_by(ativo=True).order_by(Categoria.nome).all()


def _aplicar(titulo: ContaPagar, form) -> None:
    tipo = form.get("tipo") or "pagar"
    if tipo not in ("pagar", "receber"):
        tipo = "pagar"
    descricao = (form.get("descricao") or "").strip()
    if not descricao:
        raise ValueError("Informe a descrição.")
    valor = parse_moeda(form.get("valor"))
    if valor <= 0:
        raise ValueError("Informe um valor maior que zero.")
    titulo.tipo = tipo
    titulo.descricao = descricao[:180]
    titulo.pessoa = (form.get("pessoa") or "").strip()[:120] or None
    titulo.observacao = (form.get("observacao") or "").strip() or None
    titulo.valor = valor
    titulo.vencimento = parse_data(form.get("vencimento"), date.today())
    conta_id = form.get("conta_id") or None
    titulo.conta_id = int(conta_id) if conta_id else None
    cat_id = form.get("categoria_id") or None
    titulo.categoria_id = int(cat_id) if cat_id else None
    if not titulo.quitado:
        titulo.status = titulo.status_atual()
    titulo.atualizado_em = agora()


@vencimentos_bp.route("/vencimentos")
@login_required
def index():
    tipo = request.args.get("tipo", "pagar")
    if tipo not in ("pagar", "receber"):
        tipo = "pagar"
    situacao = request.args.get("situacao", "abertas")
    svc.sincronizar_status(current_user.id)
    db.session.commit()
    titulos = svc.filtrar_por_situacao(svc.query_titulos(current_user.id, tipo).all(), situacao)
    resumo = svc.totais(current_user.id, tipo)
    return render_template(
        "vencimentos/index.html",
        titulos=titulos,
        tipo=tipo,
        situacao=situacao,
        resumo=resumo,
        contas=_contas(),
        categorias=_categorias(),
        formas=FORMAS_PAGAMENTO,
    )


@vencimentos_bp.route("/vencimentos/nova", methods=["POST"])
@login_required
def nova():
    titulo = ContaPagar(usuario_id=current_user.id, ativo=True, tipo="pagar", descricao="", valor=0, vencimento=date.today())
    try:
        _aplicar(titulo, request.form)
        db.session.add(titulo)
        db.session.flush()
        registrar("criar", "vencimento", titulo.id, titulo.descricao)
        db.session.commit()
        flash("Título registrado.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    tipo = request.form.get("tipo") or "pagar"
    return redirect(url_for("vencimentos.index", tipo=tipo))


@vencimentos_bp.route("/vencimentos/<int:titulo_id>")
@login_required
def detalhe(titulo_id):
    titulo = _obter(titulo_id)
    return render_template(
        "vencimentos/detalhe.html",
        titulo=titulo,
        contas=_contas(),
        categorias=_categorias(),
        formas=FORMAS_PAGAMENTO,
        status=titulo.status_atual(),
    )


@vencimentos_bp.route("/vencimentos/<int:titulo_id>/editar", methods=["POST"])
@login_required
def editar(titulo_id):
    titulo = _obter(titulo_id)
    if titulo.quitado:
        flash("Título quitado não pode ser editado. Estorne antes, se precisar.", "erro")
        return redirect(url_for("vencimentos.detalhe", titulo_id=titulo.id))
    try:
        _aplicar(titulo, request.form)
        registrar("editar", "vencimento", titulo.id, titulo.descricao)
        db.session.commit()
        flash("Título atualizado.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("vencimentos.detalhe", titulo_id=titulo.id))


@vencimentos_bp.route("/vencimentos/<int:titulo_id>/quitar", methods=["POST"])
@login_required
def quitar(titulo_id):
    titulo = _obter(titulo_id)
    try:
        conta_id = int(request.form.get("conta_id") or 0)
        conta = Conta.query.filter_by(id=conta_id, usuario_id=current_user.id, ativo=True).first()
        if not conta:
            raise ValueError("Selecione a conta para registrar o pagamento.")
        lancar = request.form.get("lancar") == "1"
        mov = svc.quitar(
            titulo,
            conta=conta,
            valor=request.form.get("valor") or titulo.valor,
            data_pagamento=parse_data(request.form.get("data_pagamento"), date.today()),
            forma_pagamento=request.form.get("forma_pagamento") or "pix",
            lancar=lancar,
        )
        arquivo = request.files.get("comprovante")
        if mov and arquivo and arquivo.filename:
            salvar_comprovante(mov, arquivo)
            titulo.comprovante_id = mov.comprovante.id if mov.comprovante else None
        db.session.commit()
        verbo = "Pagamento" if titulo.eh_pagar else "Recebimento"
        flash(f"{verbo} registrado com sucesso.", "sucesso")
    except (ValueError, ComprovanteInvalido) as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("vencimentos.detalhe", titulo_id=titulo.id))


@vencimentos_bp.route("/vencimentos/<int:titulo_id>/excluir", methods=["POST"])
@login_required
def excluir(titulo_id):
    titulo = _obter(titulo_id)
    titulo.ativo = False
    registrar("excluir", "vencimento", titulo.id, titulo.descricao)
    db.session.commit()
    flash("Título excluído.", "sucesso")
    return redirect(url_for("vencimentos.index", tipo=titulo.tipo))
