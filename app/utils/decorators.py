from functools import wraps

from flask import abort, flash, redirect, url_for
from flask_login import current_user


def admin_obrigatorio(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.eh_admin:
            abort(403)
        return fn(*args, **kwargs)

    return wrapper


def usuario_ativo_obrigatorio(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if current_user.is_authenticated and not current_user.ativo:
            flash("Sua conta está desativada.", "erro")
            return redirect(url_for("auth.logout"))
        return fn(*args, **kwargs)

    return wrapper
