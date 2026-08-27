from datetime import date

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Categoria, Conta, Movimentacao, FORMAS_PAGAMENTO
from app.models.usuario import agora
from app.services.auditoria import registrar
from app.services.comprovantes import ComprovanteInvalido, remover_comprovante, salvar_comprovante
from app.utils.casa import id_casa
from app.utils.formatters import parse_data, parse_moeda, periodo_preset
from app.utils.permissoes import exigir_dono

movimentacoes_bp = Blueprint("movimentacoes", __name__)


def _contas_ativas():
    return (
        Conta.query.filter_by(usuario_id=id_casa(), ativo=True)
        .order_by(Conta.nome)
        .all()
    )


def _categorias(tipo=None):
    q = Categoria.query.filter_by(ativo=True)
    if tipo == "receita":
        q = q.filter(Categoria.tipo == "receita")
    elif tipo == "despesa":
        q = q.filter(Categoria.tipo.in_(("despesa", "investimento")))
    elif tipo == "investimento":
        q = q.filter(Categoria.tipo == "investimento")
    return q.order_by(Categoria.nome).all()


def _obter(mov_id: int) -> Movimentacao:
    mov = db.get_or_404(Movimentacao, mov_id)
    exigir_dono(mov.usuario_id)
    return mov


def _aplicar_formulario(mov: Movimentacao, form) -> None:
    tipo = form.get("tipo") or "despesa"
    if tipo not in ("receita", "despesa", "transferencia", "investimento"):
        tipo = "despesa"
    valor = parse_moeda(form.get("valor"))
    if valor <= 0:
        raise ValueError("Informe um valor maior que zero.")

    conta_id = int(form.get("conta_id") or 0)
    conta = Conta.query.filter_by(id=conta_id, usuario_id=id_casa(), ativo=True).first()
    if not conta:
        raise ValueError("Selecione uma conta válida.")

    conta_destino_id = None
    if tipo == "transferencia":
        dest_id = int(form.get("conta_destino_id") or 0)
        destino = Conta.query.filter_by(id=dest_id, usuario_id=id_casa(), ativo=True).first()
        if not destino:
            raise ValueError("Selecione a conta de destino.")
        if destino.id == conta.id:
            raise ValueError("Origem e destino devem ser diferentes.")
        conta_destino_id = destino.id

    categoria_id = form.get("categoria_id") or None
    categoria = None
    if categoria_id:
        categoria = Categoria.query.filter_by(id=int(categoria_id), ativo=True).first()

    if tipo == "despesa" and categoria and categoria.eh_investimento:
        tipo = "investimento"

    descricao = (form.get("descricao") or "").strip()
    if not descricao:
        descricao = categoria.nome if categoria else tipo.capitalize()

    mov.tipo = tipo
    mov.valor = valor
    mov.conta_id = conta.id
    mov.conta_destino_id = conta_destino_id
    mov.categoria_id = categoria.id if categoria else None
    mov.descricao = descricao[:180]
    mov.data = parse_data(form.get("data"), date.today())
    mov.forma_pagamento = form.get("forma_pagamento") or "dinheiro"
    mov.observacao = (form.get("observacao") or "").strip() or None
    mov.atualizado_por = current_user.id
    mov.atualizado_em = agora()


@movimentacoes_bp.route("/movimentacoes")
@login_required
def index():
    chave = request.args.get("periodo", "ultimos_90")
    inicio, fim = periodo_preset(chave, request.args.get("inicio"), request.args.get("fim"))
    q = Movimentacao.query.filter(
        Movimentacao.usuario_id == id_casa(),
        Movimentacao.ativo.is_(True),
        Movimentacao.data >= inicio,
        Movimentacao.data <= fim,
    )
    tipo = request.args.get("tipo")
    if tipo in ("receita", "despesa", "transferencia", "investimento"):
        q = q.filter(Movimentacao.tipo == tipo)
    categoria_id = request.args.get("categoria_id")
    if categoria_id:
        q = q.filter(Movimentacao.categoria_id == int(categoria_id))
    conta_id = request.args.get("conta_id")
    if conta_id:
        q = q.filter(Movimentacao.conta_id == int(conta_id))
    forma = request.args.get("forma_pagamento")
    if forma:
        q = q.filter(Movimentacao.forma_pagamento == forma)
    comprovante = request.args.get("comprovante")
    if comprovante == "com":
        q = q.filter(Movimentacao.comprovante.has())
    elif comprovante == "sem":
        q = q.filter(~Movimentacao.comprovante.has())
    busca = (request.args.get("q") or "").strip()
    if busca:
        like = f"%{busca}%"
        q = q.filter(
            db.or_(
                Movimentacao.descricao.ilike(like),
                Movimentacao.observacao.ilike(like),
                db.cast(Movimentacao.valor, db.String).ilike(like.replace(",", ".")),
            )
        )

    itens = q.order_by(Movimentacao.data.desc(), Movimentacao.id.desc()).all()
    return render_template(
        "movimentacoes/index.html",
        itens=itens,
        contas=_contas_ativas(),
        categorias=_categorias(),
        formas=FORMAS_PAGAMENTO,
        filtros=request.args,
        periodo=chave,
        inicio=inicio,
        fim=fim,
        titulo="Movimentações",
    )


@movimentacoes_bp.route("/receitas")
@login_required
def receitas():
    return redirect(url_for("movimentacoes.index", tipo="receita", periodo=request.args.get("periodo", "ultimos_90")))


@movimentacoes_bp.route("/despesas")
@login_required
def despesas():
    return redirect(url_for("movimentacoes.index", tipo="despesa", periodo=request.args.get("periodo", "ultimos_90")))


@movimentacoes_bp.route("/investimentos")
@login_required
def investimentos():
    return redirect(url_for("movimentacoes.index", tipo="investimento", periodo=request.args.get("periodo", "ultimos_90")))


@movimentacoes_bp.route("/movimentacoes/nova", methods=["POST"])
@login_required
def nova():
    mov = Movimentacao(
        usuario_id=id_casa(),
        criado_por=current_user.id,
        ativo=True,
        tipo="despesa",
        descricao="Lançamento",
        valor=0,
        data=date.today(),
        conta_id=(_contas_ativas()[0].id if _contas_ativas() else None),
    )
    try:
        if not mov.conta_id:
            raise ValueError("Cadastre uma conta antes de lançar.")
        _aplicar_formulario(mov, request.form)
        db.session.add(mov)
        db.session.flush()
        arquivo = request.files.get("comprovante")
        if arquivo and arquivo.filename:
            salvar_comprovante(mov, arquivo)
        registrar("criar", "movimentacao", mov.id, mov.descricao)
        db.session.commit()
        flash("Movimentação registrada.", "sucesso")
    except (ValueError, ComprovanteInvalido) as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(request.form.get("next") or url_for("dashboard.index"))


@movimentacoes_bp.route("/movimentacoes/<int:mov_id>")
@login_required
def detalhe(mov_id):
    mov = _obter(mov_id)
    return render_template(
        "movimentacoes/detalhe.html",
        mov=mov,
        contas=_contas_ativas(),
        categorias=_categorias(),
        formas=FORMAS_PAGAMENTO,
    )


@movimentacoes_bp.route("/movimentacoes/<int:mov_id>/editar", methods=["POST"])
@login_required
def editar(mov_id):
    mov = _obter(mov_id)
    if not mov.ativo:
        flash("Esta movimentação foi excluída.", "erro")
        return redirect(url_for("movimentacoes.index"))
    try:
        _aplicar_formulario(mov, request.form)
        arquivo = request.files.get("comprovante")
        if arquivo and arquivo.filename:
            salvar_comprovante(mov, arquivo)
        registrar("editar", "movimentacao", mov.id, mov.descricao)
        db.session.commit()
        flash("Movimentação atualizada. O saldo foi recalculado.", "sucesso")
    except (ValueError, ComprovanteInvalido) as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("movimentacoes.detalhe", mov_id=mov.id))


@movimentacoes_bp.route("/movimentacoes/<int:mov_id>/excluir", methods=["POST"])
@login_required
def excluir(mov_id):
    mov = _obter(mov_id)
    mov.ativo = False
    mov.excluido_em = agora()
    mov.excluido_por = current_user.id
    registrar("excluir", "movimentacao", mov.id, mov.descricao)
    db.session.commit()
    flash("Movimentação excluída.", "sucesso")
    return redirect(url_for("movimentacoes.index"))


@movimentacoes_bp.route("/movimentacoes/<int:mov_id>/comprovante", methods=["POST"])
@login_required
def enviar_comprovante(mov_id):
    mov = _obter(mov_id)
    arquivo = request.files.get("comprovante")
    try:
        salvar_comprovante(mov, arquivo)
        registrar("anexar_comprovante", "movimentacao", mov.id)
        db.session.commit()
        flash("Comprovante anexado.", "sucesso")
    except ComprovanteInvalido as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("movimentacoes.detalhe", mov_id=mov.id))


@movimentacoes_bp.route("/movimentacoes/<int:mov_id>/comprovante/remover", methods=["POST"])
@login_required
def remover_comp(mov_id):
    mov = _obter(mov_id)
    remover_comprovante(mov)
    registrar("remover_comprovante", "movimentacao", mov.id)
    db.session.commit()
    flash("Comprovante removido.", "sucesso")
    return redirect(url_for("movimentacoes.detalhe", mov_id=mov.id))
