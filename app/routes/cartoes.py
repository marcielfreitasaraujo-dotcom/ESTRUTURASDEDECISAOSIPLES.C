from datetime import date

from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Cartao, Categoria, Conta, Parcela
from app.services.auditoria import registrar
from app.services.cartoes import (
    criar_compra,
    editar_parcela,
    excluir_parcela,
    fechamento_fatura,
    limite_usado,
    pagar_fatura,
    parcelas_competencia,
    query_cartoes,
    total_fatura,
    vencimento_fatura,
)
from app.utils.formatters import parse_data, parse_moeda, somar_meses
from app.utils.casa import id_casa
from app.utils.permissoes import exigir_dono

cartoes_bp = Blueprint("cartoes", __name__)


def _obter(cartao_id: int) -> Cartao:
    cartao = db.get_or_404(Cartao, cartao_id)
    exigir_dono(cartao.usuario_id)
    return cartao


def _contas():
    return Conta.query.filter_by(usuario_id=id_casa(), ativo=True).order_by(Conta.nome).all()


def _categorias_despesa():
    return (
        Categoria.query.filter(Categoria.ativo.is_(True), Categoria.tipo.in_(("despesa", "investimento")))
        .order_by(Categoria.nome)
        .all()
    )


def _competencia_arg(cartao: Cartao | None = None) -> date:
    texto = request.args.get("competencia") or request.form.get("competencia")
    hoje = date.today()
    if texto:
        try:
            ano, mes = texto.split("-")[:2]
            return date(int(ano), int(mes), 1)
        except (ValueError, TypeError):
            pass
    if cartao:
        from app.services.cartoes import competencia_da_compra

        return competencia_da_compra(cartao, hoje)
    return date(hoje.year, hoje.month, 1)


@cartoes_bp.route("/cartoes")
@login_required
def index():
    itens = []
    for cartao in query_cartoes(id_casa()).all():
        usado = limite_usado(cartao)
        itens.append(
            {
                "cartao": cartao,
                "usado": usado,
                "disponivel": cartao.limite - usado,
                "percentual": float((usado / cartao.limite) * 100) if cartao.limite > 0 else 0,
            }
        )
    return render_template("cartoes/index.html", itens=itens)


@cartoes_bp.route("/cartoes/nova", methods=["POST"])
@login_required
def nova():
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe o nome do cartão.", "erro")
        return redirect(url_for("cartoes.index"))
    fechamento = int(request.form.get("dia_fechamento") or 1)
    vencimento = int(request.form.get("dia_vencimento") or 10)
    if not 1 <= fechamento <= 28 or not 1 <= vencimento <= 28:
        flash("Use dias de fechamento e vencimento entre 1 e 28.", "erro")
        return redirect(url_for("cartoes.index"))
    cartao = Cartao(
        usuario_id=id_casa(),
        nome=nome[:80],
        limite=parse_moeda(request.form.get("limite")),
        dia_fechamento=fechamento,
        dia_vencimento=vencimento,
        ativo=True,
    )
    db.session.add(cartao)
    db.session.flush()
    registrar("criar", "cartao", cartao.id, cartao.nome)
    db.session.commit()
    flash("Cartão cadastrado.", "sucesso")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id))


@cartoes_bp.route("/cartoes/<int:cartao_id>")
@login_required
def detalhe(cartao_id):
    cartao = _obter(cartao_id)
    if not cartao.ativo:
        abort(404)
    competencia = _competencia_arg(cartao)
    parcelas = parcelas_competencia(cartao, competencia)
    usado = limite_usado(cartao)
    return render_template(
        "cartoes/detalhe.html",
        cartao=cartao,
        competencia=competencia,
        competencia_ant=somar_meses(competencia, -1),
        competencia_prox=somar_meses(competencia, 1),
        parcelas=parcelas,
        total=total_fatura(parcelas),
        aberto=total_fatura(parcelas, somente_abertas=True),
        vencimento=vencimento_fatura(cartao, competencia),
        fechamento=fechamento_fatura(cartao, competencia),
        usado=usado,
        disponivel=cartao.limite - usado,
        contas=_contas(),
        categorias=_categorias_despesa(),
        hoje=date.today(),
    )


@cartoes_bp.route("/cartoes/<int:cartao_id>/editar", methods=["POST"])
@login_required
def editar(cartao_id):
    cartao = _obter(cartao_id)
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe o nome do cartão.", "erro")
        return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id))
    fechamento = int(request.form.get("dia_fechamento") or cartao.dia_fechamento)
    vencimento = int(request.form.get("dia_vencimento") or cartao.dia_vencimento)
    if not 1 <= fechamento <= 28 or not 1 <= vencimento <= 28:
        flash("Use dias de fechamento e vencimento entre 1 e 28.", "erro")
        return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id))
    cartao.nome = nome[:80]
    cartao.limite = parse_moeda(request.form.get("limite"))
    cartao.dia_fechamento = fechamento
    cartao.dia_vencimento = vencimento
    registrar("editar", "cartao", cartao.id, cartao.nome)
    db.session.commit()
    flash("Cartão atualizado.", "sucesso")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id))


@cartoes_bp.route("/cartoes/<int:cartao_id>/excluir", methods=["POST"])
@login_required
def excluir(cartao_id):
    cartao = _obter(cartao_id)
    cartao.ativo = False
    registrar("excluir", "cartao", cartao.id, cartao.nome)
    db.session.commit()
    flash("Cartão desativado. As parcelas existentes foram preservadas.", "sucesso")
    return redirect(url_for("cartoes.index"))


@cartoes_bp.route("/cartoes/<int:cartao_id>/compra", methods=["POST"])
@login_required
def compra(cartao_id):
    cartao = _obter(cartao_id)
    try:
        quantidade = int(request.form.get("parcelas") or 1)
        categoria_id = request.form.get("categoria_id") or None
        criar_compra(
            cartao,
            request.form.get("descricao") or "",
            parse_moeda(request.form.get("valor")),
            parse_data(request.form.get("data"), date.today()),
            quantidade,
            int(categoria_id) if categoria_id else None,
        )
        registrar("criar", "compra_cartao", cartao.id, request.form.get("descricao"))
        db.session.commit()
        flash("Compra lançada no cartão.", "sucesso")
    except (ValueError, TypeError) as exc:
        db.session.rollback()
        flash(str(exc) if str(exc) else "Não foi possível lançar a compra.", "erro")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id))


@cartoes_bp.route("/cartoes/<int:cartao_id>/pagar", methods=["POST"])
@login_required
def pagar(cartao_id):
    cartao = _obter(cartao_id)
    competencia = _competencia_arg(cartao)
    conta_id = int(request.form.get("conta_id") or 0)
    conta = Conta.query.filter_by(id=conta_id, usuario_id=id_casa(), ativo=True).first()
    if not conta:
        flash("Selecione uma conta válida para pagar a fatura.", "erro")
        return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id, competencia=competencia.strftime("%Y-%m")))
    try:
        pagar_fatura(
            cartao,
            competencia,
            conta,
            parse_data(request.form.get("data_pagamento"), date.today()),
            current_user.id,
        )
        registrar("pagar", "fatura_cartao", cartao.id, competencia.isoformat())
        db.session.commit()
        flash("Fatura paga. O saldo da conta foi atualizado.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id, competencia=competencia.strftime("%Y-%m")))


def _obter_parcela(cartao_id: int, parcela_id: int) -> tuple[Cartao, Parcela]:
    cartao = _obter(cartao_id)
    parcela = db.get_or_404(Parcela, parcela_id)
    if parcela.cartao_id != cartao.id:
        abort(404)
    return cartao, parcela


@cartoes_bp.route("/cartoes/<int:cartao_id>/parcelas/<int:parcela_id>/editar", methods=["POST"])
@login_required
def editar_parcela_rota(cartao_id, parcela_id):
    cartao, parcela = _obter_parcela(cartao_id, parcela_id)
    competencia = parcela.competencia.strftime("%Y-%m")
    try:
        categoria_id = request.form.get("categoria_id") or None
        editar_parcela(
            parcela,
            request.form.get("descricao") or "",
            parse_moeda(request.form.get("valor")),
            int(categoria_id) if categoria_id else None,
        )
        registrar("editar", "parcela_cartao", parcela.id, parcela.descricao)
        db.session.commit()
        flash("Lançamento do cartão atualizado.", "sucesso")
    except (ValueError, TypeError) as exc:
        db.session.rollback()
        flash(str(exc) if str(exc) else "Não foi possível editar o lançamento.", "erro")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id, competencia=competencia))


@cartoes_bp.route("/cartoes/<int:cartao_id>/parcelas/<int:parcela_id>/excluir", methods=["POST"])
@login_required
def excluir_parcela_rota(cartao_id, parcela_id):
    cartao, parcela = _obter_parcela(cartao_id, parcela_id)
    competencia = parcela.competencia.strftime("%Y-%m")
    inteira = (request.form.get("compra_inteira") or "") in {"1", "true", "on", "sim"}
    try:
        qtd = excluir_parcela(parcela, excluir_compra_inteira=inteira)
        registrar("excluir", "parcela_cartao", parcela_id, parcela.descricao)
        db.session.commit()
        if qtd > 1:
            flash(f"{qtd} parcelas da compra foram removidas.", "sucesso")
        else:
            flash("Lançamento removido da fatura.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("cartoes.detalhe", cartao_id=cartao.id, competencia=competencia))
