from flask_login import current_user


def id_casa() -> int:
    """Escopo dos dados financeiros: sempre o usuário logado (lançamentos individuais)."""
    if not current_user.is_authenticated:
        return 0
    return current_user.id
