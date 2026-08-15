from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import String, cast, or_

from app.models import Movimentacao
from app.utils.formatters import formatar_data, formatar_moeda
from app.utils.casa import id_casa

pesquisa_bp = Blueprint("pesquisa", __name__)


@pesquisa_bp.route("/api/pesquisa")
@login_required
def pesquisar():
    termo = (request.args.get("q") or "").strip()
    if len(termo) < 2:
        return jsonify({"itens": []})
    like = f"%{termo}%"
    q = Movimentacao.query.filter(
        Movimentacao.usuario_id == id_casa(),
        Movimentacao.ativo.is_(True),
        or_(
            Movimentacao.descricao.ilike(like),
            Movimentacao.observacao.ilike(like),
            cast(Movimentacao.valor, String).ilike(like.replace(",", ".")),
        ),
    ).order_by(Movimentacao.data.desc())
    itens = []
    for mov in q.limit(12).all():
        itens.append(
            {
                "id": mov.id,
                "descricao": mov.descricao,
                "valor": formatar_moeda(mov.valor),
                "data": formatar_data(mov.data),
                "tipo": mov.tipo,
                "url": f"/movimentacoes/{mov.id}",
            }
        )
    return jsonify({"itens": itens})
