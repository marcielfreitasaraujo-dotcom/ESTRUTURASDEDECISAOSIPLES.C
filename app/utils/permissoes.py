from flask import abort
from flask_login import current_user


def pode_acessar_usuario(usuario_id: int) -> bool:
    if not current_user.is_authenticated:
        return False
    if current_user.eh_admin:
        return True
    return current_user.id == usuario_id


def exigir_dono(usuario_id: int) -> None:
    if current_user.eh_admin:
        return
    if current_user.id != usuario_id:
        abort(403)


def filtro_usuario(query, campo):
    if current_user.eh_admin:
        return query
    return query.filter(campo == current_user.id)
