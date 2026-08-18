from flask_login import current_user


def id_casa() -> int:
    """Identificador do financeiro do usuário logado (cada um vê só o próprio)."""
    if not current_user.is_authenticated:
        return 0
    return current_user.id
