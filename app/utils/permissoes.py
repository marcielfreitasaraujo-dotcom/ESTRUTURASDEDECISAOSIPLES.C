from flask import abort
from flask_login import current_user


def pode_acessar_usuario(usuario_id: int) -> bool:
    if not current_user.is_authenticated:
        return False
    return current_user.id == usuario_id


def exigir_dono(usuario_id: int) -> None:
    if not pode_acessar_usuario(usuario_id):
        abort(403)


def filtro_usuario(query, campo):
    return query.filter(campo == current_user.id)
