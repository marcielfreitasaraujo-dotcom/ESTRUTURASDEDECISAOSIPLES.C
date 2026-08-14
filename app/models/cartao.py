from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


class Cartao(db.Model):
    """Arquitetura preparada para cartão de crédito (Fase 3)."""

    __tablename__ = "cartoes"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = db.Column(db.String(80), nullable=False)
    limite = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    dia_fechamento = db.Column(db.Integer, nullable=False, default=1)
    dia_vencimento = db.Column(db.Integer, nullable=False, default=10)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    parcelas = db.relationship("Parcela", back_populates="cartao", lazy="dynamic")


class Parcela(db.Model):
    __tablename__ = "parcelas"

    id = db.Column(db.Integer, primary_key=True)
    cartao_id = db.Column(db.Integer, db.ForeignKey("cartoes.id"), nullable=False, index=True)
    movimentacao_id = db.Column(db.Integer, db.ForeignKey("movimentacoes.id"), nullable=True)
    descricao = db.Column(db.String(180), nullable=False)
    valor_total = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    valor_parcela = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    numero = db.Column(db.Integer, nullable=False, default=1)
    total_parcelas = db.Column(db.Integer, nullable=False, default=1)
    competencia = db.Column(db.Date, nullable=False)
    pago = db.Column(db.Boolean, nullable=False, default=False)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)

    cartao = db.relationship("Cartao", back_populates="parcelas")
