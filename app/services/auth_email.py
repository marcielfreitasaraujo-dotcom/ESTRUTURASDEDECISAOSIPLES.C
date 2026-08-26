"""Helpers de verificação de e-mail e recuperação de senha."""

from __future__ import annotations

import re

from flask import current_app, url_for

from app.models import Usuario
from app.services.email import enviar_email
from app.utils.tokens import gerar_token_reset, gerar_token_verificacao

EMAIL_RE = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")


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


def enviar_verificacao(usuario: Usuario) -> bool:
    if not usuario.eh_email:
        raise ValueError("Esta conta não usa e-mail como usuário.")
    token = gerar_token_verificacao(usuario.id)
    link = url_for("auth.verificar_email", token=token, _external=True)
    nome = usuario.nome or "olá"
    texto = (
        f"Olá, {nome}!\n\n"
        f"Confirme seu e-mail no FinUP clicando no link abaixo:\n{link}\n\n"
        "O link vale por 48 horas. Se você não criou esta conta, ignore este e-mail.\n"
    )
    html = (
        f"<p>Olá, <strong>{nome}</strong>!</p>"
        f"<p>Confirme seu e-mail no FinUP:</p>"
        f'<p><a href="{link}">Verificar meu e-mail</a></p>'
        f"<p>Ou copie: {link}</p>"
        f"<p>O link vale por 48 horas.</p>"
    )
    return enviar_email(
        para=usuario.username,
        assunto="Confirme seu e-mail · FinUP",
        texto=texto,
        html=html,
    )


def enviar_reset_senha(usuario: Usuario) -> bool:
    if not usuario.eh_email:
        raise ValueError("Só é possível recuperar senha de contas com e-mail.")
    token = gerar_token_reset(usuario.id)
    link = url_for("auth.redefinir_senha", token=token, _external=True)
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
