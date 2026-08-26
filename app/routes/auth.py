from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app.extensions import csrf, db
from app.models import Usuario
from app.services.seed import criar_membro_familia
from app.utils.assinatura import obter_plano_assinatura
import logging

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger("finup.auth")


def _destino_seguro(valor: str | None, padrao: str) -> str:
    destino = valor or padrao
    if not destino.startswith("/"):
        return padrao
    return destino


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        destino = _destino_seguro(
            request.args.get("next"),
            url_for("dashboard.index"),
        )
        return redirect(url_for("auth.sessao_verificar", next=destino))

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
    plano = obter_plano_assinatura()
    return render_template("auth/login.html", erro=erro, plano=plano)


@auth_bp.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    plano = obter_plano_assinatura()
    erro = None
    if request.method == "POST":
        nome = (request.form.get("nome") or "").strip()
        username = (request.form.get("username") or "").strip().lower()
        senha = request.form.get("senha") or ""
        senha2 = request.form.get("senha2") or ""
        if senha != senha2:
            erro = "As senhas não conferem."
        else:
            try:
                membro = criar_membro_familia(
                    nome,
                    username,
                    senha,
                    perfil="usuario",
                    eh_familia=False,
                    assinatura_ativa=False,
                )
                db.session.commit()
                session.clear()
                login_user(membro, remember=False)
                session.permanent = False
                logger.info("Cadastro público ok usuario=%s", username)
                flash(
                    "Conta criada. Pague a assinatura para liberar o acesso.",
                    "info",
                )
                return redirect(url_for("auth.sessao_iniciar", next=url_for("assinatura.bloqueado")))
            except ValueError as exc:
                db.session.rollback()
                erro = str(exc)
            except Exception:
                db.session.rollback()
                logger.exception("Falha no cadastro público")
                erro = "Não foi possível criar a conta. Tente novamente."
    return render_template("auth/cadastro.html", erro=erro, plano=plano)


@auth_bp.route("/sessao/iniciar")
@login_required
def sessao_iniciar():
    destino = _destino_seguro(
        request.args.get("next"),
        url_for("dashboard.index"),
    )
    return render_template("auth/sessao_iniciar.html", next_url=destino)


@auth_bp.route("/sessao/verificar")
@login_required
def sessao_verificar():
    destino = _destino_seguro(
        request.args.get("next"),
        url_for("dashboard.index"),
    )
    return render_template("auth/sessao_verificar.html", next_url=destino)


@auth_bp.route("/api/sessao/fechar", methods=["POST"])
@csrf.exempt
def sessao_fechar():
    if current_user.is_authenticated:
        logout_user()
        session.clear()
    return "", 204


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    session.clear()
    flash("Você saiu. Entre novamente com usuário e senha.", "info")
    return redirect(url_for("auth.login"))
