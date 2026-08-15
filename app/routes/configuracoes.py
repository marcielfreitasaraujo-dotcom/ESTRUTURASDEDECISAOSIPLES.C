from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models import Usuario
from app.services.backup import criar_backup
from app.services.seed import criar_membro_familia, inserir_dados_demo, zerar_dados_financeiros
from app.utils.decorators import admin_obrigatorio

configuracoes_bp = Blueprint("configuracoes", __name__)


@configuracoes_bp.route("/configuracoes")
@login_required
def index():
    membros = []
    if current_user.eh_admin:
        membros = Usuario.query.order_by(Usuario.perfil.desc(), Usuario.nome).all()
    return render_template("configuracoes/index.html", membros=membros)


@configuracoes_bp.route("/configuracoes/perfil", methods=["POST"])
@login_required
def perfil():
    nome = (request.form.get("nome") or "").strip()
    if not nome:
        flash("Informe seu nome.", "erro")
        return redirect(url_for("configuracoes.index"))
    current_user.nome = nome[:120]
    db.session.commit()
    flash("Perfil atualizado.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/senha", methods=["POST"])
@login_required
def senha():
    atual = request.form.get("senha_atual") or ""
    nova = request.form.get("senha_nova") or ""
    confirma = request.form.get("senha_confirma") or ""
    if not current_user.verificar_senha(atual):
        flash("Senha atual incorreta.", "erro")
        return redirect(url_for("configuracoes.index"))
    if len(nova) < 6:
        flash("A nova senha deve ter pelo menos 6 caracteres.", "erro")
        return redirect(url_for("configuracoes.index"))
    if nova != confirma:
        flash("A confirmação não confere.", "erro")
        return redirect(url_for("configuracoes.index"))
    current_user.definir_senha(nova)
    db.session.commit()
    flash("Senha alterada.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/tema", methods=["POST"])
@login_required
def tema():
    escolhido = request.form.get("tema")
    if escolhido not in ("claro", "escuro"):
        escolhido = "claro"
    current_user.tema = escolhido
    db.session.commit()
    flash("Tema atualizado.", "sucesso")
    return redirect(request.form.get("next") or url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/demo", methods=["POST"])
@login_required
def demo():
    if not current_user.eh_admin:
        flash("Apenas o administrador pode carregar dados de demonstração.", "erro")
        return redirect(url_for("configuracoes.index"))
    ok = inserir_dados_demo(current_user)
    if ok:
        flash("Dados de demonstração inseridos. Confira o dashboard.", "sucesso")
    else:
        flash("Os dados de demonstração já haviam sido carregados.", "info")
    return redirect(url_for("dashboard.index"))


@configuracoes_bp.route("/configuracoes/backup", methods=["POST"])
@login_required
@admin_obrigatorio
def backup():
    pasta = criar_backup()
    flash(f"Backup criado em {pasta}. O banco atual não foi apagado.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/familia", methods=["POST"])
@login_required
@admin_obrigatorio
def familia_nova():
    try:
        membro = criar_membro_familia(
            nome=request.form.get("nome") or "",
            username=request.form.get("username") or "",
            senha=request.form.get("senha") or "",
            perfil=request.form.get("perfil") or "usuario",
            ver_familia=request.form.get("ver_familia") == "1",
        )
        db.session.commit()
        flash(f"Conta de {membro.nome} criada. Já pode entrar com o usuário {membro.username}.", "sucesso")
    except ValueError as exc:
        db.session.rollback()
        flash(str(exc), "erro")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/familia/<int:usuario_id>/senha", methods=["POST"])
@login_required
@admin_obrigatorio
def familia_senha(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    nova = request.form.get("senha_nova") or ""
    if len(nova) < 6:
        flash("A senha deve ter pelo menos 6 caracteres.", "erro")
        return redirect(url_for("configuracoes.index"))
    membro.definir_senha(nova)
    db.session.commit()
    flash(f"Senha de {membro.nome} atualizada.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/familia/<int:usuario_id>/ativo", methods=["POST"])
@login_required
@admin_obrigatorio
def familia_ativo(usuario_id):
    membro = db.get_or_404(Usuario, usuario_id)
    if membro.id == current_user.id:
        flash("Você não pode desativar a própria conta.", "erro")
        return redirect(url_for("configuracoes.index"))
    if membro.eh_admin and membro.ativo:
        outros = Usuario.query.filter(
            Usuario.perfil == "admin",
            Usuario.ativo.is_(True),
            Usuario.id != membro.id,
        ).count()
        if outros == 0:
            flash("Precisa ficar pelo menos um administrador ativo.", "erro")
            return redirect(url_for("configuracoes.index"))
    membro.ativo = not membro.ativo
    db.session.commit()
    estado = "ativada" if membro.ativo else "desativada"
    flash(f"Conta de {membro.nome} {estado}.", "sucesso")
    return redirect(url_for("configuracoes.index"))


@configuracoes_bp.route("/configuracoes/zerar", methods=["POST"])
@login_required
@admin_obrigatorio
def zerar():
    if (request.form.get("confirmacao") or "").strip().upper() != "ZERAR":
        flash("Para começar do zero, digite ZERAR no campo de confirmação.", "erro")
        return redirect(url_for("configuracoes.index"))
    zerar_dados_financeiros()
    db.session.commit()
    flash("Tudo zerado. Contas em R$ 0,00, sem lançamentos. Os logins da família foram mantidos.", "sucesso")
    return redirect(url_for("dashboard.index"))
