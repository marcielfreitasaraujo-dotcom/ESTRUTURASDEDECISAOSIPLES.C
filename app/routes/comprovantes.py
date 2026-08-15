from flask import Blueprint, abort, send_file
from flask_login import login_required

from app.extensions import db
from app.models import Comprovante
from app.services.comprovantes import arquivo_comprovante
from app.utils.permissoes import exigir_dono

comprovantes_bp = Blueprint("comprovantes", __name__)


@comprovantes_bp.route("/comprovantes/<int:comp_id>")
@login_required
def ver(comp_id):
    comprovante = db.get_or_404(Comprovante, comp_id)
    exigir_dono(comprovante.usuario_id)
    caminho = arquivo_comprovante(comprovante)
    if not caminho:
        abort(404)
    return send_file(
        caminho,
        mimetype=comprovante.mime_type,
        as_attachment=False,
        download_name=comprovante.nome_original,
    )
