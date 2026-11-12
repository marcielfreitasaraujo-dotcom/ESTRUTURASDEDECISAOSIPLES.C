from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func

from app.extensions import db
from app.models import Categoria, TIPOS_CATEGORIA
from app.services.auditoria import registrar
from app.utils.casa import id_casa

categorias_bp = Blueprint("categorias", __name__)

TIPOS_VALIDOS = {valor for valor, _ in TIPOS_CATEGORIA}


def _tipo(valor: str | None, padrao: str = "despesa") -> str:
    return valor if valor in TIPOS_VALIDOS else padrao


def _cor(valor: str | None, padrao: str = "#64748b") -> str:
    valor = (valor or "").strip()
    if len(valor) == 7 and valor.startswith("#") and all(c in "0123456789abcdefABCDEF" for c in valor[1:]):
        return valor
    return padrao


def _nome_repetido(nome: str, tipo: str, ignorar_id: int | None = None) -> bool:
    q = Categoria.visiveis(id_casa()).filter(
        func.lower(Categoria.nome) == nome.lower(), Categoria.tipo == tipo
    )
    if ignorar_id:
        q = q.filter(Categoria.id != ignorar_id)
    return q.first() is not None


def _obter_editavel(cat_id: int) -> Categoria:
    cat = db.get_or_404(Categoria, cat_id)
    if not cat.pode_editar(current_user):
        abort(403)
    return cat


@categorias_bp.route("/categorias")
@login_required
def index():
    itens = Categoria.visiveis(id_casa()).order_by(Categoria.tipo, Categoria.nome).all()
    minhas = [c for c in itens if not c.eh_global]
    padrao = [c for c in itens if c.eh_global]
    return render_template(
        "categorias/index.html",
        itens=itens,
        minhas=minhas,
        padrao=padrao,
        tipos=TIPOS_CATEGORIA,
    )


@categorias_bp.route("/categorias/nova", methods=["POST"])
@login_required
def nova():
    nome = (request.form.get("nome") or "").strip()[:80]
    if not nome:
        flash("Informe o nome da categoria.", "erro")
        return redirect(url_for("categorias.index"))
    tipo = _tipo(request.form.get("tipo"))
    if _nome_repetido(nome, tipo):
        flash("Já existe uma categoria com esse nome.", "erro")
        return redirect(url_for("categorias.index"))
    cat = Categoria(
        nome=nome,
        tipo=tipo,
        cor=_cor(request.form.get("cor")),
        eh_investimento=tipo == "investimento",
        usuario_id=current_user.id,
        sistema=False,
        ativo=True,
    )
    db.session.add(cat)
    db.session.flush()
    registrar("criar", "categoria", cat.id, cat.nome)
    db.session.commit()
    flash("Categoria criada.", "sucesso")
    return redirect(url_for("categorias.index"))


@categorias_bp.route("/categorias/<int:cat_id>/editar", methods=["POST"])
@login_required
def editar(cat_id):
    cat = _obter_editavel(cat_id)
    nome = (request.form.get("nome") or "").strip()[:80]
    tipo = _tipo(request.form.get("tipo"), cat.tipo)
    if nome and _nome_repetido(nome, tipo, ignorar_id=cat.id):
        flash("Já existe uma categoria com esse nome.", "erro")
        return redirect(url_for("categorias.index"))
    if nome:
        cat.nome = nome
    cat.cor = _cor(request.form.get("cor"), cat.cor or "#64748b")
    if not cat.sistema:
        cat.tipo = tipo
        cat.eh_investimento = cat.tipo == "investimento"
    registrar("editar", "categoria", cat.id, cat.nome)
    db.session.commit()
    flash("Categoria atualizada.", "sucesso")
    return redirect(url_for("categorias.index"))


@categorias_bp.route("/categorias/<int:cat_id>/excluir", methods=["POST"])
@login_required
def excluir(cat_id):
    cat = _obter_editavel(cat_id)
    if cat.sistema:
        flash("Categorias padrão do sistema não podem ser excluídas.", "erro")
        return redirect(url_for("categorias.index"))
    cat.ativo = False
    registrar("excluir", "categoria", cat.id, cat.nome)
    db.session.commit()
    flash("Categoria desativada. Os lançamentos antigos continuam com ela.", "sucesso")
    return redirect(url_for("categorias.index"))
