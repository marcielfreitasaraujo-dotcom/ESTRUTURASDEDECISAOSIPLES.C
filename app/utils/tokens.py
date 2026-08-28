"""Tokens assinados para verificação de e-mail e redefinição de senha."""

from __future__ import annotations

from flask import current_app
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


def _serializer(salt: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt=salt)


def gerar_token_verificacao(usuario_id: int) -> str:
    return _serializer("finup-email-verify").dumps({"uid": int(usuario_id)})


def ler_token_verificacao(token: str, max_age: int = 60 * 60 * 48) -> int | None:
    try:
        data = _serializer("finup-email-verify").loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    try:
        return int(data.get("uid"))
    except (TypeError, ValueError, AttributeError):
        return None


def gerar_token_reset(usuario_id: int) -> str:
    return _serializer("finup-password-reset").dumps({"uid": int(usuario_id)})


def ler_token_reset(token: str, max_age: int = 60 * 60) -> int | None:
    try:
        data = _serializer("finup-password-reset").loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    try:
        return int(data.get("uid"))
    except (TypeError, ValueError, AttributeError):
        return None
