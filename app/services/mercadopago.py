"""Integração com a API do Mercado Pago (PIX dinâmico e cartão parcelado)."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.request
from decimal import Decimal
from typing import Any

from flask import current_app

logger = logging.getLogger("finup.mercadopago")

API_BASE = "https://api.mercadopago.com"


class MercadoPagoErro(RuntimeError):
    pass


def pagamento_habilitado() -> bool:
    return bool((current_app.config.get("MERCADOPAGO_ACCESS_TOKEN") or "").strip())


def usar_mock() -> bool:
    if current_app.config.get("TESTING"):
        return True
    return bool(current_app.config.get("PAGAMENTO_MOCK"))


def _token() -> str:
    token = (current_app.config.get("MERCADOPAGO_ACCESS_TOKEN") or "").strip()
    if not token:
        raise MercadoPagoErro("Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN).")
    return token


def _request(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"{API_BASE}{path}"
    data = None
    headers = {
        "Authorization": f"Bearer {_token()}",
        "Content-Type": "application/json",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detalhe = exc.read().decode("utf-8", errors="replace")
        logger.warning("Mercado Pago HTTP %s %s: %s", method, path, detalhe[:500])
        raise MercadoPagoErro(f"Erro no Mercado Pago ({exc.code}).") from exc
    except urllib.error.URLError as exc:
        raise MercadoPagoErro("Não foi possível contactar o Mercado Pago.") from exc


def _notification_url() -> str | None:
    base = (current_app.config.get("SERVER_URL") or "").rstrip("/")
    if not base or base.startswith("http://127.0.0.1") or base.startswith("http://localhost"):
        return None
    return f"{base}/webhooks/mercadopago"


def _payer(usuario) -> dict:
    email = (usuario.username or "").strip()
    if "@" not in email:
        email = f"{usuario.id}@finup.local"
    nome = (usuario.nome or "Cliente FinUP").strip().split()
    return {
        "email": email[:120],
        "first_name": (nome[0] if nome else "Cliente")[:60],
        "last_name": (" ".join(nome[1:]) if len(nome) > 1 else "FinUP")[:60],
    }


def criar_pagamento_pix(
    *,
    usuario,
    valor: Decimal,
    descricao: str,
    referencia: str,
    idempotency_key: str,
) -> dict[str, Any]:
    payload = {
        "transaction_amount": float(valor),
        "description": descricao[:200],
        "payment_method_id": "pix",
        "external_reference": referencia[:120],
        "payer": _payer(usuario),
    }
    notif = _notification_url()
    if notif:
        payload["notification_url"] = notif

    url = f"{API_BASE}/v1/payments"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {_token()}",
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotency_key[:60],
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detalhe = exc.read().decode("utf-8", errors="replace")
        logger.warning("PIX Mercado Pago falhou: %s", detalhe[:500])
        raise MercadoPagoErro("Não foi possível gerar o PIX. Tente novamente.") from exc


def criar_pagamento_cartao(
    *,
    usuario,
    valor: Decimal,
    descricao: str,
    referencia: str,
    idempotency_key: str,
    token: str,
    parcelas: int,
    payment_method_id: str,
    issuer_id: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "transaction_amount": float(valor),
        "token": token,
        "description": descricao[:200],
        "installments": max(1, min(12, int(parcelas))),
        "payment_method_id": payment_method_id,
        "external_reference": referencia[:120],
        "payer": _payer(usuario),
    }
    if issuer_id:
        payload["issuer_id"] = issuer_id
    notif = _notification_url()
    if notif:
        payload["notification_url"] = notif

    url = f"{API_BASE}/v1/payments"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {_token()}",
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotency_key[:60],
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detalhe = exc.read().decode("utf-8", errors="replace")
        logger.warning("Cartão Mercado Pago falhou: %s", detalhe[:500])
        raise MercadoPagoErro("Pagamento no cartão recusado. Verifique os dados e tente de novo.") from exc


def consultar_pagamento(payment_id: str) -> dict[str, Any]:
    return _request("GET", f"/v1/payments/{payment_id}")


def status_aprovado(status: str | None) -> bool:
    return (status or "").lower() == "approved"


def status_pendente(status: str | None) -> bool:
    return (status or "").lower() in {"pending", "in_process", "authorized"}


def status_rejeitado(status: str | None) -> bool:
    return (status or "").lower() in {"rejected", "cancelled", "refunded", "charged_back"}


def extrair_pix(dados: dict) -> tuple[str | None, str | None]:
    poi = dados.get("point_of_interaction") or {}
    tx = poi.get("transaction_data") or {}
    payload = tx.get("qr_code")
    qr_b64 = tx.get("qr_code_base64")
    return payload, qr_b64


def validar_assinatura_webhook(request) -> bool:
    secret = (current_app.config.get("MERCADOPAGO_WEBHOOK_SECRET") or "").strip()
    if not secret:
        return True
    x_sig = request.headers.get("x-signature") or ""
    x_req = request.headers.get("x-request-id") or ""
    parts = {}
    for item in x_sig.split(","):
        if "=" in item:
            k, v = item.split("=", 1)
            parts[k.strip()] = v.strip()
    ts = parts.get("ts")
    v1 = parts.get("v1")
    if not ts or not v1:
        return False
    data_id = request.args.get("data.id") or request.args.get("id") or ""
    manifest = f"id:{data_id};request-id:{x_req};ts:{ts};"
    digest = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, v1)
