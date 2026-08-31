"""Remoção segura de usuários e dados financeiros vinculados."""

from __future__ import annotations

from pathlib import Path

from flask import current_app
from sqlalchemy import update

from app.extensions import db
from app.models import (
    Auditoria,
    Cartao,
    Categoria,
    CobrancaAssinatura,
    Comprovante,
    Conta,
    ContaPagar,
    Movimentacao,
    Notificacao,
    Orcamento,
    Parcela,
    Recorrencia,
    Usuario,
)


def remover_usuario_completo(membro: Usuario) -> str:
    """Apaga o usuário e os dados financeiros dele. Retorna o nome para flash."""
    if membro is None:
        raise ValueError("Usuário não encontrado.")
    if membro.eh_admin:
        raise ValueError("Não é permitido remover a conta de administrador.")

    uid = membro.id
    nome = membro.nome
    username = membro.username

    # Referências opcionais de outros registros apontando para este usuário
    db.session.execute(
        update(Movimentacao)
        .where(Movimentacao.criado_por == uid)
        .values(criado_por=None)
    )
    db.session.execute(
        update(Movimentacao)
        .where(Movimentacao.atualizado_por == uid)
        .values(atualizado_por=None)
    )
    db.session.execute(
        update(Movimentacao)
        .where(Movimentacao.excluido_por == uid)
        .values(excluido_por=None)
    )
    db.session.execute(
        update(ContaPagar).where(ContaPagar.pago_por == uid).values(pago_por=None)
    )
    db.session.execute(
        update(Categoria).where(Categoria.usuario_id == uid).values(usuario_id=None)
    )

    cartao_ids = [c.id for c in Cartao.query.filter_by(usuario_id=uid).all()]
    mov_ids = [m.id for m in Movimentacao.query.filter_by(usuario_id=uid).all()]

    if cartao_ids:
        Parcela.query.filter(Parcela.cartao_id.in_(cartao_ids)).delete(synchronize_session=False)
    if mov_ids:
        Parcela.query.filter(Parcela.movimentacao_id.in_(mov_ids)).delete(synchronize_session=False)
        ContaPagar.query.filter(ContaPagar.movimentacao_id.in_(mov_ids)).delete(
            synchronize_session=False
        )
        Comprovante.query.filter(Comprovante.movimentacao_id.in_(mov_ids)).delete(
            synchronize_session=False
        )

    Comprovante.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    ContaPagar.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Recorrencia.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    CobrancaAssinatura.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Movimentacao.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Cartao.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Orcamento.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Notificacao.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Auditoria.query.filter_by(usuario_id=uid).delete(synchronize_session=False)
    Conta.query.filter_by(usuario_id=uid).delete(synchronize_session=False)

    # arquivos de upload do usuário, se existirem
    try:
        pasta = Path(current_app.config["UPLOAD_FOLDER"]) / str(uid)
        if pasta.is_dir():
            for arquivo in pasta.rglob("*"):
                if arquivo.is_file():
                    arquivo.unlink(missing_ok=True)
            for sub in sorted(pasta.rglob("*"), reverse=True):
                if sub.is_dir():
                    sub.rmdir()
            pasta.rmdir()
    except Exception:
        pass

    db.session.delete(membro)
    db.session.flush()
    return f"{nome} (@{username})"
