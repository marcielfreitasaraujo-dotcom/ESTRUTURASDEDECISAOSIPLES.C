from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func

from app.extensions import db
from app.models import Categoria, Movimentacao
from app.services.saldo import saldo_usuario
from app.utils.formatters import MESES_PT



def _rotulo_periodo(inicio, fim) -> str:
    """'Agosto de 2026' quando é um mês só; senão '14/08 a 11/11/2026'."""
    if inicio == fim:
        return inicio.strftime("%d/%m/%Y")
    if (inicio.year, inicio.month) == (fim.year, fim.month) and inicio.day == 1:
        return f"{MESES_PT[inicio.month]} de {inicio.year}"
    if inicio.year == fim.year:
        return f"{inicio.strftime('%d/%m')} a {fim.strftime('%d/%m/%Y')}"
    return f"{inicio.strftime('%d/%m/%Y')} a {fim.strftime('%d/%m/%Y')}"

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
        "mes_nome": _rotulo_periodo(inicio, fim),
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


# ---------------------------------------------------------------------------
# Comparação com o período anterior (painel novo). Só leitura: usa as mesmas
# somas de resumo_periodo, numa janela de mesmo tamanho logo antes da atual.
# ---------------------------------------------------------------------------


def periodo_anterior(inicio: date, fim: date) -> tuple[date, date]:
    dias = (fim - inicio).days + 1
    fim_ant = inicio - timedelta(days=1)
    return fim_ant - timedelta(days=dias - 1), fim_ant


def variacao_pct(atual: Decimal, anterior: Decimal) -> float | None:
    """Variação % em relação ao anterior. None quando não há base para comparar."""
    atual = Decimal(atual or 0)
    anterior = Decimal(anterior or 0)
    if anterior == 0:
        return 0.0 if atual == 0 else None
    return float((atual - anterior) / abs(anterior) * 100)


def comparativo(usuario_id: int, inicio: date, fim: date, atual: dict) -> dict:
    ini_ant, fim_ant = periodo_anterior(inicio, fim)
    base = _base(usuario_id, ini_ant, fim_ant)
    anterior = {
        "receitas": _soma(base, "receita"),
        "despesas": _soma(base, "despesa"),
        "investimentos": _soma(base, "investimento"),
    }
    anterior["saldo_periodo"] = anterior["receitas"] - anterior["despesas"] - anterior["investimentos"]
    return {
        "inicio": ini_ant,
        "fim": fim_ant,
        "anterior": anterior,
        "pct": {k: variacao_pct(atual[k], anterior[k]) for k in anterior},
    }


def sparkline(valores: list[float], pontos: int = 14, largura: int = 120, altura: int = 36) -> str:
    """Caminho SVG simples (acumulado em blocos) para a minicurva dos indicadores."""
    if not valores:
        return ""
    tamanho = max(1, -(-len(valores) // pontos))
    blocos = [sum(valores[i:i + tamanho]) for i in range(0, len(valores), tamanho)]
    acumulado, serie = 0.0, []
    for v in blocos:
        acumulado += v
        serie.append(acumulado)
    minimo, maximo = min(serie), max(serie)
    faixa = (maximo - minimo) or 1.0
    passo = largura / max(1, len(serie) - 1)
    coords = [
        f"{i * passo:.1f},{altura - 3 - (v - minimo) / faixa * (altura - 6):.1f}"
        for i, v in enumerate(serie)
    ]
    if len(coords) == 1:
        coords.append(f"{largura},{coords[0].split(',')[1]}")
    return "M" + " L".join(coords)


def legenda_categorias(dados: dict, limite: int = 7) -> dict:
    """Lista de categorias com % do total para a legenda ao lado da rosca."""
    total = sum(dados.get("valores") or []) or 0.0
    itens = [
        {"nome": n, "valor": v, "cor": c, "pct": (v / total * 100) if total else 0.0}
        for n, v, c in zip(dados.get("labels", []), dados.get("valores", []), dados.get("cores", []))
    ]
    if len(itens) > limite:
        resto = itens[limite - 1:]
        itens = itens[: limite - 1] + [{
            "nome": "Outras",
            "valor": sum(i["valor"] for i in resto),
            "cor": "#5d7286",
            "pct": sum(i["pct"] for i in resto),
        }]
    return {"total": total, "itens": itens}
