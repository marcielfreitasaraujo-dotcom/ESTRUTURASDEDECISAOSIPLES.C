from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app.models import Usuario
import logging

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger("fincasa.auth")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    erro = None
    if request.method == "POST":
        username = (request.form.get("username") or "").strip().lower()
        senha = request.form.get("senha") or ""
        usuario = Usuario.query.filter(Usuario.username.ilike(username)).first()
        if not usuario or not usuario.verificar_senha(senha):
            logger.warning("Falha de autenticação para usuario=%s", username or "(vazio)")
            erro = "Usuário ou senha inválidos."
        elif not usuario.ativo:
            logger.warning("Tentativa de acesso com conta desativada usuario=%s", username)
            erro = "Esta conta está desativada."
        else:
            session.clear()
            login_user(usuario, remember=False)
            session.permanent = False
            logger.info("Login ok usuario=%s", username)
            destino = request.args.get("next") or url_for("dashboard.index")
            if not destino.startswith("/"):
                destino = url_for("dashboard.index")
            return redirect(url_for("auth.sessao_iniciar", next=destino))
    return render_template("auth/login.html", erro=erro)


@auth_bp.route("/sessao/iniciar")
@login_required
def sessao_iniciar():
    destino = request.args.get("next") or url_for("dashboard.index")
    if not destino.startswith("/"):
        destino = url_for("dashboard.index")
    return render_template("auth/sessao_iniciar.html", next_url=destino)


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    session.clear()
    flash("Você saiu. Entre novamente com usuário e senha.", "info")
    return redirect(url_for("auth.login"))
