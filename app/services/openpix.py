"""Integração OpenPix (Woovi) — PIX automático com depósito no Nubank."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from decimal import Decimal
from typing import Any

from flask import current_app

logger = logging.getLogger("finup.openpix")

API_BASE = "https://api.openpix.com.br/api/v1"


class OpenPixErro(RuntimeError):
    pass


def pagamento_habilitado() -> bool:
    return bool((current_app.config.get("OPENPIX_APP_ID") or "").strip())


def usar_mock() -> bool:
    if current_app.config.get("TESTING"):
        return True
    return bool(current_app.config.get("PAGAMENTO_MOCK"))


def _app_id() -> str:
    app_id = (current_app.config.get("OPENPIX_APP_ID") or "").strip()
    if not app_id:
        raise OpenPixErro("OpenPix não configurado (OPENPIX_APP_ID).")
    return app_id


def _request(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"{API_BASE}{path}"
    data = None
    headers = {
        "Authorization": _app_id(),
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
        logger.warning("OpenPix HTTP %s %s: %s", method, path, detalhe[:500])
        raise OpenPixErro("Erro ao comunicar com OpenPix.") from exc
    except urllib.error.URLError as exc:
        raise OpenPixErro("Não foi possível contactar o OpenPix.") from exc


def valor_centavos(valor: Decimal) -> int:
    return int((valor * 100).quantize(Decimal("1")))


def criar_cobranca_pix(
    *,
    correlation_id: str,
    valor: Decimal,
    comentario: str,
    email_cliente: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "correlationID": correlation_id[:120],
        "value": valor_centavos(valor),
        "comment": comentario[:140],
    }
    if email_cliente and "@" in email_cliente:
        payload["customer"] = {"email": email_cliente[:120]}
    return _request("POST", "/charge", payload)


def consultar_cobranca(correlation_id: str) -> dict[str, Any]:
    from urllib.parse import quote

    cid = quote(correlation_id, safe="")
    return _request("GET", f"/charge/{cid}")


def extrair_pix(dados: dict) -> tuple[str | None, str | None, str | None]:
    charge = dados.get("charge") or dados
    br_code = charge.get("brCode")
    qr_url = charge.get("qrCodeImage")
    charge_id = charge.get("correlationID") or charge.get("identifier")
    return br_code, qr_url, charge_id


def status_aprovado(status: str | None) -> bool:
    return (status or "").upper() == "COMPLETED"


def status_pendente(status: str | None) -> bool:
    return (status or "").upper() in {"ACTIVE", "PENDING"}


def status_expirado(status: str | None) -> bool:
    return (status or "").upper() == "EXPIRED"


def processar_evento_webhook(payload: dict) -> str | None:
    evento = payload.get("event") or ""
    charge = payload.get("charge") or {}
    if evento in {"OPENPIX:CHARGE_COMPLETED", "OPENPIX:TRANSACTION_RECEIVED"}:
        return charge.get("correlationID") or charge.get("identifier")
    if charge.get("status") == "COMPLETED":
        return charge.get("correlationID") or charge.get("identifier")
    return None
