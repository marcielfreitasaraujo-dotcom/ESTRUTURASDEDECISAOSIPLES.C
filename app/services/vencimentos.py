from datetime import date
from decimal import Decimal

from flask_login import current_user

from app.extensions import db
from app.models import Conta, ContaPagar, Movimentacao
from app.models.usuario import agora
from app.services.auditoria import registrar
from app.utils.formatters import parse_moeda


def status_efetivo(titulo: ContaPagar, hoje: date | None = None) -> str:
    return titulo.status_atual(hoje)


def sincronizar_status(usuario_id: int, hoje: date | None = None) -> None:
    hoje = hoje or date.today()
    titulos = ContaPagar.query.filter_by(usuario_id=usuario_id, ativo=True).all()
    for titulo in titulos:
        novo = titulo.status_atual(hoje)
        if titulo.status != novo:
            titulo.status = novo


def query_titulos(usuario_id: int, tipo: str | None = None):
    q = ContaPagar.query.filter_by(usuario_id=usuario_id, ativo=True)
    if tipo in ("pagar", "receber"):
        q = q.filter(ContaPagar.tipo == tipo)
    return q.order_by(ContaPagar.vencimento.asc(), ContaPagar.id.asc())


def filtrar_por_situacao(titulos: list[ContaPagar], situacao: str, hoje: date | None = None):
    hoje = hoje or date.today()
    if situacao == "atrasadas":
        return [t for t in titulos if t.status_atual(hoje) == "atrasado"]
    if situacao == "abertas":
        return [t for t in titulos if not t.quitado]
    if situacao == "quitadas":
        return [t for t in titulos if t.quitado]
    if situacao == "hoje":
        return [t for t in titulos if t.status_atual(hoje) == "vence_hoje"]
    return titulos


def totais(usuario_id: int, tipo: str, hoje: date | None = None) -> dict:
    hoje = hoje or date.today()
    titulos = query_titulos(usuario_id, tipo).all()
    abertas = [t for t in titulos if not t.quitado]
    atrasadas = [t for t in abertas if t.status_atual(hoje) == "atrasado"]
    vence_hoje = [t for t in abertas if t.status_atual(hoje) == "vence_hoje"]
    return {
        "abertas": sum((t.valor for t in abertas), Decimal("0.00")),
        "atrasadas": sum((t.valor for t in atrasadas), Decimal("0.00")),
        "qtd_atrasadas": len(atrasadas),
        "qtd_abertas": len(abertas),
        "qtd_hoje": len(vence_hoje),
        "qtd_total": len(titulos),
    }


def proximos(usuario_id: int, tipo: str = "pagar", limite: int = 6):
    abertas = [t for t in query_titulos(usuario_id, tipo).all() if not t.quitado]
    return abertas[:limite]


def qtd_atrasadas(usuario_id: int) -> int:
    hoje = date.today()
    return sum(
        1
        for t in ContaPagar.query.filter_by(usuario_id=usuario_id, ativo=True).all()
        if t.status_atual(hoje) == "atrasado"
    )


def quitar(
    titulo: ContaPagar,
    *,
    conta: Conta,
    valor,
    data_pagamento: date,
    forma_pagamento: str = "pix",
    lancar: bool = True,
) -> Movimentacao | None:
    valor = parse_moeda(valor)
    if valor <= 0:
        raise ValueError("Informe o valor quitado.")
    if titulo.quitado:
        raise ValueError("Este título já foi quitado.")

    titulo.valor_pago = valor
    titulo.data_pagamento = data_pagamento
    titulo.pago_por = current_user.id if current_user.is_authenticated else None
    titulo.conta_id = conta.id
    titulo.status = "pago" if titulo.eh_pagar else "recebido"
    titulo.atualizado_em = agora()

    mov = None
    if lancar:
        tipo_mov = "despesa" if titulo.eh_pagar else "receita"
        if titulo.categoria and titulo.categoria.eh_investimento and titulo.eh_pagar:
            tipo_mov = "investimento"
        descricao = titulo.descricao
        if titulo.pessoa:
            prefixo = "Empréstimo de" if not titulo.eh_pagar else "Pagamento"
            descricao = f"{titulo.descricao} ({prefixo} {titulo.pessoa})"
        mov = Movimentacao(
            usuario_id=titulo.usuario_id,
            conta_id=conta.id,
            categoria_id=titulo.categoria_id,
            tipo=tipo_mov,
            descricao=descricao[:180],
            valor=valor,
            data=data_pagamento,
            forma_pagamento=forma_pagamento,
            observacao=titulo.observacao,
            criado_por=titulo.pago_por,
            ativo=True,
        )
        db.session.add(mov)
        db.session.flush()
        titulo.movimentacao_id = mov.id

    registrar("quitar", "vencimento", titulo.id, titulo.descricao)
    return mov
