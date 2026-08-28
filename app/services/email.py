"""Envio de e-mails via Resend (HTTPS) ou SMTP. Em teste, usa outbox."""

from __future__ import annotations

import json
import logging
import smtplib
import socket
import urllib.error
import urllib.request
from email.message import EmailMessage

from flask import current_app, has_app_context

logger = logging.getLogger("finup.email")

OUTBOX: list[dict] = []


def limpar_outbox() -> None:
    OUTBOX.clear()


def email_configurado() -> bool:
    if not has_app_context():
        return False
    if current_app.config.get("TESTING"):
        return True
    if (current_app.config.get("RESEND_API_KEY") or "").strip():
        return True
    host = (current_app.config.get("MAIL_SERVER") or "").strip()
    return bool(host)


def _socket_ipv4(host: str, port: int, timeout: float = 30):
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
        from ssl import create_default_context

        raw = _socket_ipv4(host, port, timeout)
        context = self.context if getattr(self, "context", None) else create_default_context()
        return context.wrap_socket(raw, server_hostname=host)


def _enviar_resend(*, para: str, assunto: str, texto: str, html: str, remetente: str, api_key: str) -> bool:
    payload = {
        "from": remetente,
        "to": [para],
        "subject": assunto,
        "text": texto,
        "html": html,
    }
    # Cloudflare/Resend bloqueia o User-Agent padrão do urllib (erro 1010).
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "FinUP/1.0 (https://resend.com)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            corpo = resp.read().decode("utf-8", "replace")
            logger.info("E-mail Resend ok para=%s status=%s body=%s", para, resp.status, corpo[:200])
            return True
    except urllib.error.HTTPError as exc:
        detalhe = exc.read().decode("utf-8", "replace")
        logger.error("Resend HTTP %s: %s", exc.code, detalhe)
        detalhe_l = detalhe.lower()
        if exc.code == 403 and (
            "verify a domain" in detalhe_l
            or "only send testing emails to your own email" in detalhe_l
        ):
            raise RuntimeError(
                "O Resend (plano gratuito) só envia para o e-mail da conta Resend. "
                "Para mandar código a outros endereços, verifique um domínio em "
                "https://resend.com/domains e use um remetente desse domínio "
                "(ex.: FinUP <noreply@seudominio.com>)."
            ) from exc
        raise RuntimeError(f"Falha Resend ({exc.code}): {detalhe}") from exc


def _enviar_smtp(*, para: str, assunto: str, texto: str, html: str, remetente: str) -> bool:
    host = (current_app.config.get("MAIL_SERVER") or "").strip()
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
    logger.info("E-mail SMTP enviado para=%s assunto=%s", para, assunto)
    return True


def enviar_email(*, para: str, assunto: str, texto: str, html: str | None = None) -> bool:
    """Envia e-mail. Prefere Resend (HTTPS); cai para SMTP se não houver API key."""
    para = (para or "").strip().lower()
    if not para or "@" not in para:
        raise ValueError("Destinatário de e-mail inválido.")

    remetente = (
        current_app.config.get("MAIL_DEFAULT_SENDER")
        or current_app.config.get("MAIL_USERNAME")
        or "FinUP <onboarding@resend.dev>"
    )
    html_final = html or texto
    registro = {
        "para": para,
        "assunto": assunto,
        "texto": texto,
        "html": html_final,
        "remetente": remetente,
    }
    OUTBOX.append(registro)

    if current_app.config.get("TESTING") or current_app.config.get("MAIL_SUPPRESS_SEND"):
        logger.info("E-mail (outbox/teste) para=%s assunto=%s", para, assunto)
        return True

    api_key = (current_app.config.get("RESEND_API_KEY") or "").strip()
    host = (current_app.config.get("MAIL_SERVER") or "").strip()

    try:
        if api_key:
            return _enviar_resend(
                para=para,
                assunto=assunto,
                texto=texto,
                html=html_final,
                remetente=remetente,
                api_key=api_key,
            )
        if host:
            return _enviar_smtp(
                para=para,
                assunto=assunto,
                texto=texto,
                html=html_final,
                remetente=remetente,
            )
        logger.warning("Sem RESEND_API_KEY/MAIL_SERVER — e-mail para %s só no outbox.", para)
        return False
    except Exception:
        logger.exception("Falha ao enviar e-mail para=%s", para)
        raise
