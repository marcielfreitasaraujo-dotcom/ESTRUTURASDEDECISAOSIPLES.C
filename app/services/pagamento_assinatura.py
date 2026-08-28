"""Cobranças de assinatura: PIX automático (OpenPix → Nubank) e cartão parcelado."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import timedelta
from decimal import Decimal

from flask import current_app

from app.extensions import db
from app.models.cobranca_assinatura import (
    METODO_CARTAO,
    METODO_PIX,
    PROVEDOR_MERCADOPAGO,
    PROVEDOR_MOCK,
    PROVEDOR_OPENPIX,
    STATUS_CANCELADO,
    STATUS_ERRO,
    STATUS_EXPIRADO,
    STATUS_PAGO,
    STATUS_PENDENTE,
    CobrancaAssinatura,
)
from app.models.usuario import Usuario, agora
from app.utils.assinatura import liberar_assinatura, obter_plano_assinatura

logger = logging.getLogger("finup.pagamento")


class PagamentoAssinaturaErro(ValueError):
    pass


def _usar_mock() -> bool:
    from app.services import openpix as opx

    return opx.usar_mock()


def pix_automatico_disponivel() -> bool:
    from app.services import openpix as opx

    if _usar_mock():
        return True
    return opx.pagamento_habilitado()


def cartao_automatico_disponivel() -> bool:
    from app.services import mercadopago as mp

    if _usar_mock():
        return True
    return mp.pagamento_habilitado()


def pagamento_automatico_disponivel() -> bool:
    return pix_automatico_disponivel() or cartao_automatico_disponivel()


def _referencia(cobranca: CobrancaAssinatura) -> str:
    return f"finup-{cobranca.usuario_id}-{cobranca.id}"


def _descricao_plano() -> str:
    plano = obter_plano_assinatura()
    return f"FinUP {plano['nome']}"


def _expira_em():
    return agora() + timedelta(hours=24)


def _cobranca_pendente(usuario: Usuario, metodo: str) -> CobrancaAssinatura | None:
    plano = obter_plano_assinatura()
    valor = plano["valor"]
    limite = agora()
    return (
        CobrancaAssinatura.query.filter_by(
            usuario_id=usuario.id,
            metodo=metodo,
            status=STATUS_PENDENTE,
        )
        .filter(CobrancaAssinatura.valor == valor)
        .filter((CobrancaAssinatura.expira_em.is_(None)) | (CobrancaAssinatura.expira_em > limite))
        .order_by(CobrancaAssinatura.id.desc())
        .first()
    )


def _serializar_cobranca(cobranca: CobrancaAssinatura) -> dict:
    qr_data_uri = None
    if cobranca.pix_qr_base64:
        if cobranca.pix_qr_base64.startswith("http"):
            qr_data_uri = cobranca.pix_qr_base64
        else:
            qr_data_uri = f"data:image/png;base64,{cobranca.pix_qr_base64}"
    elif cobranca.pix_payload:
        from app.services.pix import payload_para_qr_data_uri

        qr_data_uri = payload_para_qr_data_uri(cobranca.pix_payload)
    return {
        "id": cobranca.id,
        "metodo": cobranca.metodo,
        "status": cobranca.status,
        "valor": str(cobranca.valor_decimal),
        "parcelas": cobranca.parcelas,
        "pix_payload": cobranca.pix_payload,
        "qr_data_uri": qr_data_uri,
        "checkout_url": cobranca.checkout_url,
        "expira_em": cobranca.expira_em.isoformat() if cobranca.expira_em else None,
    }


def obter_cobranca_pix(usuario: Usuario) -> dict | None:
    if not pix_automatico_disponivel():
        return None
    cobranca = _cobranca_pendente(usuario, METODO_PIX)
    if cobranca is None:
        cobranca = _criar_cobranca_pix(usuario)
    else:
        sincronizar_cobranca(cobranca)
    if cobranca.status != STATUS_PENDENTE:
        return None
    return _serializar_cobranca(cobranca)


def _criar_cobranca_pix(usuario: Usuario) -> CobrancaAssinatura:
    from app.services import openpix as opx

    plano = obter_plano_assinatura()
    valor = plano["valor"]
    cobranca = CobrancaAssinatura(
        usuario_id=usuario.id,
        provedor=PROVEDOR_MOCK if _usar_mock() else PROVEDOR_OPENPIX,
        metodo=METODO_PIX,
        valor=valor,
        expira_em=_expira_em(),
    )
    db.session.add(cobranca)
    db.session.flush()

    referencia = _referencia(cobranca)
    descricao = _descricao_plano()

    if _usar_mock():
        from app.services.pix import gerar_payload_pix, montar_txid

        if not plano.get("pix_chave"):
            raise PagamentoAssinaturaErro("Cadastre a chave PIX do Nubank no painel Financeiro.")
        payload = gerar_payload_pix(
            chave=plano["pix_chave"],
            nome_recebedor=plano["pix_nome"],
            cidade=plano["pix_cidade"],
            valor=valor,
            txid=montar_txid(usuario.id),
            descricao=descricao,
        )
        cobranca.referencia_externa = referencia
        cobranca.pix_payload = payload
        cobranca.pix_qr_base64 = None
    else:
        email = usuario.username if usuario.eh_email else None
        dados = opx.criar_cobranca_pix(
            correlation_id=referencia,
            valor=valor,
            comentario=descricao,
            email_cliente=email,
        )
        charge = dados.get("charge") or dados
        br_code, qr_url, charge_id = opx.extrair_pix(dados)
        cobranca.referencia_externa = charge_id or referencia
        cobranca.pix_payload = br_code
        cobranca.pix_qr_base64 = qr_url
        cobranca.dados_json = json.dumps({"status_openpix": charge.get("status")})[:4000]

    if not cobranca.pix_payload:
        cobranca.marcar_erro()
        raise PagamentoAssinaturaErro("Não foi possível gerar o PIX.")

    db.session.flush()
    return cobranca


def processar_pagamento_cartao(usuario: Usuario, dados: dict) -> dict:
    from app.services import mercadopago as mp

    if not cartao_automatico_disponivel():
        raise PagamentoAssinaturaErro("Pagamento no cartão indisponível no momento.")

    token = (dados.get("token") or "").strip()
    if not token:
        raise PagamentoAssinaturaErro("Dados do cartão incompletos.")

    parcelas = int(dados.get("installments") or dados.get("parcelas") or 1)
    payment_method_id = (dados.get("payment_method_id") or "").strip()
    issuer_id = (dados.get("issuer_id") or "").strip() or None
    if not payment_method_id:
        raise PagamentoAssinaturaErro("Bandeira do cartão não identificada.")

    plano = obter_plano_assinatura()
    valor = plano["valor"]
    cobranca = CobrancaAssinatura(
        usuario_id=usuario.id,
        provedor=PROVEDOR_MOCK if _usar_mock() else PROVEDOR_MERCADOPAGO,
        metodo=METODO_CARTAO,
        valor=valor,
        parcelas=max(1, min(12, parcelas)),
    )
    db.session.add(cobranca)
    db.session.flush()

    referencia = f"finup:{cobranca.usuario_id}:{cobranca.id}"
    descricao = _descricao_plano()

    if _usar_mock():
        cobranca.referencia_externa = f"mock-card-{cobranca.id}"
        cobranca.marcar_paga()
        _liberar_por_cobranca(cobranca)
        db.session.flush()
        return {"status": STATUS_PAGO, "cobranca_id": cobranca.id, "redirect": "/"}

    dados_mp = mp.criar_pagamento_cartao(
        usuario=usuario,
        valor=valor,
        descricao=descricao,
        referencia=referencia,
        idempotency_key=f"card-{cobranca.id}-{uuid.uuid4().hex[:8]}",
        token=token,
        parcelas=parcelas,
        payment_method_id=payment_method_id,
        issuer_id=issuer_id,
    )
    cobranca.referencia_externa = str(dados_mp.get("id") or "")
    cobranca.dados_json = json.dumps({"status_mp": dados_mp.get("status")})[:4000]
    status_mp = (dados_mp.get("status") or "").lower()

    if mp.status_aprovado(status_mp):
        cobranca.marcar_paga()
        _liberar_por_cobranca(cobranca)
    elif mp.status_rejeitado(status_mp):
        cobranca.marcar_erro()
        raise PagamentoAssinaturaErro("Pagamento recusado. Tente outro cartão ou use PIX.")
    else:
        cobranca.status = STATUS_PENDENTE

    db.session.flush()
    return {
        "status": cobranca.status,
        "cobranca_id": cobranca.id,
        "redirect": "/" if cobranca.paga else None,
    }


def sincronizar_cobranca(cobranca: CobrancaAssinatura) -> str:
    if cobranca.paga:
        return STATUS_PAGO
    if cobranca.expira_em and cobranca.expira_em <= agora():
        cobranca.marcar_expirada()
        db.session.flush()
        return STATUS_EXPIRADO

    if cobranca.provedor == PROVEDOR_MOCK:
        return cobranca.status

    if cobranca.metodo == METODO_PIX and cobranca.provedor == PROVEDOR_OPENPIX:
        return _sincronizar_openpix(cobranca)

    if cobranca.metodo == METODO_CARTAO and cobranca.provedor == PROVEDOR_MERCADOPAGO:
        return _sincronizar_mercadopago(cobranca)

    return cobranca.status


def _sincronizar_openpix(cobranca: CobrancaAssinatura) -> str:
    from app.services import openpix as opx

    ref = cobranca.referencia_externa or _referencia(cobranca)
    try:
        dados = opx.consultar_cobranca(ref)
    except Exception as exc:
        logger.warning("Falha ao consultar OpenPix %s: %s", ref, exc)
        return cobranca.status

    charge = dados.get("charge") or dados
    status_opx = charge.get("status")
    cobranca.dados_json = json.dumps({"status_openpix": status_opx})[:4000]

    if opx.status_aprovado(status_opx):
        cobranca.marcar_paga()
        _liberar_por_cobranca(cobranca)
    elif opx.status_expirado(status_opx):
        cobranca.marcar_expirada()
    elif not opx.status_pendente(status_opx):
        cobranca.marcar_cancelada()

    db.session.flush()
    return cobranca.status


def _sincronizar_mercadopago(cobranca: CobrancaAssinatura) -> str:
    from app.services import mercadopago as mp

    if not cobranca.referencia_externa:
        return cobranca.status

    try:
        dados = mp.consultar_pagamento(cobranca.referencia_externa)
    except Exception as exc:
        logger.warning("Falha ao consultar Mercado Pago %s: %s", cobranca.referencia_externa, exc)
        return cobranca.status

    status_mp = (dados.get("status") or "").lower()
    cobranca.dados_json = json.dumps({"status_mp": status_mp})[:4000]

    if mp.status_aprovado(status_mp):
        cobranca.marcar_paga()
        _liberar_por_cobranca(cobranca)
    elif mp.status_rejeitado(status_mp):
        cobranca.marcar_erro()
    elif not mp.status_pendente(status_mp):
        cobranca.marcar_cancelada()

    db.session.flush()
    return cobranca.status


def consultar_status_cobranca(usuario: Usuario, cobranca_id: int | None = None) -> dict:
    cobranca = None
    if cobranca_id:
        cobranca = CobrancaAssinatura.query.filter_by(id=cobranca_id, usuario_id=usuario.id).first()
    if cobranca is None:
        cobranca = (
            CobrancaAssinatura.query.filter_by(usuario_id=usuario.id)
            .order_by(CobrancaAssinatura.id.desc())
            .first()
        )
    if cobranca is None:
        return {"status": "sem_cobranca"}

    status = sincronizar_cobranca(cobranca)
    resp = {"status": status, "cobranca_id": cobranca.id}
    if status == STATUS_PAGO:
        membro = db.session.get(Usuario, usuario.id)
        vence = membro.assinatura_vence_em.strftime("%d/%m/%Y") if membro and membro.assinatura_vence_em else ""
        resp["redirect"] = "/"
        resp["mensagem"] = f"Pagamento confirmado! Acesso liberado até {vence}."
    return resp


def _liberar_por_cobranca(cobranca: CobrancaAssinatura) -> None:
    if cobranca.status != STATUS_PAGO:
        return
    membro = db.session.get(Usuario, cobranca.usuario_id)
    if membro is None:
        return
    liberar_assinatura(membro)


def processar_webhook_openpix(payload: dict) -> bool:
    from app.services import openpix as opx

    correlation_id = opx.processar_evento_webhook(payload)
    if not correlation_id:
        return False

    cobranca = CobrancaAssinatura.query.filter_by(referencia_externa=correlation_id).first()
    if cobranca is None:
        partes = (correlation_id or "").split("-")
        if len(partes) >= 3 and partes[0] == "finup":
            try:
                cobranca = db.session.get(CobrancaAssinatura, int(partes[2]))
            except (TypeError, ValueError):
                cobranca = None
    if cobranca is None:
        return False

    antes = cobranca.status
    sincronizar_cobranca(cobranca)
    return cobranca.status != antes or cobranca.paga


def processar_webhook_mercadopago(payload: dict) -> bool:
    from app.services import mercadopago as mp

    payment_id = None
    if payload.get("type") == "payment" or payload.get("topic") == "payment":
        data = payload.get("data") or {}
        payment_id = data.get("id") or payload.get("id")
    if not payment_id:
        action = payload.get("action") or ""
        if action.startswith("payment."):
            payment_id = (payload.get("data") or {}).get("id")

    if not payment_id:
        return False

    cobranca = CobrancaAssinatura.query.filter_by(referencia_externa=str(payment_id)).first()
    if cobranca is None:
        try:
            dados = mp.consultar_pagamento(str(payment_id))
        except Exception:
            return False
        ref = dados.get("external_reference") or ""
        partes = ref.split(":")
        if len(partes) >= 3 and partes[0] == "finup":
            try:
                cobranca = db.session.get(CobrancaAssinatura, int(partes[2]))
            except (TypeError, ValueError):
                cobranca = None
        if cobranca is None:
            return False

    antes = cobranca.status
    sincronizar_cobranca(cobranca)
    return cobranca.status != antes or cobranca.paga


def simular_pagamento_mock(cobranca_id: int, usuario_id: int) -> bool:
    if not current_app.config.get("TESTING"):
        return False
    cobranca = CobrancaAssinatura.query.filter_by(id=cobranca_id, usuario_id=usuario_id).first()
    if cobranca is None or cobranca.provedor != PROVEDOR_MOCK or not cobranca.pendente:
        return False
    cobranca.marcar_paga()
    _liberar_por_cobranca(cobranca)
    db.session.flush()
    return True


def config_pagamento_frontend() -> dict:
    from app.services import mercadopago as mp

    plano = obter_plano_assinatura()
    max_parcelas = int(current_app.config.get("MERCADOPAGO_MAX_PARCELAS") or 12)
    return {
        "disponivel": pagamento_automatico_disponivel(),
        "pix_disponivel": pix_automatico_disponivel(),
        "mock": _usar_mock(),
        "public_key": (current_app.config.get("MERCADOPAGO_PUBLIC_KEY") or "").strip(),
        "valor": str(plano["valor"]),
        "max_parcelas": max(1, min(12, max_parcelas)),
        "cartao_habilitado": cartao_automatico_disponivel(),
        "banco_destino": "Nubank",
    }
