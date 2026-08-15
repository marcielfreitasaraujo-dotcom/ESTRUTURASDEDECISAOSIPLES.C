from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import login_required

from app.extensions import db
from app.models import Conta, Movimentacao, TIPOS_CONTA
from app.models.usuario import agora
from app.services.auditoria import registrar
from app.services.saldo import saldo_conta
from app.utils.formatters import parse_moeda
from app.utils.casa import id_casa
from app.utils.permissoes import exigir_dono

contas_bp = Blueprint("contas", __name__)


def _obter(conta_id: int) -> Conta:
    conta = db.get_or_404(Conta, conta_id)
    exigir_dono(conta.usuario_id)
    return conta


@contas_bp.route("/contas")
@login_required
def index():
    contas = (
        Conta.query.filter_by(usuario_id=id_casa(), ativo=True)
        .order_by(Conta.nome)
        .all()
    )
    itens = []
    for conta in contas:
        atual = saldo_conta(conta)
        diferenca = None
        if conta.eh_carteira and conta.saldo_informado is not None:
            diferenca = conta.saldo_informado - atual
        itens.append({"conta": conta, "saldo": atual, "diferenca": diferenca})
    return render_template("contas/index.html", itens=itens, tipos=TIPOS_CONTA)


@contas_bp.route("/contas/nova", methods=["POST"])
@login_required
def nova():
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe o nome da conta.", "erro")
        return redirect(url_for("contas.index"))
    conta = Conta(
        usuario_id=id_casa(),
        nome=nome[:80],
        tipo=request.form.get("tipo") or "banco",
        saldo_inicial=parse_moeda(request.form.get("saldo_inicial")),
        ativo=True,
    )
    db.session.add(conta)
    db.session.flush()
    registrar("criar", "conta", conta.id, conta.nome)
    db.session.commit()
    flash("Conta cadastrada.", "sucesso")
    return redirect(url_for("contas.index"))


@contas_bp.route("/contas/<int:conta_id>")
@login_required
def detalhe(conta_id):
    conta = _obter(conta_id)
    atual = saldo_conta(conta)
    diferenca = None
    if conta.eh_carteira and conta.saldo_informado is not None:
        diferenca = conta.saldo_informado - atual

    movs = (
        Movimentacao.query.filter_by(conta_id=conta.id, ativo=True)
        .order_by(Movimentacao.data.desc(), Movimentacao.id.desc())
        .limit(30)
        .all()
    )
    return render_template(
        "contas/detalhe.html",
        conta=conta,
        saldo=atual,
        diferenca=diferenca,
        tipos=TIPOS_CONTA,
        movimentacoes=movs,
    )


@contas_bp.route("/contas/<int:conta_id>/editar", methods=["POST"])
@login_required
def editar(conta_id):
    conta = _obter(conta_id)
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe o nome da conta.", "erro")
        return redirect(url_for("contas.detalhe", conta_id=conta.id))
    conta.nome = nome[:80]
    conta.tipo = request.form.get("tipo") or conta.tipo
    conta.saldo_inicial = parse_moeda(request.form.get("saldo_inicial"))
    conta.atualizado_em = agora()
    registrar("editar", "conta", conta.id, conta.nome)
    db.session.commit()
    flash("Conta atualizada. O saldo foi recalculado.", "sucesso")
    return redirect(url_for("contas.detalhe", conta_id=conta.id))


@contas_bp.route("/contas/<int:conta_id>/conferir", methods=["POST"])
@login_required
def conferir(conta_id):
    conta = _obter(conta_id)
    conta.saldo_informado = parse_moeda(request.form.get("saldo_informado"))
    conta.data_conferencia = agora()
    db.session.commit()
    flash("Saldo informado da carteira registrado.", "sucesso")
    return redirect(url_for("contas.detalhe", conta_id=conta.id))


@contas_bp.route("/contas/<int:conta_id>/excluir", methods=["POST"])
@login_required
def excluir(conta_id):
    conta = _obter(conta_id)
    conta.ativo = False
    registrar("excluir", "conta", conta.id, conta.nome)
    db.session.commit()
    flash("Conta desativada.", "sucesso")
    return redirect(url_for("contas.index"))
