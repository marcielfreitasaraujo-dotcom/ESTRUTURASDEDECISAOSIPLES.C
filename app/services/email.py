"""Envio de e-mails (SMTP). Em teste/dev sem SMTP, guarda no outbox em memória."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from flask import current_app, has_app_context

logger = logging.getLogger("finup.email")

# Outbox compartilhado (útil em testes e debug local)
OUTBOX: list[dict] = []


def limpar_outbox() -> None:
    OUTBOX.clear()


def email_configurado() -> bool:
    if not has_app_context():
        return False
    if current_app.config.get("TESTING"):
        return True
    host = (current_app.config.get("MAIL_SERVER") or "").strip()
    return bool(host)


def enviar_email(*, para: str, assunto: str, texto: str, html: str | None = None) -> bool:
    """Envia e-mail. Retorna True se enviou (ou registrou no outbox)."""
    para = (para or "").strip().lower()
    if not para or "@" not in para:
        raise ValueError("Destinatário de e-mail inválido.")

    remetente = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or "noreply@finup.local"
    )
    registro = {
        "para": para,
        "assunto": assunto,
        "texto": texto,
        "html": html or texto,
        "remetente": remetente,
    }
    OUTBOX.append(registro)

    if current_app.config.get("TESTING") or current_app.config.get("MAIL_SUPPRESS_SEND"):
        logger.info("E-mail (outbox/teste) para=%s assunto=%s", para, assunto)
        return True

    host = (current_app.config.get("MAIL_SERVER") or "").strip()
    if not host:
        logger.warning(
            "MAIL_SERVER não configurado — e-mail para %s só ficou no outbox local.",
            para,
        )
        return False

    porta = int(current_app.config.get("MAIL_PORT") or 587)
    usar_tls = bool(current_app.config.get("MAIL_USE_TLS", True))
    usar_ssl = bool(current_app.config.get("MAIL_USE_SSL", False))
    usuario = current_app.config.get("MAIL_USERNAME") or None
    senha = current_app.config.get("MAIL_PASSWORD") or None

    msg = EmailMessage()
    msg["Subject"] = assunto
    msg["From"] = remetente
    msg["To"] = para
    msg.set_content(texto)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        if usar_ssl:
            with smtplib.SMTP_SSL(host, porta, timeout=30) as smtp:
                if usuario and senha:
                    smtp.login(usuario, senha)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, porta, timeout=30) as smtp:
                if usar_tls:
                    smtp.starttls()
                if usuario and senha:
                    smtp.login(usuario, senha)
                smtp.send_message(msg)
        logger.info("E-mail enviado para=%s assunto=%s", para, assunto)
        return True
    except Exception:
        logger.exception("Falha ao enviar e-mail para=%s", para)
        raise
