"""Integração Kiwify: o webhook libera, renova ou bloqueia a assinatura pelo e-mail da compra.

Documentação: https://docs.kiwify.com.br/api-reference/webhooks/receiving
- A Kiwify manda POST JSON e acrescenta ?signature=<HMAC-SHA1 hex do corpo cru, chave = token>.
- O token nunca vem na requisição; por isso o corpo precisa ser lido cru, antes do JSON.
- Pode reenviar o mesmo aviso: tudo aqui é idempotente (uma linha por pedido).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from datetime import date, datetime, timedelta

from flask import current_app
from sqlalchemy import func

from app.extensions import db
from app.models.kiwify_pedido import STATUS_PENDENTE, KiwifyPedido
from app.models.usuario import Usuario
from app.utils.assinatura import bloquear_assinatura, liberar_assinatura, obter_plano_assinatura

logger = logging.getLogger("finup.kiwify")

# webhook_event_type enviado no corpo (não é o nome do gatilho no painel)
EVENTOS_LIBERAR = {"order_approved", "subscription_renewed"}
EVENTOS_BLOQUEAR = {"order_refunded", "chargeback", "subscription_canceled"}
# Atraso: não bloqueia na hora; o acesso termina sozinho quando o prazo vencer.
EVENTOS_INFORMATIVOS = {"subscription_late", "billet_created", "pix_created", "order_rejected"}

# Folga depois da data da próxima cobrança (a Kiwify tenta cobrar de novo por alguns dias)
DIAS_FOLGA = 3

CHAVE_CHECKOUT = "kiwify_checkout_url"
CHAVE_TOKEN = "kiwify_token"
CHAVE_PRODUTO = "kiwify_product_id"


# --------------------------------------------------------------------- configuração

def _cfg_valor(chave: str) -> str:
    from app.utils.assinatura import _cfg

    cfg = _cfg(chave)
    if cfg is None or cfg.valor is None:
        return ""
    return str(cfg.valor).strip()


def token_configurado() -> str:
    return (current_app.config.get("KIWIFY_TOKEN") or "").strip() or _cfg_valor(CHAVE_TOKEN)


def checkout_url() -> str:
    return (current_app.config.get("KIWIFY_CHECKOUT_URL") or "").strip() or _cfg_valor(CHAVE_CHECKOUT)


def produto_id_configurado() -> str:
    return str(current_app.config.get("KIWIFY_PRODUCT_ID") or "").strip() or _cfg_valor(CHAVE_PRODUTO)


def kiwify_habilitado() -> bool:
    return bool(token_configurado() or checkout_url())


def salvar_config_kiwify(*, checkout: str, token: str, produto_id: str) -> dict:
    from app.utils.assinatura import _definir_cfg

    url = (checkout or "").strip()[:300]
    if url and not url.lower().startswith("https://"):
        raise ValueError("O link da Kiwify precisa começar com https://")
    tok = (token or "").strip()[:200]
    if tok and len(tok) < 8:
        raise ValueError("O token do webhook da Kiwify parece curto demais.")
    pid = (produto_id or "").strip()[:80]
    _definir_cfg(CHAVE_CHECKOUT, url)
    if tok:
        _definir_cfg(CHAVE_TOKEN, tok)
    _definir_cfg(CHAVE_PRODUTO, pid)
    return {
        "checkout_url": checkout_url(),
        "token_configurado": bool(token_configurado()),
        "produto_id": produto_id_configurado(),
    }


# --------------------------------------------------------------------- assinatura (HMAC)

def assinatura_valida(corpo: bytes, assinatura: str | None) -> bool:
    """Confere ?signature= : HMAC-SHA1 (hex) do corpo cru com o token do webhook."""
    token = token_configurado()
    if not token or not assinatura:
        return False
    esperado = hmac.new(token.encode("utf-8"), corpo or b"", hashlib.sha1).hexdigest()
    return hmac.compare_digest(esperado, assinatura.strip().lower())


# --------------------------------------------------------------------- leitura do payload

def _obj(payload: dict, *nomes: str) -> dict:
    for nome in nomes:
        valor = payload.get(nome)
        if isinstance(valor, dict):
            return valor
    return {}


def _email(payload: dict) -> str:
    cliente = _obj(payload, "Customer", "customer")
    return str(cliente.get("email") or payload.get("email") or "").strip().lower()


def _pedido_id(payload: dict) -> str:
    return str(payload.get("order_id") or payload.get("id") or "").strip()[:80]


def _assinatura_id(payload: dict) -> str:
    sub = _obj(payload, "Subscription", "subscription")
    return str(payload.get("subscription_id") or sub.get("id") or "").strip()[:80]


def _produto_id(payload: dict) -> str:
    produto = _obj(payload, "Product", "product")
    valor = produto.get("product_id") or produto.get("id") or payload.get("product_id")
    return str(valor or "").strip()


def _produto_permitido(payload: dict) -> bool:
    esperado = produto_id_configurado()
    if not esperado:
        return True
    return _produto_id(payload) == esperado


def _data(valor) -> date | None:
    if not valor or not isinstance(valor, str):
        return None
    texto = valor.strip().replace("Z", "+00:00")
    for tentativa in (texto, texto.replace(" ", "T")):
        try:
            return datetime.fromisoformat(tentativa).date()
        except ValueError:
            continue
    try:
        return datetime.strptime(texto[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _vence_em(payload: dict) -> date:
    """Até quando liberar: próxima cobrança (+ folga) ou fim do acesso; senão, ciclo do plano."""
    sub = _obj(payload, "Subscription", "subscription")
    acesso = sub.get("customer_access") if isinstance(sub.get("customer_access"), dict) else {}
    candidatos = []
    proxima = _data(sub.get("next_payment"))
    if proxima:
        candidatos.append(proxima + timedelta(days=DIAS_FOLGA))
    ate = _data(acesso.get("access_until"))
    if ate:
        candidatos.append(ate)
    hoje = date.today()
    futuros = [d for d in candidatos if d > hoje]
    if futuros:
        return max(futuros)
    plano = obter_plano_assinatura()
    return hoje + timedelta(days=max(1, int(plano["dias"])) + DIAS_FOLGA)


# --------------------------------------------------------------------- aplicação

def _pode_receber_compra(usuario: Usuario) -> bool:
    """Só libera para quem já confirmou o e-mail (evita alguém 'pegar' a compra de outro)."""
    from app.services.auth_email import usuario_precisa_verificar_email

    return not usuario_precisa_verificar_email(usuario)


def _usuario_elegivel(usuario: Usuario | None) -> bool:
    return (
        usuario is not None
        and not usuario.eh_admin
        and not usuario.eh_familia
        and _pode_receber_compra(usuario)
    )


def _buscar_usuario(email: str) -> Usuario | None:
    if not email:
        return None
    return Usuario.query.filter(func.lower(Usuario.username) == email).first()


def aplicar_pedidos_pendentes(usuario: Usuario) -> int:
    """Libera a assinatura se existir compra Kiwify pendente para o e-mail da conta."""
    if usuario is None or usuario.eh_admin or usuario.eh_familia or not _pode_receber_compra(usuario):
        return 0
    email = (usuario.username or "").strip().lower()
    if not email:
        return 0
    pedidos = (
        KiwifyPedido.query.filter(
            func.lower(KiwifyPedido.email) == email,
            KiwifyPedido.status == STATUS_PENDENTE,
        )
        .order_by(KiwifyPedido.id.asc())
        .all()
    )
    aplicados = 0
    for pedido in pedidos:
        if pedido.vence_em and pedido.vence_em < date.today():
            pedido.marcar_cancelado()  # compra antiga já vencida: não libera
            continue
        liberar_assinatura(usuario, vence_em=pedido.vence_em)
        pedido.marcar_aplicado(usuario.id, vence_em=pedido.vence_em)
        aplicados += 1
    if aplicados:
        logger.info("Kiwify: %s pedido(s) aplicados usuario=%s", aplicados, email)
    return aplicados


def _upsert_pedido(payload: dict, *, pedido_id: str, email: str, evento: str) -> KiwifyPedido:
    pedido = KiwifyPedido.query.filter_by(pedido_id=pedido_id).first()
    dados = json.dumps(payload, ensure_ascii=False)[:8000]
    if pedido is None:
        pedido = KiwifyPedido(pedido_id=pedido_id, email=email, evento=evento)
        db.session.add(pedido)
    pedido.evento = evento
    pedido.email = email
    pedido.assinatura_id = _assinatura_id(payload) or pedido.assinatura_id
    pedido.produto_id = _produto_id(payload) or pedido.produto_id
    pedido.dados_json = dados
    db.session.flush()
    return pedido


def processar_webhook_kiwify(payload: dict) -> dict:
    """Processa um aviso da Kiwify. Retorna um resumo para log/teste."""
    payload = payload or {}
    evento = str(payload.get("webhook_event_type") or "").strip().lower()
    if not evento:
        # carrinho abandonado e outros avisos sem tipo: só confirma o recebimento
        return {"ok": True, "acao": "ignorado", "motivo": "sem_tipo"}
    if not _produto_permitido(payload):
        return {"ok": True, "acao": "ignorado", "motivo": "produto_de_outro_item"}
    if evento in EVENTOS_INFORMATIVOS:
        return {"ok": True, "acao": "ignorado", "evento": evento}

    email = _email(payload)
    pedido_id = _pedido_id(payload) or (("sub-" + _assinatura_id(payload)) if _assinatura_id(payload) else "")
    if not email:
        return {"ok": False, "motivo": "email_ausente"}
    if not pedido_id:
        return {"ok": False, "motivo": "pedido_ausente"}

    pedido = _upsert_pedido(payload, pedido_id=pedido_id, email=email, evento=evento)
    usuario = _buscar_usuario(email)

    if evento in EVENTOS_LIBERAR:
        pedido.vence_em = _vence_em(payload)
        if _usuario_elegivel(usuario):
            liberar_assinatura(usuario, vence_em=pedido.vence_em)
            pedido.marcar_aplicado(usuario.id, vence_em=pedido.vence_em)
            logger.info("Kiwify: assinatura liberada email=%s pedido=%s ate=%s", email, pedido_id, pedido.vence_em)
            return {"ok": True, "acao": "liberou", "email": email, "vence_em": pedido.vence_em.isoformat()}
        pedido.status = STATUS_PENDENTE
        logger.info("Kiwify: compra pendente de cadastro email=%s pedido=%s", email, pedido_id)
        return {"ok": True, "acao": "pendente", "email": email}

    if evento in EVENTOS_BLOQUEAR:
        pedido.marcar_cancelado()
        # outros pedidos pendentes da mesma assinatura também deixam de valer
        sub_id = _assinatura_id(payload)
        if sub_id:
            for outro in KiwifyPedido.query.filter_by(assinatura_id=sub_id, status=STATUS_PENDENTE).all():
                outro.marcar_cancelado()
        if usuario is not None and not usuario.eh_admin and not usuario.eh_familia:
            bloquear_assinatura(usuario)
            logger.info("Kiwify: assinatura bloqueada email=%s pedido=%s evento=%s", email, pedido_id, evento)
            return {"ok": True, "acao": "bloqueou", "email": email}
        return {"ok": True, "acao": "cancelou_pedido", "email": email}

    return {"ok": True, "acao": "ignorado", "evento": evento}
