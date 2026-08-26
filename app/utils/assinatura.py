from app.extensions import db
from app.models import Configuracao, Usuario


CHAVE_BLOQUEIO = "assinatura_bloqueio_ativo"


def bloqueio_assinatura_ativo() -> bool:
    """Kill-switch: se valor != '1', ninguém é bloqueado (site continua liberado)."""
    try:
        cfg = Configuracao.query.filter_by(chave=CHAVE_BLOQUEIO).first()
    except Exception:
        return False
    if cfg is None:
        return True
    return (cfg.valor or "").strip() == "1"


def definir_bloqueio_assinatura(ativo: bool) -> None:
    cfg = Configuracao.query.filter_by(chave=CHAVE_BLOQUEIO).first()
    valor = "1" if ativo else "0"
    if cfg:
        cfg.valor = valor
    else:
        db.session.add(Configuracao(chave=CHAVE_BLOQUEIO, valor=valor))
    db.session.flush()


def usuario_tem_acesso(usuario: Usuario | None) -> bool:
    if usuario is None or not getattr(usuario, "is_authenticated", False):
        return False
    if not getattr(usuario, "ativo", True):
        return False
    if getattr(usuario, "eh_admin", False):
        return True
    if bool(getattr(usuario, "eh_familia", False)):
        return True
    if bool(getattr(usuario, "assinatura_ativa", True)):
        return True
    return False


def endpoints_livres_assinatura() -> set[str]:
    return {
        "static",
        "saude",
        "web_manifest",
        "service_worker",
        "auth.login",
        "auth.logout",
        "auth.sessao_iniciar",
        "auth.sessao_verificar",
        "auth.sessao_fechar",
        "assinatura.bloqueado",
    }
