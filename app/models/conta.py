from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


TIPOS_CONTA = (
    ("carteira", "Carteira / Dinheiro"),
    ("banco", "Banco"),
    ("conta_digital", "Conta digital"),
    ("poupanca", "Poupança"),
    ("investimentos", "Investimentos"),
    ("outro", "Outro"),
)


class Conta(db.Model):
    __tablename__ = "contas"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    nome = db.Column(db.String(80), nullable=False)
    tipo = db.Column(db.String(30), nullable=False, default="banco")
    saldo_inicial = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    saldo_informado = db.Column(db.Numeric(14, 2), nullable=True)
    data_conferencia = db.Column(db.DateTime, nullable=True)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    usuario = db.relationship("Usuario", back_populates="contas")
    movimentacoes = db.relationship(
        "Movimentacao",
        back_populates="conta",
        foreign_keys="Movimentacao.conta_id",
        lazy="dynamic",
    )

    @property
    def eh_carteira(self) -> bool:
        return self.tipo == "carteira"

    @property
    def tipo_label(self) -> str:
        return dict(TIPOS_CONTA).get(self.tipo, self.tipo)
