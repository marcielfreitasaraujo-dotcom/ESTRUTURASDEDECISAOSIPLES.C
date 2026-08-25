from datetime import date
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP

from sqlalchemy import func

from app.extensions import db
from app.models import Cartao, Categoria, Conta, Movimentacao, Parcela
from app.models.usuario import agora
from app.utils.formatters import dia_seguro, somar_meses


def competencia_da_compra(cartao: Cartao, data_compra: date) -> date:
    base = date(data_compra.year, data_compra.month, 1)
    if data_compra.day <= cartao.dia_fechamento:
        return base
    return somar_meses(base, 1)


def vencimento_fatura(cartao: Cartao, competencia: date) -> date:
    if cartao.dia_vencimento >= cartao.dia_fechamento:
        return dia_seguro(competencia.year, competencia.month, cartao.dia_vencimento)
    proximo = somar_meses(competencia, 1)
    return dia_seguro(proximo.year, proximo.month, cartao.dia_vencimento)


def fechamento_fatura(cartao: Cartao, competencia: date) -> date:
    """Último dia da competência em que a compra ainda entra nesta fatura."""
    return dia_seguro(competencia.year, competencia.month, cartao.dia_fechamento)


def dividir_parcelas(total: Decimal, quantidade: int) -> list[Decimal]:
    quantidade = max(1, int(quantidade))
    total = Decimal(total).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    base = (total / quantidade).quantize(Decimal("0.01"), rounding=ROUND_DOWN)
    valores = [base] * quantidade
    valores[-1] = (total - base * (quantidade - 1)).quantize(Decimal("0.01"))
    return valores


def query_cartoes(usuario_id: int):
    return Cartao.query.filter_by(usuario_id=usuario_id, ativo=True).order_by(Cartao.nome)


def limite_usado(cartao: Cartao) -> Decimal:
    valor = (
        db.session.query(func.coalesce(func.sum(Parcela.valor_parcela), 0))
        .filter(Parcela.cartao_id == cartao.id, Parcela.ativo.is_(True), Parcela.pago.is_(False))
        .scalar()
    )
    return Decimal(str(valor))


def parcelas_competencia(cartao: Cartao, competencia: date):
    inicio = date(competencia.year, competencia.month, 1)
    fim = somar_meses(inicio, 1)
    return (
        Parcela.query.filter(
            Parcela.cartao_id == cartao.id,
            Parcela.ativo.is_(True),
            Parcela.competencia >= inicio,
            Parcela.competencia < fim,
        )
        .order_by(Parcela.descricao, Parcela.numero)
        .all()
    )


def total_fatura(parcelas: list[Parcela], somente_abertas: bool = False) -> Decimal:
    itens = [p for p in parcelas if (not somente_abertas) or (not p.pago)]
    return sum((p.valor_parcela for p in itens), Decimal("0.00"))


def criar_compra(
    cartao: Cartao,
    descricao: str,
    valor: Decimal,
    data_compra: date,
    quantidade: int,
    categoria_id: int | None,
) -> list[Parcela]:
    if quantidade < 1 or quantidade > 48:
        raise ValueError("Informe de 1 a 48 parcelas.")
    if valor <= 0:
        raise ValueError("Informe um valor maior que zero.")
    descricao = (descricao or "").strip()
    if not descricao:
        raise ValueError("Informe a descrição da compra.")

    primeira = competencia_da_compra(cartao, data_compra)
    valores = dividir_parcelas(valor, quantidade)
    criadas = []
    for indice, valor_parcela in enumerate(valores, start=1):
        parcela = Parcela(
            cartao_id=cartao.id,
            categoria_id=categoria_id,
            descricao=descricao[:180],
            valor_total=valor,
            valor_parcela=valor_parcela,
            numero=indice,
            total_parcelas=quantidade,
            competencia=somar_meses(primeira, indice - 1),
            pago=False,
            ativo=True,
        )
        db.session.add(parcela)
        criadas.append(parcela)
    db.session.flush()
    return criadas


def pagar_fatura(
    cartao: Cartao,
    competencia: date,
    conta: Conta,
    data_pagamento: date,
    usuario_id: int,
) -> Movimentacao:
    parcelas = [p for p in parcelas_competencia(cartao, competencia) if not p.pago]
    if not parcelas:
        raise ValueError("Não há parcelas em aberto nesta fatura.")
    total = total_fatura(parcelas)
    categoria = Categoria.query.filter_by(nome="Cartão", ativo=True).first()
    mes_nome = f"{competencia.month:02d}/{competencia.year}"
    mov = Movimentacao(
        usuario_id=usuario_id,
        conta_id=conta.id,
        categoria_id=categoria.id if categoria else None,
        tipo="despesa",
        descricao=f"Fatura {cartao.nome} {mes_nome}",
        valor=total,
        data=data_pagamento,
        forma_pagamento="debito",
        observacao=f"fatura_cartao:{cartao.id}:{competencia.isoformat()}",
        criado_por=usuario_id,
        ativo=True,
    )
    db.session.add(mov)
    db.session.flush()
    for parcela in parcelas:
        parcela.pago = True
        parcela.movimentacao_id = mov.id
    cartao.atualizado_em = agora()
    db.session.flush()
    return mov


def _garantir_parcela_editavel(parcela: Parcela) -> None:
    if not parcela.ativo:
        raise ValueError("Esta parcela já foi removida.")
    if parcela.pago:
        raise ValueError("Parcela já paga. Não é possível editar ou excluir.")


def irmaos_compra(parcela: Parcela) -> list[Parcela]:
    """Outras parcelas da mesma compra (mesma descrição/total/quantidade no cartão)."""
    return (
        Parcela.query.filter(
            Parcela.cartao_id == parcela.cartao_id,
            Parcela.ativo.is_(True),
            Parcela.descricao == parcela.descricao,
            Parcela.valor_total == parcela.valor_total,
            Parcela.total_parcelas == parcela.total_parcelas,
        )
        .order_by(Parcela.numero)
        .all()
    )


def editar_parcela(
    parcela: Parcela,
    descricao: str,
    valor_parcela: Decimal,
    categoria_id: int | None,
) -> Parcela:
    _garantir_parcela_editavel(parcela)
    descricao = (descricao or "").strip()
    if not descricao:
        raise ValueError("Informe a descrição.")
    if valor_parcela <= 0:
        raise ValueError("Informe um valor maior que zero.")

    descricao = descricao[:180]
    valor_parcela = Decimal(valor_parcela).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    antiga_descricao = parcela.descricao
    antigo_total = parcela.valor_total
    total_parcelas = parcela.total_parcelas

    parcela.descricao = descricao
    parcela.valor_parcela = valor_parcela
    parcela.categoria_id = categoria_id

    # Mantém descrição/categoria alinhadas nas outras parcelas em aberto da mesma compra
    if total_parcelas > 1:
        for irma in (
            Parcela.query.filter(
                Parcela.cartao_id == parcela.cartao_id,
                Parcela.ativo.is_(True),
                Parcela.pago.is_(False),
                Parcela.descricao == antiga_descricao,
                Parcela.valor_total == antigo_total,
                Parcela.total_parcelas == total_parcelas,
            ).all()
        ):
            if irma.id == parcela.id:
                continue
            irma.descricao = descricao
            irma.categoria_id = categoria_id

    parcela.cartao.atualizado_em = agora()
    db.session.flush()
    return parcela


def excluir_parcela(parcela: Parcela, excluir_compra_inteira: bool = False) -> int:
    _garantir_parcela_editavel(parcela)
    alvos = [parcela]
    if excluir_compra_inteira and parcela.total_parcelas > 1:
        alvos = [p for p in irmaos_compra(parcela) if not p.pago] or [parcela]
    removidas = 0
    for alvo in alvos:
        if alvo.pago or not alvo.ativo:
            continue
        alvo.ativo = False
        removidas += 1
    parcela.cartao.atualizado_em = agora()
    db.session.flush()
    return removidas
