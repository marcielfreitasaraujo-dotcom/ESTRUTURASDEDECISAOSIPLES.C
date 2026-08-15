from flask import abort
from flask_login import current_user


def pode_acessar_usuario(usuario_id: int) -> bool:
    if not current_user.is_authenticated:
        return False
    if current_user.id == usuario_id:
        return True
    from flask import current_app

    return bool(current_user.eh_admin and current_app.config.get("ADMIN_ACESSA_TUDO", True))


def exigir_dono(usuario_id: int) -> None:
    if not current_user.is_authenticated:
        abort(403)
    if current_user.id == usuario_id:
        return
    from flask import current_app

    if current_user.eh_admin and current_app.config.get("ADMIN_ACESSA_TUDO", True):
        return
    abort(403)


def filtro_usuario(query, campo):
    from flask import current_app

    if current_user.eh_admin and current_app.config.get("ADMIN_ACESSA_TUDO", True):
        return query
    return query.filter(campo == current_user.id)
