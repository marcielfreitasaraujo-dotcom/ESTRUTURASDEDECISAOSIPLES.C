from flask_login import current_user

from app.extensions import db
from app.models import Auditoria


def registrar(acao: str, entidade: str, entidade_id: int | None = None, detalhes: str | None = None) -> None:
    usuario_id = current_user.id if current_user and current_user.is_authenticated else None
    db.session.add(
        Auditoria(
            usuario_id=usuario_id,
            acao=acao,
            entidade=entidade,
            entidade_id=entidade_id,
            detalhes=detalhes,
        )
    )
