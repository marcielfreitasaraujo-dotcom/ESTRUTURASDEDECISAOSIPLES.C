from calendar import monthrange
from datetime import date
from decimal import Decimal

from sqlalchemy import func

from app.extensions import db
from app.models import Cartao, Categoria, Movimentacao, Orcamento, Parcela
from app.models.usuario import agora
from app.utils.formatters import somar_meses


def periodo_mes(ano: int, mes: int) -> tuple[date, date]:
    inicio = date(ano, mes, 1)
    fim = date(ano, mes, monthrange(ano, mes)[1])
    return inicio, fim


def gastos_por_categoria(usuario_id: int, ano: int, mes: int) -> dict[int, Decimal]:
    inicio, fim = periodo_mes(ano, mes)
    ids_fatura = {
        row[0]
        for row in db.session.query(Parcela.movimentacao_id)
        .join(Cartao, Parcela.cartao_id == Cartao.id)
        .filter(
            Cartao.usuario_id == usuario_id,
            Parcela.movimentacao_id.isnot(None),
            Parcela.ativo.is_(True),
        )
        .distinct()
        .all()
        if row[0]
    }

    q_mov = db.session.query(
        Movimentacao.categoria_id,
        func.coalesce(func.sum(Movimentacao.valor), 0),
    ).filter(
        Movimentacao.usuario_id == usuario_id,
        Movimentacao.ativo.is_(True),
        Movimentacao.tipo.in_(("despesa", "investimento")),
        Movimentacao.categoria_id.isnot(None),
        Movimentacao.data >= inicio,
        Movimentacao.data <= fim,
    )
    if ids_fatura:
        q_mov = q_mov.filter(~Movimentacao.id.in_(ids_fatura))
    gastos: dict[int, Decimal] = {}
    for cat_id, valor in q_mov.group_by(Movimentacao.categoria_id).all():
        gastos[int(cat_id)] = Decimal(str(valor))

    competencia = date(ano, mes, 1)
    proximo = somar_meses(competencia, 1)
    q_par = (
        db.session.query(
            Parcela.categoria_id,
            func.coalesce(func.sum(Parcela.valor_parcela), 0),
        )
        .join(Cartao, Parcela.cartao_id == Cartao.id)
        .filter(
            Cartao.usuario_id == usuario_id,
            Parcela.ativo.is_(True),
            Parcela.categoria_id.isnot(None),
            Parcela.competencia >= competencia,
            Parcela.competencia < proximo,
        )
        .group_by(Parcela.categoria_id)
    )
    for cat_id, valor in q_par.all():
        gastos[int(cat_id)] = gastos.get(int(cat_id), Decimal("0")) + Decimal(str(valor))
    return gastos


def painel(usuario_id: int, ano: int, mes: int) -> list[dict]:
    gastos = gastos_por_categoria(usuario_id, ano, mes)
    categorias = (
        Categoria.query.filter(
            Categoria.ativo.is_(True),
            Categoria.tipo.in_(("despesa", "investimento")),
        )
        .order_by(Categoria.nome)
        .all()
    )
    limites = {
        o.categoria_id: o
        for o in Orcamento.query.filter_by(usuario_id=usuario_id, ano=ano, mes=mes, ativo=True).all()
    }
    itens = []
    for cat in categorias:
        orc = limites.get(cat.id)
        limite = orc.limite if orc else Decimal("0.00")
        gasto = gastos.get(cat.id, Decimal("0.00"))
        percentual = float((gasto / limite) * 100) if limite > 0 else 0.0
        itens.append(
            {
                "categoria": cat,
                "orcamento": orc,
                "limite": limite,
                "gasto": gasto,
                "restante": limite - gasto if limite > 0 else Decimal("0.00"),
                "percentual": min(percentual, 999),
                "status": "estouro" if limite > 0 and gasto > limite else "alerta" if percentual >= 80 else "ok",
            }
        )
    return itens


def salvar_limites(usuario_id: int, ano: int, mes: int, pares: list[tuple[int, Decimal]]) -> int:
    alterados = 0
    for categoria_id, limite in pares:
        registro = Orcamento.query.filter_by(
            usuario_id=usuario_id,
            categoria_id=categoria_id,
            ano=ano,
            mes=mes,
        ).first()
        if limite <= 0:
            if registro:
                registro.ativo = False
                registro.limite = Decimal("0.00")
                registro.atualizado_em = agora()
                alterados += 1
            continue
        if registro:
            registro.limite = limite
            registro.ativo = True
            registro.atualizado_em = agora()
        else:
            db.session.add(
                Orcamento(
                    usuario_id=usuario_id,
                    categoria_id=categoria_id,
                    ano=ano,
                    mes=mes,
                    limite=limite,
                    ativo=True,
                )
            )
        alterados += 1
    db.session.flush()
    return alterados


def estourados(usuario_id: int, ano: int, mes: int, limite: int = 5) -> list[dict]:
    return [item for item in painel(usuario_id, ano, mes) if item["status"] == "estouro"][:limite]
