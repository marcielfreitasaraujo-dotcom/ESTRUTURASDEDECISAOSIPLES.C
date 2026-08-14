from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.services.seed import inserir_dados_demo

configuracoes_bp = Blueprint("configuracoes", __name__)


@configuracoes_bp.route("/configuracoes")
@login_required
def index():
    return render_template("configuracoes/index.html")


@configuracoes_bp.route("/configuracoes/perfil", methods=["POST"])
@login_required
def perfil():
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe seu nome.", "erro")
        return redirect(url_for("configuracoes.index"))
    current_user.nome = nome[:120]
    db.session.commit()
    flash("Perfil atualizado.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/senha", methods=["POST"])
@login_required
def senha():
    atual = request.form.get("senha_atual") or ""
    nova = request.form.get("senha_nova") or ""
    confirma = request.form.get("senha_confirma") or ""
    if not current_user.verificar_senha(atual):
        flash("Senha atual incorreta.", "erro")
        return redirect(url_for("configuracoes.index"))
    if len(nova) < 6:
        flash("A nova senha deve ter pelo menos 6 caracteres.", "erro")
        return redirect(url_for("configuracoes.index"))
    if nova != confirma:
        flash("A confirmação não confere.", "erro")
        return redirect(url_for("configuracoes.index"))
    current_user.definir_senha(nova)
    db.session.commit()
    flash("Senha alterada.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/tema", methods=["POST"])
@login_required
def tema():
    escolhido = request.form.get("tema")
    if escolhido not in ("claro", "escuro"):
        escolhido = "claro"
    current_user.tema = escolhido
    db.session.commit()
    flash("Tema atualizado.", "sucesso")
    return redirect(request.form.get("next") or url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/demo", methods=["POST"])
@login_required
def demo():
    if not current_user.eh_admin:
        flash("Apenas o administrador pode carregar dados de demonstração.", "erro")
        return redirect(url_for("configuracoes.index"))
    ok = inserir_dados_demo(current_user)
    if ok:
        flash("Dados de demonstração inseridos. Confira o dashboard.", "sucesso")
    else:
        flash("Os dados de demonstração já haviam sido carregados.", "info")
    return redirect(url_for("dashboard.index"))
