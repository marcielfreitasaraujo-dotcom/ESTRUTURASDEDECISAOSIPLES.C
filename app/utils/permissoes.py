from flask import abort
from flask_login import current_user

from app.utils.casa import id_casa


def pode_acessar_usuario(usuario_id: int) -> bool:
    if not current_user.is_authenticated:
        return False
    if current_user.id == usuario_id:
        return True
    if getattr(current_user, "ver_familia", False) and usuario_id == id_casa():
        return True
    from flask import current_app

    return bool(current_user.eh_admin and current_app.config.get("ADMIN_ACESSA_TUDO", True))


def exigir_dono(usuario_id: int) -> None:
    if not pode_acessar_usuario(usuario_id):
        abort(403)


def filtro_usuario(query, campo):
    from flask import current_app

    if current_user.eh_admin and current_app.config.get("ADMIN_ACESSA_TUDO", True):
        return query
    if getattr(current_user, "ver_familia", False):
        return query.filter(campo == id_casa())
    return query.filter(campo == current_user.id)
