from calendar import monthrange
from datetime import date

from app.extensions import db
from app.models import ContaPagar, Recorrencia
from app.models.usuario import agora


def vencimento_no_mes(ano: int, mes: int, dia: int) -> date:
    ultimo = monthrange(ano, mes)[1]
    return date(ano, mes, min(max(int(dia or 1), 1), ultimo))


def _proximo_mes(ano: int, mes: int) -> tuple[int, int]:
    if mes == 12:
        return ano + 1, 1
    return ano, mes + 1


def competencias_alvo(recorrencia: Recorrencia, hoje: date) -> list[date]:
    datas = []
    if recorrencia.periodicidade == "anual":
        mes = recorrencia.mes_vencimento or hoje.month
        atual = vencimento_no_mes(hoje.year, mes, recorrencia.dia_vencimento)
        datas.append(atual)
        if atual < hoje:
            datas.append(vencimento_no_mes(hoje.year + 1, mes, recorrencia.dia_vencimento))
        return datas

    ano, mes = hoje.year, hoje.month
    datas.append(vencimento_no_mes(ano, mes, recorrencia.dia_vencimento))
    ano2, mes2 = _proximo_mes(ano, mes)
    datas.append(vencimento_no_mes(ano2, mes2, recorrencia.dia_vencimento))
    return datas


def _ja_existe(recorrencia: Recorrencia, vencimento: date) -> bool:
    if ContaPagar.query.filter_by(
        recorrencia_id=recorrencia.id,
        vencimento=vencimento,
        ativo=True,
    ).first():
        return True
    return (
        ContaPagar.query.filter_by(
            usuario_id=recorrencia.usuario_id,
            descricao=recorrencia.descricao,
            vencimento=vencimento,
            ativo=True,
        ).first()
        is not None
    )


def _criar_titulo(recorrencia: Recorrencia, vencimento: date) -> ContaPagar:
    titulo = ContaPagar(
        usuario_id=recorrencia.usuario_id,
        conta_id=recorrencia.conta_id,
        categoria_id=recorrencia.categoria_id,
        recorrencia_id=recorrencia.id,
        tipo=recorrencia.tipo or "pagar",
        descricao=recorrencia.descricao,
        pessoa=recorrencia.pessoa,
        observacao=recorrencia.observacao,
        valor=recorrencia.valor,
        vencimento=vencimento,
        status="pendente",
        ativo=True,
    )
    titulo.status = titulo.status_atual()
    db.session.add(titulo)
    return titulo


def gerar_titulos_recorrentes(usuario_id: int, hoje: date | None = None) -> int:
    """Cria o título do mês atual e do próximo, sem duplicar se o app abrir de novo."""
    hoje = hoje or date.today()
    criados = 0
    recs = Recorrencia.query.filter_by(usuario_id=usuario_id, ativo=True).all()
    for rec in recs:
        for venc in competencias_alvo(rec, hoje):
            if _ja_existe(rec, venc):
                continue
            _criar_titulo(rec, venc)
            rec.proxima_geracao = venc
            rec.atualizado_em = agora()
            criados += 1
    return criados
