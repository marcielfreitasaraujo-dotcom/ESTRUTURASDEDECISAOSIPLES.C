from datetime import date, timedelta
from decimal import Decimal

from app.extensions import db
from app.models import Configuracao, Usuario
from app.utils.formatters import parse_moeda

CHAVE_BLOQUEIO = "assinatura_bloqueio_ativo"
CHAVE_VALOR = "assinatura_valor"
CHAVE_PLANO = "assinatura_plano_nome"
CHAVE_DIAS = "assinatura_dias_ciclo"
CHAVE_INSTRUCOES = "assinatura_instrucoes_pagamento"
CHAVE_PIX_CHAVE = "assinatura_pix_chave"
CHAVE_PIX_NOME = "assinatura_pix_nome"
CHAVE_PIX_CIDADE = "assinatura_pix_cidade"

VALOR_PADRAO = "29.90"
PLANO_PADRAO = "Mensal"
DIAS_PADRAO = 30
INSTRUCOES_PADRAO = (
    "Pague via PIX (QR Code ou copia e cola) nesta tela e toque em "
    "“Já paguei” para liberar o acesso na hora."
)
PIX_NOME_PADRAO = "FINUP"
PIX_CIDADE_PADRAO = "SAO PAULO"


def _cfg(chave: str) -> Configuracao | None:
    try:
        return Configuracao.query.filter_by(chave=chave).first()
    except Exception:
        return None


def _definir_cfg(chave: str, valor: str) -> None:
    cfg = Configuracao.query.filter_by(chave=chave).first()
    if cfg:
        cfg.valor = valor
    else:
        db.session.add(Configuracao(chave=chave, valor=valor))
    db.session.flush()


def bloqueio_assinatura_ativo() -> bool:
    """Kill-switch: se valor != '1', ninguém é bloqueado (site continua liberado)."""
    cfg = _cfg(CHAVE_BLOQUEIO)
    if cfg is None:
        return True
    return (cfg.valor or "").strip() == "1"


def definir_bloqueio_assinatura(ativo: bool) -> None:
    _definir_cfg(CHAVE_BLOQUEIO, "1" if ativo else "0")


def obter_plano_assinatura() -> dict:
    cfg_valor = _cfg(CHAVE_VALOR)
    cfg_plano = _cfg(CHAVE_PLANO)
    cfg_dias = _cfg(CHAVE_DIAS)
    cfg_inst = _cfg(CHAVE_INSTRUCOES)
    cfg_pix = _cfg(CHAVE_PIX_CHAVE)
    cfg_pix_nome = _cfg(CHAVE_PIX_NOME)
    cfg_pix_cidade = _cfg(CHAVE_PIX_CIDADE)
    valor_txt = ((cfg_valor.valor if cfg_valor else None) or VALOR_PADRAO).strip()
    plano = ((cfg_plano.valor if cfg_plano else None) or PLANO_PADRAO).strip()
    dias_txt = ((cfg_dias.valor if cfg_dias else None) or str(DIAS_PADRAO)).strip()
    instrucoes = ((cfg_inst.valor if cfg_inst else None) or INSTRUCOES_PADRAO).strip()
    pix_chave = ((cfg_pix.valor if cfg_pix else None) or "").strip()
    pix_nome = ((cfg_pix_nome.valor if cfg_pix_nome else None) or PIX_NOME_PADRAO).strip()
    pix_cidade = ((cfg_pix_cidade.valor if cfg_pix_cidade else None) or PIX_CIDADE_PADRAO).strip()
    try:
        dias = max(1, int(dias_txt))
    except (TypeError, ValueError):
        dias = DIAS_PADRAO
    valor = parse_moeda(valor_txt)
    if valor <= 0:
        valor = parse_moeda(VALOR_PADRAO)
    return {
        "nome": plano[:80] or PLANO_PADRAO,
        "valor": valor,
        "dias": dias,
        "instrucoes": instrucoes[:2000] or INSTRUCOES_PADRAO,
        "pix_chave": pix_chave[:120],
        "pix_nome": (pix_nome[:60] or PIX_NOME_PADRAO),
        "pix_cidade": (pix_cidade[:40] or PIX_CIDADE_PADRAO),
        "pix_configurado": bool(pix_chave),
    }


def salvar_plano_assinatura(
    *,
    nome: str,
    valor,
    dias: int,
    instrucoes: str,
    pix_chave: str | None = None,
    pix_nome: str | None = None,
    pix_cidade: str | None = None,
) -> dict:
    plano = (nome or "").strip()[:80] or PLANO_PADRAO
    valor_dec = parse_moeda(valor)
    if valor_dec <= 0:
        raise ValueError("Informe um valor de assinatura maior que zero.")
    try:
        ciclo = max(1, int(dias))
    except (TypeError, ValueError) as exc:
        raise ValueError("Informe a quantidade de dias do ciclo.") from exc
    texto = (instrucoes or "").strip()[:2000] or INSTRUCOES_PADRAO
    _definir_cfg(CHAVE_PLANO, plano)
    _definir_cfg(CHAVE_VALOR, f"{valor_dec:.2f}")
    _definir_cfg(CHAVE_DIAS, str(ciclo))
    _definir_cfg(CHAVE_INSTRUCOES, texto)
    if pix_chave is not None:
        _definir_cfg(CHAVE_PIX_CHAVE, (pix_chave or "").strip()[:120])
    if pix_nome is not None:
        _definir_cfg(CHAVE_PIX_NOME, ((pix_nome or "").strip()[:60] or PIX_NOME_PADRAO))
    if pix_cidade is not None:
        _definir_cfg(CHAVE_PIX_CIDADE, ((pix_cidade or "").strip()[:40] or PIX_CIDADE_PADRAO))
    return obter_plano_assinatura()


def montar_cobranca_pix(usuario: Usuario | None = None) -> dict | None:
    """Gera copia-e-cola + QR do plano atual. None se a chave PIX não estiver configurada."""
    from app.services.pix import (
        gerar_payload_pix,
        montar_txid,
        payload_para_qr_data_uri,
    )

    plano = obter_plano_assinatura()
    if not plano.get("pix_chave"):
        return None
    uid = getattr(usuario, "id", None) if usuario is not None else None
    txid = montar_txid(uid)
    payload = gerar_payload_pix(
        chave=plano["pix_chave"],
        nome_recebedor=plano["pix_nome"],
        cidade=plano["pix_cidade"],
        valor=plano["valor"],
        txid=txid,
        descricao=f"FinUP {plano['nome']}",
    )
    return {
        "payload": payload,
        "txid": txid,
        "qr_data_uri": payload_para_qr_data_uri(payload),
        "valor": plano["valor"],
        "chave": plano["pix_chave"],
    }

def sincronizar_vencimentos(hoje: date | None = None) -> int:
    """Desativa assinaturas com vencimento passado. Retorna quantas foram bloqueadas."""
    hoje = hoje or date.today()
    vencidos = (
        Usuario.query.filter(
            Usuario.perfil != "admin",
            Usuario.eh_familia.is_(False),
            Usuario.assinatura_ativa.is_(True),
            Usuario.assinatura_vence_em.isnot(None),
            Usuario.assinatura_vence_em < hoje,
        ).all()
    )
    for membro in vencidos:
        membro.assinatura_ativa = False
    if vencidos:
        db.session.flush()
    return len(vencidos)


def liberar_assinatura(
    membro: Usuario,
    *,
    vence_em: date | None = None,
    dias: int | None = None,
) -> None:
    plano = obter_plano_assinatura()
    ciclo = dias if dias is not None else plano["dias"]
    membro.assinatura_ativa = True
    membro.assinatura_vence_em = vence_em or (date.today() + timedelta(days=max(1, int(ciclo))))


def bloquear_assinatura(membro: Usuario) -> None:
    membro.assinatura_ativa = False


def status_assinatura_usuario(membro: Usuario) -> str:
    if membro.eh_admin:
        return "admin"
    if membro.eh_familia:
        return "familia"
    if membro.assinatura_ativa and not membro.assinatura_vencida:
        return "ativa"
    if membro.assinatura_vence_em and membro.assinatura_vence_em < date.today():
        return "vencida"
    return "bloqueada"


def resumo_financeiro_assinatura(membros: list[Usuario] | None = None) -> dict:
    sincronizar_vencimentos()
    lista = membros if membros is not None else Usuario.query.order_by(Usuario.nome).all()
    ativos = 0
    bloqueados = 0
    familia = 0
    vencendo_7 = 0
    hoje = date.today()
    limite = hoje + timedelta(days=7)
    for m in lista:
        if not m.ativo:
            continue
        st = status_assinatura_usuario(m)
        if st == "familia":
            familia += 1
        elif st == "ativa":
            ativos += 1
            if m.assinatura_vence_em and hoje <= m.assinatura_vence_em <= limite:
                vencendo_7 += 1
        elif st in {"bloqueada", "vencida"}:
            bloqueados += 1
    plano = obter_plano_assinatura()
    receita_prevista = (plano["valor"] * Decimal(ativos)).quantize(Decimal("0.01"))
    return {
        "ativos": ativos,
        "bloqueados": bloqueados,
        "familia": familia,
        "vencendo_7": vencendo_7,
        "total_ativos_conta": sum(1 for m in lista if m.ativo),
        "receita_prevista": receita_prevista,
        "plano": plano,
    }


def usuario_tem_acesso(usuario: Usuario | None) -> bool:
    if usuario is None or not getattr(usuario, "is_authenticated", False):
        return False
    if not getattr(usuario, "ativo", True):
        return False
    if getattr(usuario, "eh_admin", False):
        return True
    if bool(getattr(usuario, "eh_familia", False)):
        return True
    if not bool(getattr(usuario, "assinatura_ativa", True)):
        return False
    vence = getattr(usuario, "assinatura_vence_em", None)
    if vence and vence < date.today():
        return False
    return True


def endpoints_livres_assinatura() -> set[str]:
    return {
        "static",
        "saude",
        "web_manifest",
        "service_worker",
        "auth.login",
        "auth.cadastro",
        "auth.logout",
        "auth.sessao_iniciar",
        "auth.sessao_verificar",
        "auth.sessao_fechar",
        "auth.verificar_email",
        "auth.aguardando_verificacao",
        "auth.esqueci_senha",
        "auth.redefinir_senha",
        "assinatura.bloqueado",
        "assinatura.confirmar_pagamento",
    }
