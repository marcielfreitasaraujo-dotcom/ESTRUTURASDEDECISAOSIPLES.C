"""Limite de tentativas contra adivinhação de senha e de código."""

from __future__ import annotations

import logging
from datetime import timedelta

from flask import request

from app.extensions import db
from app.models.tentativa import TentativaAcesso
from app.models.usuario import agora

logger = logging.getLogger("finup.limite")

JANELA = timedelta(minutes=15)

# (máximo de falhas na janela) por tipo de chave
LIMITES = {
    "login-usuario": 8,
    "login-ip": 40,
    "codigo": 6,
    "esqueci-ip": 10,
}


def ip_cliente() -> str:
    return (request.remote_addr or "desconhecido")[:60]


def _chave(tipo: str, valor: str) -> str:
    return f"{tipo}:{(valor or '').strip().lower()}"[:200]


def _contar(chave: str) -> int:
    desde = agora() - JANELA
    return TentativaAcesso.query.filter(
        TentativaAcesso.chave == chave, TentativaAcesso.criado_em >= desde
    ).count()


def bloqueado(tipo: str, valor: str) -> bool:
    try:
        return _contar(_chave(tipo, valor)) >= LIMITES[tipo]
    except Exception:
        # Nunca derruba o login por causa do limitador
        logger.exception("Falha ao consultar limite %s", tipo)
        db.session.rollback()
        return False


def registrar_falha(tipo: str, valor: str) -> None:
    try:
        db.session.add(TentativaAcesso(chave=_chave(tipo, valor)))
        _limpar_antigas()
        db.session.commit()
    except Exception:
        logger.exception("Falha ao registrar tentativa %s", tipo)
        db.session.rollback()


def limpar(tipo: str, valor: str) -> None:
    try:
        TentativaAcesso.query.filter_by(chave=_chave(tipo, valor)).delete()
        db.session.commit()
    except Exception:
        logger.exception("Falha ao limpar tentativas %s", tipo)
        db.session.rollback()


def _limpar_antigas() -> None:
    limite = agora() - JANELA * 4
    TentativaAcesso.query.filter(TentativaAcesso.criado_em < limite).delete()
