from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Categoria, TIPOS_CATEGORIA
from app.services.auditoria import registrar
from app.utils.decorators import admin_obrigatorio

categorias_bp = Blueprint("categorias", __name__)


@categorias_bp.route("/categorias")
@login_required
def index():
    itens = Categoria.query.filter_by(ativo=True).order_by(Categoria.tipo, Categoria.nome).all()
    return render_template("categorias/index.html", itens=itens, tipos=TIPOS_CATEGORIA)


@categorias_bp.route("/categorias/nova", methods=["POST"])
@login_required
@admin_obrigatorio
def nova():
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe o nome da categoria.", "erro")
        return redirect(url_for("categorias.index"))
    tipo = request.form.get("tipo") or "despesa"
    cat = Categoria(
        nome=nome[:80],
        tipo=tipo,
        cor=request.form.get("cor") or "#64748b",
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
@admin_obrigatorio
def editar(cat_id):
    cat = db.get_or_404(Categoria, cat_id)
    nome = (request.form.get("nome") or "").strip()
    if nome:
        cat.nome = nome[:80]
    cat.cor = request.form.get("cor") or cat.cor
    cat.tipo = request.form.get("tipo") or cat.tipo
    cat.eh_investimento = cat.tipo == "investimento"
    registrar("editar", "categoria", cat.id, cat.nome)
    db.session.commit()
    flash("Categoria atualizada.", "sucesso")
    return redirect(url_for("categorias.index"))


@categorias_bp.route("/categorias/<int:cat_id>/excluir", methods=["POST"])
@login_required
@admin_obrigatorio
def excluir(cat_id):
    cat = db.get_or_404(Categoria, cat_id)
    if cat.sistema:
        flash("Categorias padrão do sistema não podem ser excluídas.", "erro")
        return redirect(url_for("categorias.index"))
    cat.ativo = False
    registrar("excluir", "categoria", cat.id, cat.nome)
    db.session.commit()
    flash("Categoria desativada.", "sucesso")
    return redirect(url_for("categorias.index"))
