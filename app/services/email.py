"""Envio de e-mails (SMTP). Em teste/dev sem SMTP, guarda no outbox em memória."""

from __future__ import annotations

import logging
import smtplib
import socket
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


def _socket_ipv4(host: str, port: int, timeout: float = 30):
    """Abre socket IPv4 (Railway costuma falhar em IPv6 com Network unreachable)."""
    erros: list[OSError] = []
    for family, socktype, proto, _canon, sockaddr in socket.getaddrinfo(
        host, port, socket.AF_INET, socket.SOCK_STREAM
    ):
        sock = None
        try:
            sock = socket.socket(family, socktype, proto)
            sock.settimeout(timeout)
            sock.connect(sockaddr)
            return sock
        except OSError as exc:
            erros.append(exc)
            if sock is not None:
                try:
                    sock.close()
                except OSError:
                    pass
    if erros:
        raise erros[-1]
    raise OSError(f"Não foi possível conectar em {host}:{port} via IPv4")


class _SMTP_IPv4(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return _socket_ipv4(host, port, timeout)


class _SMTP_SSL_IPv4(smtplib.SMTP_SSL):
    def _get_socket(self, host, port, timeout):
        # SMTP_SSL espera o socket já envolvido em SSL depois; base class wraps it.
        from ssl import create_default_context

        raw = _socket_ipv4(host, port, timeout)
        context = self.context if getattr(self, "context", None) else create_default_context()
        return context.wrap_socket(raw, server_hostname=host)


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
        if usar_ssl or porta == 465:
            with _SMTP_SSL_IPv4(host, porta, timeout=30) as smtp:
                if usuario and senha:
                    smtp.login(usuario, senha)
                smtp.send_message(msg)
        else:
            with _SMTP_IPv4(host, porta, timeout=30) as smtp:
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
