from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


class ContaPagar(db.Model):
    """Estrutura pronta para a Fase 2 (vencimentos)."""

    __tablename__ = "contas_pagar"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    conta_id = db.Column(db.Integer, db.ForeignKey("contas.id"), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=True)
    descricao = db.Column(db.String(180), nullable=False)
    valor = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    valor_pago = db.Column(db.Numeric(14, 2), nullable=True)
    vencimento = db.Column(db.Date, nullable=False, index=True)
    data_pagamento = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pendente")
    pago_por = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    comprovante_id = db.Column(db.Integer, db.ForeignKey("comprovantes.id"), nullable=True)
    recorrencia_id = db.Column(db.Integer, db.ForeignKey("recorrencias.id"), nullable=True)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)


class Recorrencia(db.Model):
    """Despesas recorrentes — geração automática na Fase 2."""

    __tablename__ = "recorrencias"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    conta_id = db.Column(db.Integer, db.ForeignKey("contas.id"), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=True)
    descricao = db.Column(db.String(180), nullable=False)
    valor = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    periodicidade = db.Column(db.String(20), nullable=False, default="mensal")
    dia_vencimento = db.Column(db.Integer, nullable=False, default=1)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    proxima_geracao = db.Column(db.Date, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)
