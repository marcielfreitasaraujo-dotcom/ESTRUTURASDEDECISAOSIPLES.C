from decimal import Decimal

from sqlalchemy import case, func

from app.extensions import db
from app.models import Conta, Movimentacao


def _somas_por_conta(conta_id: int) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    linha = (
        db.session.query(
            func.coalesce(
                func.sum(case((Movimentacao.tipo == "receita", Movimentacao.valor), else_=0)),
                0,
            ),
            func.coalesce(
                func.sum(
                    case(
                        (Movimentacao.tipo.in_(("despesa", "investimento")), Movimentacao.valor),
                        else_=0,
                    )
                ),
                0,
            ),
            func.coalesce(
                func.sum(case((Movimentacao.tipo == "transferencia", Movimentacao.valor), else_=0)),
                0,
            ),
        )
        .filter(
            Movimentacao.conta_id == conta_id,
            Movimentacao.ativo.is_(True),
        )
        .one()
    )
    entradas, saidas, transferencias_saida = (Decimal(str(v)) for v in linha)

    transferencias_entrada = Decimal(
        str(
            db.session.query(func.coalesce(func.sum(Movimentacao.valor), 0))
            .filter(
                Movimentacao.conta_destino_id == conta_id,
                Movimentacao.tipo == "transferencia",
                Movimentacao.ativo.is_(True),
            )
            .scalar()
        )
    )
    return entradas, saidas, transferencias_saida, transferencias_entrada


def saldo_conta(conta: Conta) -> Decimal:
    entradas, saidas, transf_sai, transf_ent = _somas_por_conta(conta.id)
    return (conta.saldo_inicial or Decimal("0")) + entradas - saidas - transf_sai + transf_ent


def saldo_usuario(usuario_id: int) -> Decimal:
    contas = Conta.query.filter_by(usuario_id=usuario_id, ativo=True).all()
    return sum((saldo_conta(c) for c in contas), Decimal("0.00"))
