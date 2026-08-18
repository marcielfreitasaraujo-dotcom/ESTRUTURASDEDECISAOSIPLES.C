import logging

from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app.models import Usuario

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger("fincasa.auth")


def _encerrar_sessao() -> None:
    logout_user()
    session.clear()
    session.modified = True


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
            login_user(usuario, remember=False)
            session.permanent = False
            logger.info("Login ok usuario=%s", username)
            destino = request.args.get("next") or url_for("dashboard.index")
            if not destino.startswith("/"):
                destino = url_for("dashboard.index")
            return redirect(destino)
    return render_template("auth/login.html", erro=erro)


@auth_bp.route("/logout", methods=["GET", "POST"])
@login_required
def logout():
    _encerrar_sessao()
    flash("Você saiu. Entre novamente com usuário e senha.", "info")
    return redirect(url_for("auth.login"))
