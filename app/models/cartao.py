from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


class Cartao(db.Model):
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
    usuario = db.relationship("Usuario")


class Parcela(db.Model):
    __tablename__ = "parcelas"

    id = db.Column(db.Integer, primary_key=True)
    cartao_id = db.Column(db.Integer, db.ForeignKey("cartoes.id"), nullable=False, index=True)
    movimentacao_id = db.Column(db.Integer, db.ForeignKey("movimentacoes.id"), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=True, index=True)
    descricao = db.Column(db.String(180), nullable=False)
    valor_total = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    valor_parcela = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    valor_pago = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    numero = db.Column(db.Integer, nullable=False, default=1)
    total_parcelas = db.Column(db.Integer, nullable=False, default=1)
    competencia = db.Column(db.Date, nullable=False, index=True)
    pago = db.Column(db.Boolean, nullable=False, default=False)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)

    cartao = db.relationship("Cartao", back_populates="parcelas")
    categoria = db.relationship("Categoria")
    movimentacao = db.relationship("Movimentacao")

    @property
    def rotulo_parcela(self) -> str:
        if self.total_parcelas <= 1:
            return self.descricao
        return f"{self.descricao} ({self.numero}/{self.total_parcelas})"

    @property
    def pago_acumulado(self) -> Decimal:
        return Decimal(str(self.valor_pago or 0)).quantize(Decimal("0.01"))

    @property
    def residual(self) -> Decimal:
        if self.pago:
            return Decimal("0.00")
        restante = Decimal(str(self.valor_parcela)) - self.pago_acumulado
        return restante if restante > 0 else Decimal("0.00")

    @property
    def pagamento_parcial(self) -> bool:
        return (not self.pago) and self.pago_acumulado > 0
