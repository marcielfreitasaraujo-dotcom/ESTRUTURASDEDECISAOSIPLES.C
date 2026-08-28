from datetime import datetime
from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora

STATUS_PENDENTE = "pendente"
STATUS_PAGO = "pago"
STATUS_EXPIRADO = "expirado"
STATUS_CANCELADO = "cancelado"
STATUS_ERRO = "erro"

METODO_PIX = "pix"
METODO_CARTAO = "cartao"

PROVEDOR_MERCADOPAGO = "mercadopago"
PROVEDOR_MOCK = "mock"


class CobrancaAssinatura(db.Model):
    __tablename__ = "cobrancas_assinatura"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    provedor = db.Column(db.String(30), nullable=False, default=PROVEDOR_MERCADOPAGO)
    referencia_externa = db.Column(db.String(120), nullable=True, index=True)
    metodo = db.Column(db.String(20), nullable=False, default=METODO_PIX)
    valor = db.Column(db.Numeric(14, 2), nullable=False)
    parcelas = db.Column(db.Integer, nullable=False, default=1)
    status = db.Column(db.String(20), nullable=False, default=STATUS_PENDENTE, index=True)
    pix_payload = db.Column(db.Text, nullable=True)
    pix_qr_base64 = db.Column(db.Text, nullable=True)
    checkout_url = db.Column(db.String(500), nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    expira_em = db.Column(db.DateTime, nullable=True)
    pago_em = db.Column(db.DateTime, nullable=True)
    dados_json = db.Column(db.Text, nullable=True)

    usuario = db.relationship("Usuario", backref=db.backref("cobrancas_assinatura", lazy="dynamic"))

    @property
    def pendente(self) -> bool:
        return self.status == STATUS_PENDENTE

    @property
    def paga(self) -> bool:
        return self.status == STATUS_PAGO

    @property
    def valor_decimal(self) -> Decimal:
        return Decimal(str(self.valor or 0)).quantize(Decimal("0.01"))

    def marcar_paga(self) -> None:
        self.status = STATUS_PAGO
        self.pago_em = agora()

    def marcar_expirada(self) -> None:
        self.status = STATUS_EXPIRADO

    def marcar_cancelada(self) -> None:
        self.status = STATUS_CANCELADO

    def marcar_erro(self) -> None:
        self.status = STATUS_ERRO
