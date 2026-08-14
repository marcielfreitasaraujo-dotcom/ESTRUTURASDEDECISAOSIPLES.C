from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func

from app.extensions import db
from app.models import Categoria, Movimentacao
from app.services.saldo import saldo_usuario
from app.utils.formatters import MESES_PT


def _base(usuario_id: int, inicio: date, fim: date):
    return Movimentacao.query.filter(
        Movimentacao.usuario_id == usuario_id,
        Movimentacao.ativo.is_(True),
        Movimentacao.data >= inicio,
        Movimentacao.data <= fim,
    )


def _soma(query, tipo: str) -> Decimal:
    valor = (
        query.filter(Movimentacao.tipo == tipo)
        .with_entities(func.coalesce(func.sum(Movimentacao.valor), 0))
        .scalar()
    )
    return Decimal(str(valor))


def resumo_periodo(usuario_id: int, inicio: date, fim: date) -> dict:
    base = _base(usuario_id, inicio, fim)
    receitas = _soma(base, "receita")
    investimentos = _soma(base, "investimento")
    despesas = _soma(base, "despesa")
    saldo_periodo = receitas - despesas - investimentos
    return {
        "receitas": receitas,
        "despesas": despesas,
        "investimentos": investimentos,
        "saldo_periodo": saldo_periodo,
        "saldo_contas": saldo_usuario(usuario_id),
        "inicio": inicio,
        "fim": fim,
        "mes_nome": f"{MESES_PT[inicio.month]} de {inicio.year}",
    }


def receitas_despesas_por_dia(usuario_id: int, inicio: date, fim: date) -> dict:
    linhas = (
        db.session.query(
            Movimentacao.data,
            Movimentacao.tipo,
            func.coalesce(func.sum(Movimentacao.valor), 0),
        )
        .filter(
            Movimentacao.usuario_id == usuario_id,
            Movimentacao.ativo.is_(True),
            Movimentacao.data >= inicio,
            Movimentacao.data <= fim,
            Movimentacao.tipo.in_(("receita", "despesa", "investimento")),
        )
        .group_by(Movimentacao.data, Movimentacao.tipo)
        .all()
    )
    mapa = defaultdict(lambda: {"receita": Decimal("0"), "despesa": Decimal("0")})
    for dia, tipo, valor in linhas:
        chave = "receita" if tipo == "receita" else "despesa"
        mapa[dia][chave] += Decimal(str(valor))

    labels = []
    receitas = []
    despesas = []
    atual = inicio
    while atual <= fim:
        labels.append(atual.strftime("%d/%m"))
        receitas.append(float(mapa[atual]["receita"]))
        despesas.append(float(mapa[atual]["despesa"]))
        atual += timedelta(days=1)
    return {"labels": labels, "receitas": receitas, "despesas": despesas}


def gastos_por_categoria(usuario_id: int, inicio: date, fim: date) -> dict:
    linhas = (
        db.session.query(
            Categoria.nome,
            Categoria.cor,
            func.coalesce(func.sum(Movimentacao.valor), 0),
        )
        .join(Categoria, Movimentacao.categoria_id == Categoria.id)
        .filter(
            Movimentacao.usuario_id == usuario_id,
            Movimentacao.ativo.is_(True),
            Movimentacao.data >= inicio,
            Movimentacao.data <= fim,
            Movimentacao.tipo.in_(("despesa", "investimento")),
        )
        .group_by(Categoria.id)
        .order_by(func.sum(Movimentacao.valor).desc())
        .all()
    )
    return {
        "labels": [n for n, _, _ in linhas],
        "valores": [float(v) for _, _, v in linhas],
        "cores": [c or "#64748b" for _, c, _ in linhas],
    }


def evolucao_saldo(usuario_id: int, inicio: date, fim: date) -> dict:
    from app.models import Conta
    from app.services.saldo import saldo_conta

    contas = Conta.query.filter_by(usuario_id=usuario_id, ativo=True).all()
    saldo_hoje = sum((saldo_conta(c) for c in contas), Decimal("0"))

    linhas = (
        db.session.query(
            Movimentacao.data,
            Movimentacao.tipo,
            func.coalesce(func.sum(Movimentacao.valor), 0),
        )
        .filter(
            Movimentacao.usuario_id == usuario_id,
            Movimentacao.ativo.is_(True),
            Movimentacao.data >= inicio,
            Movimentacao.data <= fim,
            Movimentacao.tipo != "transferencia",
        )
        .group_by(Movimentacao.data, Movimentacao.tipo)
        .all()
    )
    delta = defaultdict(lambda: Decimal("0"))
    for dia, tipo, valor in linhas:
        v = Decimal(str(valor))
        if tipo == "receita":
            delta[dia] += v
        else:
            delta[dia] -= v

    labels = []
    valores = []
    atual = inicio
    acumulado = Decimal("0")
    serie = []
    while atual <= fim:
        acumulado += delta[atual]
        labels.append(atual.strftime("%d/%m"))
        serie.append(acumulado)
        atual += timedelta(days=1)

    # Ajusta a série para terminar no saldo atual das contas
    if serie:
        ajuste = saldo_hoje - serie[-1]
        valores = [float(p + ajuste) for p in serie]
    return {"labels": labels, "valores": valores}


def ultimas_movimentacoes(usuario_id: int, limite: int = 8):
    return (
        Movimentacao.query.filter_by(usuario_id=usuario_id, ativo=True)
        .order_by(Movimentacao.data.desc(), Movimentacao.id.desc())
        .limit(limite)
        .all()
    )
