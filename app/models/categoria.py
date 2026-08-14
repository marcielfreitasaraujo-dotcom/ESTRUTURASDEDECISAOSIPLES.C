from app.extensions import db
from app.models.usuario import agora


TIPOS_CATEGORIA = (
    ("receita", "Receita"),
    ("despesa", "Despesa"),
    ("investimento", "Investimento"),
)


class Categoria(db.Model):
    __tablename__ = "categorias"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True, index=True)
    nome = db.Column(db.String(80), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    icone = db.Column(db.String(40), nullable=True)
    cor = db.Column(db.String(16), nullable=True)
    eh_investimento = db.Column(db.Boolean, nullable=False, default=False)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    sistema = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    usuario = db.relationship("Usuario")
    movimentacoes = db.relationship("Movimentacao", back_populates="categoria", lazy="dynamic")
