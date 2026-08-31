"""Webhook Hotmart: registra a compra. O acesso do FinUP só libera via Mercado Pago."""

from __future__ import annotations

import hmac
import json
import logging
from datetime import date, datetime, timedelta, timezone

from flask import current_app

from app.extensions import db
from app.models.hotmart_pedido import (
    STATUS_PENDENTE,
    HotmartPedido,
)
from app.models.usuario import Usuario
from app.utils.assinatura import obter_plano_assinatura

logger = logging.getLogger("finup.hotmart")

EVENTOS_LIBERAR = {"PURCHASE_APPROVED", "PURCHASE_COMPLETE"}
EVENTOS_BLOQUEAR = {
    "PURCHASE_REFUNDED",
    "PURCHASE_CHARGEBACK",
    "PURCHASE_PROTEST",
    "SUBSCRIPTION_CANCELLATION",
}


def hottok_configurado() -> str:
    return (current_app.config.get("HOTMART_HOTTOK") or "").strip()


def checkout_url() -> str:
    return (current_app.config.get("HOTMART_CHECKOUT_URL") or "").strip()


def hotmart_habilitado() -> bool:
    return bool(hottok_configurado() or checkout_url())


def validar_hottok(header_valor: str | None) -> bool:
    esperado = hottok_configurado()
    if not esperado:
        return False
    recebido = (header_valor or "").strip()
    if not recebido:
        return False
    return hmac.compare_digest(recebido, esperado)


def _email_comprador(payload: dict) -> str:
    data = payload.get("data") or {}
    buyer = data.get("buyer") or {}
    return (buyer.get("email") or "").strip().lower()


def _transacao(payload: dict) -> str:
    data = payload.get("data") or {}
    purchase = data.get("purchase") or {}
    return str(purchase.get("transaction") or payload.get("id") or "").strip()[:80]


def _produto_id(payload: dict) -> str:
    data = payload.get("data") or {}
    product = data.get("product") or {}
    valor = product.get("id")
    if valor is None:
        return ""
    return str(valor).strip()


def _produto_permitido(payload: dict) -> bool:
    esperado = str(current_app.config.get("HOTMART_PRODUCT_ID") or "").strip()
    if not esperado:
        return True
    return _produto_id(payload) == esperado


def _ts_para_date(valor) -> date | None:
    if valor in (None, "", 0):
        return None
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    if isinstance(valor, str):
        texto = valor.strip()
        if texto.isdigit():
            valor = int(texto)
        else:
            try:
                return datetime.fromisoformat(texto.replace("Z", "+00:00")).date()
            except ValueError:
                return None
    if isinstance(valor, (int, float)):
        segundos = float(valor)
        if segundos > 10_000_000_000:
            segundos = segundos / 1000.0
        return datetime.fromtimestamp(segundos, tz=timezone.utc).date()
    return None


def _vence_em_do_payload(payload: dict) -> date:
    data = payload.get("data") or {}
    purchase = data.get("purchase") or {}
    vence = _ts_para_date(
        purchase.get("date_next_charge") or purchase.get("warranty_date")
    )
    if vence and vence > date.today():
        return vence
    plano = obter_plano_assinatura()
    return date.today() + timedelta(days=max(1, int(plano["dias"])))


def aplicar_pedidos_pendentes(usuario: Usuario) -> int:
    """Hotmart não libera acesso. Só o Mercado Pago (pagamento aprovado) libera a conta."""
    return 0


def _upsert_pedido(payload: dict, *, email: str, transacao: str, evento: str) -> HotmartPedido:
    pedido = HotmartPedido.query.filter_by(transacao=transacao).first()
    if pedido is None:
        pedido = HotmartPedido(
            transacao=transacao,
            email=email,
            evento=evento,
            produto_id=_produto_id(payload) or None,
            vence_em=_vence_em_do_payload(payload),
            dados_json=json.dumps(payload)[:8000],
        )
        db.session.add(pedido)
        db.session.flush()
        return pedido
    pedido.evento = evento
    pedido.email = email
    pedido.produto_id = _produto_id(payload) or pedido.produto_id
    pedido.vence_em = _vence_em_do_payload(payload)
    pedido.dados_json = json.dumps(payload)[:8000]
    return pedido


def processar_webhook_hotmart(payload: dict) -> dict:
    """Processa um evento Hotmart 2.0. Retorna um resumo para log/teste."""
    evento = str((payload or {}).get("event") or "").strip().upper()
    if not evento:
        return {"ok": False, "motivo": "evento_ausente"}
    if not _produto_permitido(payload):
        return {"ok": True, "motivo": "produto_ignorado"}

    email = _email_comprador(payload)
    transacao = _transacao(payload)
    if not transacao:
        return {"ok": False, "motivo": "transacao_ausente"}
    if not email:
        return {"ok": False, "motivo": "email_ausente"}

    pedido = _upsert_pedido(payload, email=email, transacao=transacao, evento=evento)

    if evento in EVENTOS_LIBERAR:
        pedido.vence_em = _vence_em_do_payload(payload)
        pedido.status = STATUS_PENDENTE
        logger.info(
            "Hotmart: compra registrada sem liberar acesso email=%s tx=%s (só Mercado Pago libera)",
            email,
            transacao,
        )
        return {"ok": True, "acao": "registrado", "email": email}

    if evento in EVENTOS_BLOQUEAR:
        pedido.marcar_cancelado()
        logger.info("Hotmart: cancelamento registrado email=%s tx=%s evento=%s", email, transacao, evento)
        return {"ok": True, "acao": "registrado_cancelamento", "email": email}

    return {"ok": True, "acao": "ignorado", "evento": evento}
