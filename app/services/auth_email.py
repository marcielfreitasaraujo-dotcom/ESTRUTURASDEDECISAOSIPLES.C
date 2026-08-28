"""Helpers de verificação de e-mail e recuperação de senha."""

from __future__ import annotations

import secrets
from datetime import timedelta
import re

from flask import current_app, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import Usuario
from app.models.usuario import agora
from app.services.email import email_configurado, enviar_email
from app.utils.tokens import gerar_token_reset, gerar_token_verificacao

EMAIL_RE = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")
CODIGO_VALIDADE_MIN = 30


def eh_email_valido(valor: str) -> bool:
    texto = (valor or "").strip().lower()
    if not texto or len(texto) > 190:
        return False
    return bool(EMAIL_RE.match(texto))


def usuario_precisa_verificar_email(usuario: Usuario | None) -> bool:
    if usuario is None:
        return False
    if getattr(usuario, "eh_admin", False):
        return False
    # Contas antigas / família criadas pelo admin sem e-mail no username
    if not getattr(usuario, "eh_email", False):
        return False
    return not bool(getattr(usuario, "email_verificado", True))


def gerar_codigo_verificacao(usuario: Usuario) -> str:
    """Gera código de 6 dígitos, grava hash no usuário e devolve o código em claro."""
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    usuario.email_codigo_hash = generate_password_hash(codigo)
    usuario.email_codigo_expira = agora() + timedelta(minutes=CODIGO_VALIDADE_MIN)
    db.session.flush()
    return codigo


def validar_codigo_verificacao(usuario: Usuario, codigo: str) -> bool:
    codigo = (codigo or "").strip()
    if not codigo or not usuario.email_codigo_hash:
        return False
    if usuario.email_codigo_expira and usuario.email_codigo_expira < agora():
        return False
    if not check_password_hash(usuario.email_codigo_hash, codigo):
        return False
    usuario.email_verificado = True
    usuario.email_codigo_hash = None
    usuario.email_codigo_expira = None
    db.session.flush()
    return True


def _url_absoluta(caminho: str) -> str:
    """Monta URL absoluta preferindo SERVER_URL (estável fora de request)."""
    base = (current_app.config.get("SERVER_URL") or "").rstrip("/")
    if not caminho.startswith("/"):
        caminho = "/" + caminho
    if base:
        return f"{base}{caminho}"
    try:
        from flask import request

        if request:
            return request.url_root.rstrip("/") + caminho
    except Exception:
        pass
    return caminho


def enviar_verificacao(usuario: Usuario) -> bool:
    if not usuario.eh_email:
        raise ValueError("Esta conta não usa e-mail como usuário.")
    if not email_configurado() and not current_app.config.get("TESTING"):
        raise RuntimeError(
            "O envio de e-mail ainda não está configurado (RESEND_API_KEY ou MAIL_SERVER). "
            "No Railway use Resend (HTTPS)."
        )

    codigo = gerar_codigo_verificacao(usuario)
    token = gerar_token_verificacao(usuario.id)
    link = _url_absoluta(f"/verificar-email/{token}")
    nome = usuario.nome or "olá"
    texto = (
        f"Olá, {nome}!\n\n"
        f"Seu código de verificação do FinUP é: {codigo}\n\n"
        f"Ele vale por {CODIGO_VALIDADE_MIN} minutos.\n\n"
        f"Ou clique no link para confirmar:\n{link}\n\n"
        "Se você não criou esta conta, ignore este e-mail.\n"
    )
    html = (
        f"<p>Olá, <strong>{nome}</strong>!</p>"
        f"<p>Seu código de verificação do FinUP:</p>"
        f'<p style="font-size:28px;letter-spacing:6px;font-weight:800">{codigo}</p>'
        f"<p>Válido por {CODIGO_VALIDADE_MIN} minutos.</p>"
        f"<p>Ou confirme pelo link: <a href=\"{link}\">Verificar meu e-mail</a></p>"
        f"<p>Se não foi você, ignore este e-mail.</p>"
    )
    ok = enviar_email(
        para=usuario.username,
        assunto=f"Código {codigo} · Confirme seu e-mail · FinUP",
        texto=texto,
        html=html,
    )
    if not ok and not current_app.config.get("TESTING"):
        raise RuntimeError(
            "Não foi possível enviar o e-mail. Confira MAIL_SERVER / usuário / senha no Railway."
        )
    return ok


def enviar_reset_senha(usuario: Usuario) -> bool:
    if not usuario.eh_email:
        raise ValueError("Só é possível recuperar senha de contas com e-mail.")
    if not email_configurado() and not current_app.config.get("TESTING"):
        raise RuntimeError(
            "O envio de e-mail ainda não está configurado no servidor (MAIL_SERVER)."
        )
    token = gerar_token_reset(usuario.id)
    link = _url_absoluta(f"/redefinir-senha/{token}")
    nome = usuario.nome or "olá"
    texto = (
        f"Olá, {nome}!\n\n"
        f"Recebemos um pedido para redefinir sua senha no FinUP.\n"
        f"Abra o link abaixo (válido por 1 hora):\n{link}\n\n"
        "Se não foi você, ignore este e-mail.\n"
    )
    html = (
        f"<p>Olá, <strong>{nome}</strong>!</p>"
        f"<p>Redefina sua senha no FinUP:</p>"
        f'<p><a href="{link}">Criar nova senha</a></p>'
        f"<p>Ou copie: {link}</p>"
        f"<p>O link vale por 1 hora.</p>"
    )
    return enviar_email(
        para=usuario.username,
        assunto="Redefinir senha · FinUP",
        texto=texto,
        html=html,
    )


def base_url_app() -> str:
    return (current_app.config.get("SERVER_URL") or "").rstrip("/") or "http://127.0.0.1:5000"
