from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Usuario
from app.utils.assinatura import (
    bloqueio_assinatura_ativo,
    definir_bloqueio_assinatura,
    usuario_tem_acesso,
)
from app.utils.decorators import admin_obrigatorio

assinatura_bp = Blueprint("assinatura", __name__)


@assinatura_bp.route("/assinatura/bloqueado")
@login_required
def bloqueado():
    if usuario_tem_acesso(current_user) or not bloqueio_assinatura_ativo():
        return redirect(url_for("dashboard.index"))
    return render_template("assinatura/bloqueado.html")


@assinatura_bp.route("/assinatura")
@login_required
@admin_obrigatorio
def index():
    membros = Usuario.query.order_by(Usuario.perfil.desc(), Usuario.nome).all()
    return render_template(
        "assinatura/index.html",
        membros=membros,
        bloqueio_ativo=bloqueio_assinatura_ativo(),
    )


@assinatura_bp.route("/assinatura/bloqueio", methods=["POST"])
@login_required
@admin_obrigatorio
def alternar_bloqueio():
    ativo = (request.form.get("ativo") or "") in {"1", "true", "on", "sim"}
    definir_bloqueio_assinatura(ativo)
    db.session.commit()
    if ativo:
        flash("Bloqueio por assinatura ligado. Quem não for família e não tiver pago fica sem acesso.", "sucesso")
    else:
        flash("Bloqueio desligado. Todos os usuários ativos entram normalmente (emergência).", "info")
    return redirect(url_for("assinatura.index"))


@assinatura_bp.route("/assinatura/<int:usuario_id>/familia", methods=["POST"])
@login_required
@admin_obrigatorio
def alternar_familia(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    if membro.eh_admin:
        flash("O administrador não precisa ser marcado como família.", "info")
        return redirect(url_for("assinatura.index"))
    membro.eh_familia = not bool(membro.eh_familia)
    db.session.commit()
    if membro.eh_familia:
        flash(f"{membro.nome} marcado como família (não precisa pagar).", "sucesso")
    else:
        flash(f"{membro.nome} saiu da família. Precisa ter assinatura ativa para acessar.", "sucesso")
    return redirect(url_for("assinatura.index"))


@assinatura_bp.route("/assinatura/<int:usuario_id>/pagamento", methods=["POST"])
@login_required
@admin_obrigatorio
def alternar_pagamento(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    if membro.eh_admin:
        flash("O administrador sempre tem acesso.", "info")
        return redirect(url_for("assinatura.index"))
    membro.assinatura_ativa = not bool(membro.assinatura_ativa)
    db.session.commit()
    if membro.assinatura_ativa:
        flash(f"Assinatura de {membro.nome} marcada como paga.", "sucesso")
    else:
        flash(f"Assinatura de {membro.nome} marcada como em aberto.", "sucesso")
    return redirect(url_for("assinatura.index"))
