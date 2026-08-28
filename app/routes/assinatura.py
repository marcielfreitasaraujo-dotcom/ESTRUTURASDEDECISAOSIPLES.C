from datetime import date

from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Usuario
from app.utils.assinatura import (
    bloquear_assinatura,
    bloqueio_assinatura_ativo,
    definir_bloqueio_assinatura,
    liberar_assinatura,
    montar_cobranca_pix,
    obter_plano_assinatura,
    resumo_financeiro_assinatura,
    salvar_plano_assinatura,
    sincronizar_vencimentos,
    status_assinatura_usuario,
    usuario_tem_acesso,
)
from app.utils.decorators import admin_obrigatorio
assinatura_bp = Blueprint("assinatura", __name__)


@assinatura_bp.route("/assinatura/bloqueado")
@login_required
def bloqueado():
    if usuario_tem_acesso(current_user) or not bloqueio_assinatura_ativo():
        return redirect(url_for("dashboard.index"))
    plano = obter_plano_assinatura()
    pix = None
    try:
        pix = montar_cobranca_pix(current_user)
    except Exception:
        pix = None
    return render_template(
        "assinatura/bloqueado.html",
        plano=plano,
        status=status_assinatura_usuario(current_user),
        pix=pix,
    )


@assinatura_bp.route("/assinatura/confirmar-pagamento", methods=["POST"])
@login_required
def confirmar_pagamento():
    """Usuário informa que pagou o PIX: libera o ciclo na hora."""
    if current_user.eh_admin or current_user.eh_familia:
        return redirect(url_for("dashboard.index"))
    if not bloqueio_assinatura_ativo():
        return redirect(url_for("dashboard.index"))
    if usuario_tem_acesso(current_user):
        return redirect(url_for("dashboard.index"))
    plano = obter_plano_assinatura()
    if not plano.get("pix_configurado"):
        flash("PIX ainda não configurado. Peça ao administrador para cadastrar a chave.", "erro")
        return redirect(url_for("assinatura.bloqueado"))
    liberar_assinatura(current_user)
    db.session.commit()
    flash(
        f"Pagamento confirmado! Acesso liberado até "
        f"{current_user.assinatura_vence_em.strftime('%d/%m/%Y')}.",
        "sucesso",
    )
    return redirect(url_for("dashboard.index"))


@assinatura_bp.route("/assinatura")
@login_required
@admin_obrigatorio
def index():
    sincronizar_vencimentos()
    db.session.commit()
    membros = Usuario.query.order_by(Usuario.perfil.desc(), Usuario.nome).all()
    resumo = resumo_financeiro_assinatura(membros)
    return render_template(
        "assinatura/index.html",
        membros=membros,
        bloqueio_ativo=bloqueio_assinatura_ativo(),
        resumo=resumo,
        plano=resumo["plano"],
        status_de=status_assinatura_usuario,
        hoje=date.today(),
    )


@assinatura_bp.route("/assinatura/plano", methods=["POST"])
@login_required
@admin_obrigatorio
def salvar_plano():
    try:
        salvar_plano_assinatura(
            nome=request.form.get("plano_nome") or "",
            valor=request.form.get("plano_valor"),
            dias=request.form.get("plano_dias") or 30,
            instrucoes=request.form.get("plano_instrucoes") or "",
            pix_chave=request.form.get("pix_chave"),
            pix_nome=request.form.get("pix_nome"),
            pix_cidade=request.form.get("pix_cidade"),
        )
        db.session.commit()
        flash("Valores, PIX e instruções da assinatura atualizados.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("assinatura.index"))


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
    if membro.eh_familia:
        membro.assinatura_ativa = True
        membro.assinatura_vence_em = None
        flash(f"{membro.nome} marcado como família (não precisa pagar).", "sucesso")
    else:
        flash(f"{membro.nome} saiu da família. Precisa ter assinatura ativa para acessar.", "sucesso")
    db.session.commit()
    return redirect(url_for("assinatura.index"))


@assinatura_bp.route("/assinatura/<int:usuario_id>/pagamento", methods=["POST"])
@login_required
@admin_obrigatorio
def alternar_pagamento(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    if membro.eh_admin:
        flash("O administrador sempre tem acesso.", "info")
        return redirect(url_for("assinatura.index"))
    if membro.eh_familia:
        flash("Membro da família é isento — não precisa marcar pagamento.", "info")
        return redirect(url_for("assinatura.index"))

    acao = (request.form.get("acao") or "").strip()
    if acao == "bloquear" or (not acao and membro.assinatura_ativa and not membro.assinatura_vencida):
        bloquear_assinatura(membro)
        db.session.commit()
        flash(f"Assinatura de {membro.nome} bloqueada (falta de pagamento).", "sucesso")
        return redirect(url_for("assinatura.index"))

    vence_raw = (request.form.get("vence_em") or "").strip()
    vence_em = None
    if vence_raw:
        try:
            vence_em = date.fromisoformat(vence_raw)
        except ValueError:
            flash("Data de vencimento inválida.", "erro")
            return redirect(url_for("assinatura.index"))
    liberar_assinatura(membro, vence_em=vence_em)
    db.session.commit()
    flash(
        f"Assinatura de {membro.nome} liberada até {membro.assinatura_vence_em.strftime('%d/%m/%Y')}.",
        "sucesso",
    )
    return redirect(url_for("assinatura.index"))


@assinatura_bp.route("/assinatura/<int:usuario_id>/remover", methods=["POST"])
@login_required
@admin_obrigatorio
def remover_usuario(usuario_id):
    from app.services.usuarios import remover_usuario_completo

    membro = db.get_or_404(Usuario, usuario_id)
    if membro.id == current_user.id:
        flash("Você não pode remover a própria conta enquanto estiver logado.", "erro")
        return redirect(url_for("assinatura.index"))
    if membro.eh_admin:
        flash("Não é permitido remover administrador por aqui.", "erro")
        return redirect(url_for("assinatura.index"))

    confirmacao = (request.form.get("confirmacao") or "").strip().lower()
    if confirmacao != (membro.username or "").strip().lower():
        flash(
            f"Remoção cancelada. Digite exatamente o usuário “{membro.username}” para confirmar.",
            "erro",
        )
        return redirect(url_for("assinatura.index"))

    try:
        rotulo = remover_usuario_completo(membro)
        db.session.commit()
        flash(f"Usuário {rotulo} removido permanentemente.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    except Exception:
        db.session.rollback()
        flash("Não foi possível remover o usuário. Tente novamente.", "erro")
    return redirect(url_for("assinatura.index"))


@assinatura_bp.route("/assinatura/<int:usuario_id>/confirmar-email", methods=["POST"])
@login_required
@admin_obrigatorio
def confirmar_email(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    if membro.eh_admin:
        flash("Admin não precisa confirmar e-mail.", "info")
        return redirect(url_for("assinatura.index"))
    membro.email_verificado = True
    membro.email_codigo_hash = None
    membro.email_codigo_expira = None
    db.session.commit()
    flash(f"E-mail de {membro.nome} confirmado manualmente.", "sucesso")
    return redirect(url_for("assinatura.index"))
