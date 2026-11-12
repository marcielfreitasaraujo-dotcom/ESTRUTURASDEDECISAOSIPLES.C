from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from app.extensions import csrf, db
from app.models import Usuario
from app.services.auth_email import (
    enviar_reset_senha,
    enviar_verificacao,
    usuario_precisa_verificar_email,
)
from app.services.email import limpar_outbox  # noqa: F401 — reexport útil em testes
from app.services.seed import criar_membro_familia
from app.utils.assinatura import (
    bloqueio_assinatura_ativo,
    obter_plano_assinatura,
    usuario_tem_acesso,
)
from app.utils.tokens import ler_token_reset, ler_token_verificacao
from app.utils import limite
import logging

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger("finup.auth")


def _caminho_interno(destino: str | None) -> bool:
    """Aceita só caminhos do próprio site ("/x"), nunca "//outro-site" ou "/\\outro"."""
    if not destino or not destino.startswith("/"):
        return False
    if destino.startswith("//"):
        return False
    return not any(c in destino for c in ("\\", "\n", "\r"))


def _destino_seguro(valor: str | None, padrao: str) -> str:
    destino = valor or padrao
    if not _caminho_interno(destino):
        return padrao
    return destino


def _destino_pos_login(usuario: Usuario, next_param: str | None = None) -> str:
    """Para onde ir após login: verificação de e-mail, pagamento PIX ou app."""
    if usuario_precisa_verificar_email(usuario):
        return url_for("auth.aguardando_verificacao")
    if bloqueio_assinatura_ativo() and not usuario_tem_acesso(usuario):
        return url_for("assinatura.bloqueado")
    return _destino_seguro(next_param, url_for("dashboard.index"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        if usuario_precisa_verificar_email(current_user):
            return redirect(url_for("auth.aguardando_verificacao"))
        destino = _destino_pos_login(
            current_user,
            request.args.get("next"),
        )
        return redirect(url_for("auth.sessao_verificar", next=destino))

    erro = None
    if request.method == "POST":
        username = (request.form.get("username") or "").strip().lower()
        senha = request.form.get("senha") or ""
        ip = limite.ip_cliente()
        if limite.bloqueado("login-usuario", username) or limite.bloqueado("login-ip", ip):
            logger.warning("Login bloqueado por excesso de tentativas usuario=%s ip=%s", username, ip)
            erro = "Muitas tentativas seguidas. Aguarde 15 minutos ou use “Esqueci a senha”."
            plano = obter_plano_assinatura()
            return render_template("auth/login.html", erro=erro, plano=plano), 429
        usuario = Usuario.query.filter(Usuario.username.ilike(username)).first()
        if not usuario or not usuario.verificar_senha(senha):
            logger.warning("Falha de autenticação para usuario=%s", username or "(vazio)")
            limite.registrar_falha("login-usuario", username)
            limite.registrar_falha("login-ip", ip)
            erro = "E-mail/usuário ou senha inválidos."
        elif not usuario.ativo:
            logger.warning("Tentativa de acesso com conta desativada usuario=%s", username)
            erro = "Esta conta está desativada."
        else:
            limite.limpar("login-usuario", username)
            session.clear()
            login_user(usuario, remember=False)
            session.permanent = False
            logger.info("Login ok usuario=%s", username)
            destino = _destino_pos_login(usuario, request.args.get("next"))
            if destino == url_for("assinatura.bloqueado"):
                flash(
                    "Conta encontrada! Falta pagar a assinatura — use o PIX abaixo para liberar o acesso.",
                    "info",
                )
            return redirect(url_for("auth.sessao_iniciar", next=destino))
    plano = obter_plano_assinatura()
    return render_template("auth/login.html", erro=erro, plano=plano)


@auth_bp.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if current_user.is_authenticated:
        if usuario_precisa_verificar_email(current_user):
            return redirect(url_for("auth.aguardando_verificacao"))
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
                    email_verificado=False,
                    exigir_email=True,
                )
                db.session.commit()
                try:
                    from app.services.hotmart import aplicar_pedidos_pendentes

                    aplicar_pedidos_pendentes(membro)
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                try:
                    enviado = enviar_verificacao(membro)
                    db.session.commit()
                except Exception:
                    db.session.commit()  # conta já criada; código pode ter sido gerado
                    logger.exception("Falha ao enviar e-mail de verificação para %s", username)
                    flash(
                        "Conta criada, mas o e-mail de confirmação não saiu agora. "
                        "Toque em “Reenviar” daqui a pouco.",
                        "erro",
                    )
                else:
                    if enviado:
                        flash(
                            "Conta criada! Enviamos um código e um link para o seu e-mail.",
                            "sucesso",
                        )
                    else:
                        flash(
                            "Conta criada, mas o e-mail não foi enviado. Configure o SMTP no servidor.",
                            "erro",
                        )
                session.clear()
                login_user(membro, remember=False)
                session.permanent = False
                logger.info("Cadastro público ok usuario=%s", username)
                return redirect(
                    url_for("auth.sessao_iniciar", next=url_for("auth.aguardando_verificacao"))
                )
            except ValueError as exc:
                db.session.rollback()
                erro = str(exc)
            except Exception:
                db.session.rollback()
                logger.exception("Falha no cadastro público")
                erro = "Não foi possível criar a conta. Tente novamente."
    return render_template("auth/cadastro.html", erro=erro, plano=plano)


@auth_bp.route("/verificar-email/<token>")
def verificar_email(token):
    uid = ler_token_verificacao(token)
    if uid is None:
        flash("Link de verificação inválido ou expirado. Peça um novo e-mail.", "erro")
        return redirect(url_for("auth.login"))
    usuario = db.session.get(Usuario, uid)
    if usuario is None or not usuario.ativo:
        flash("Conta não encontrada.", "erro")
        return redirect(url_for("auth.login"))
    usuario.email_verificado = True
    try:
        from app.services.hotmart import aplicar_pedidos_pendentes

        aplicar_pedidos_pendentes(usuario)
    except Exception:
        pass
    db.session.commit()
    flash("E-mail confirmado! Agora você pode entrar normalmente.", "sucesso")
    if current_user.is_authenticated and current_user.id == usuario.id:
        return redirect(url_for("auth.sessao_iniciar", next=url_for("dashboard.index")))
    return redirect(url_for("auth.login"))


@auth_bp.route("/aguardando-verificacao", methods=["GET", "POST"])
@login_required
def aguardando_verificacao():
    from app.services.auth_email import validar_codigo_verificacao
    from app.services.email import email_configurado, aviso_limitacao_email

    if not usuario_precisa_verificar_email(current_user):
        return redirect(url_for("dashboard.index"))
    erro = None
    if request.method == "POST":
        acao = (request.form.get("acao") or "reenviar").strip()
        if acao == "codigo":
            codigo = request.form.get("codigo") or ""
            chave_codigo = str(current_user.id)
            if limite.bloqueado("codigo", chave_codigo):
                erro = "Muitas tentativas com código errado. Peça um novo código (Reenviar)."
                return render_template(
                    "auth/aguardando_verificacao.html",
                    erro=erro,
                    email=current_user.username,
                    email_ok=email_configurado(),
                    aviso_email=aviso_limitacao_email(current_user.username),
                ), 429
            if validar_codigo_verificacao(current_user, codigo):
                limite.limpar("codigo", chave_codigo)
                try:
                    from app.services.hotmart import aplicar_pedidos_pendentes

                    aplicar_pedidos_pendentes(current_user)
                except Exception:
                    pass
                db.session.commit()
                flash("E-mail confirmado! Agora você já pode usar o FinUP.", "sucesso")
                destino = _destino_pos_login(current_user)
                if destino == url_for("assinatura.bloqueado"):
                    flash(
                        "Para continuar depois do teste, assine o plano mensal no PIX, cartão ou Hotmart.",
                        "info",
                    )
                return redirect(url_for("auth.sessao_iniciar", next=destino))
            limite.registrar_falha("codigo", chave_codigo)
            erro = "Código inválido ou expirado. Confira o e-mail ou peça um novo código."
        else:
            try:
                enviar_verificacao(current_user)
                db.session.commit()
                limite.limpar("codigo", str(current_user.id))
                flash("Reenviamos o código e o link. Confira sua caixa de entrada (e o spam).", "sucesso")
            except Exception:
                db.session.rollback()
                logger.exception("Falha ao reenviar verificação")
                erro = "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos."
    return render_template(
        "auth/aguardando_verificacao.html",
        erro=erro,
        email=current_user.username,
        email_ok=email_configurado(),
        aviso_email=aviso_limitacao_email(current_user.username),
    )


@auth_bp.route("/esqueci-senha", methods=["GET", "POST"])
def esqueci_senha():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))
    msg = None
    erro = None
    if request.method == "POST":
        email = (request.form.get("username") or "").strip().lower()
        ip = limite.ip_cliente()
        if limite.bloqueado("esqueci-ip", ip):
            erro = "Muitos pedidos seguidos. Aguarde 15 minutos e tente de novo."
            return render_template("auth/esqueci_senha.html", msg=None, erro=erro), 429
        limite.registrar_falha("esqueci-ip", ip)
        usuario = Usuario.query.filter(Usuario.username.ilike(email)).first()
        if usuario and usuario.ativo and usuario.eh_email:
            try:
                enviado = enviar_reset_senha(usuario)
                if enviado:
                    msg = (
                        "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. "
                        "Confira sua caixa de entrada (e o spam)."
                    )
            except Exception:
                logger.exception("Falha ao enviar reset de senha para %s", email)
                erro = (
                    "Não foi possível enviar o e-mail agora. "
                    "Tente de novo em alguns minutos ou peça ao administrador para redefinir sua senha."
                )
        else:
            # Resposta genérica — não revela se o e-mail existe
            msg = (
                "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. "
                "Confira sua caixa de entrada."
            )
    return render_template("auth/esqueci_senha.html", msg=msg, erro=erro)


@auth_bp.route("/redefinir-senha/<token>", methods=["GET", "POST"])
def redefinir_senha(token):
    uid = ler_token_reset(token)
    if uid is None:
        flash("Link de redefinição inválido ou expirado. Peça um novo.", "erro")
        return redirect(url_for("auth.esqueci_senha"))
    usuario = db.session.get(Usuario, uid)
    if usuario is None or not usuario.ativo:
        flash("Conta não encontrada.", "erro")
        return redirect(url_for("auth.login"))

    erro = None
    if request.method == "POST":
        senha = request.form.get("senha") or ""
        senha2 = request.form.get("senha2") or ""
        if len(senha) < 6:
            erro = "A senha deve ter pelo menos 6 caracteres."
        elif senha != senha2:
            erro = "As senhas não conferem."
        else:
            usuario.definir_senha(senha)
            # Se chegou pelo e-mail, considera o endereço confirmado
            if usuario.eh_email:
                usuario.email_verificado = True
            db.session.commit()
            flash("Senha atualizada! Entre com seu e-mail e a nova senha.", "sucesso")
            return redirect(url_for("auth.login"))
    return render_template("auth/redefinir_senha.html", erro=erro, token=token)


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
