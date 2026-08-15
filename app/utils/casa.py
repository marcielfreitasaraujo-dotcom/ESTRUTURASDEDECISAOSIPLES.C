from flask_login import current_user


def id_casa() -> int:
    """Contas e lançamentos da casa (admin) quando o membro compartilha a família."""
    if not current_user.is_authenticated:
        return 0
    if current_user.eh_admin or getattr(current_user, "ver_familia", False):
        from app.models import Usuario

        dono = (
            Usuario.query.filter_by(perfil="admin", ativo=True)
            .order_by(Usuario.id.asc())
            .first()
        )
        return dono.id if dono else current_user.id
    return current_user.id
