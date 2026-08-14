from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


TIPOS_MOVIMENTACAO = (
    ("receita", "Receita"),
    ("despesa", "Despesa"),
    ("transferencia", "Transferência"),
    ("investimento", "Investimento"),
)

FORMAS_PAGAMENTO = (
    ("dinheiro", "Dinheiro"),
    ("pix", "Pix"),
    ("debito", "Débito"),
    ("credito", "Crédito"),
    ("transferencia", "Transferência"),
    ("outro", "Outro"),
)


class Movimentacao(db.Model):
    __tablename__ = "movimentacoes"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    conta_id = db.Column(db.Integer, db.ForeignKey("contas.id"), nullable=False, index=True)
    conta_destino_id = db.Column(db.Integer, db.ForeignKey("contas.id"), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=True, index=True)
    tipo = db.Column(db.String(20), nullable=False, index=True)
    descricao = db.Column(db.String(180), nullable=False)
    valor = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    data = db.Column(db.Date, nullable=False, index=True)
    forma_pagamento = db.Column(db.String(30), nullable=False, default="dinheiro")
    observacao = db.Column(db.Text, nullable=True)
    ativo = db.Column(db.Boolean, nullable=False, default=True, index=True)
    criado_por = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    atualizado_por = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    excluido_por = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)
    excluido_em = db.Column(db.DateTime, nullable=True)

    usuario = db.relationship("Usuario", foreign_keys=[usuario_id], back_populates="movimentacoes")
    conta = db.relationship("Conta", foreign_keys=[conta_id], back_populates="movimentacoes")
    conta_destino = db.relationship("Conta", foreign_keys=[conta_destino_id])
    categoria = db.relationship("Categoria", back_populates="movimentacoes")
    comprovante = db.relationship(
        "Comprovante",
        back_populates="movimentacao",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def tipo_label(self) -> str:
        return dict(TIPOS_MOVIMENTACAO).get(self.tipo, self.tipo)

    @property
    def forma_label(self) -> str:
        return dict(FORMAS_PAGAMENTO).get(self.forma_pagamento, self.forma_pagamento)

    @property
    def tem_comprovante(self) -> bool:
        return self.comprovante is not None
