from datetime import date

from app.extensions import db
from app.models.usuario import agora

STATUS_PENDENTE = "pendente"
STATUS_APLICADO = "aplicado"
STATUS_CANCELADO = "cancelado"


class HotmartPedido(db.Model):
    __tablename__ = "hotmart_pedidos"

    id = db.Column(db.Integer, primary_key=True)
    transacao = db.Column(db.String(80), nullable=False, unique=True, index=True)
    email = db.Column(db.String(180), nullable=False, index=True)
    evento = db.Column(db.String(60), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=STATUS_PENDENTE, index=True)
    produto_id = db.Column(db.String(40), nullable=True)
    vence_em = db.Column(db.Date, nullable=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True, index=True)
    dados_json = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    usuario = db.relationship("Usuario", backref=db.backref("pedidos_hotmart", lazy="dynamic"))

    @property
    def pendente(self) -> bool:
        return self.status == STATUS_PENDENTE

    def marcar_aplicado(self, usuario_id: int, vence_em: date | None = None) -> None:
        self.status = STATUS_APLICADO
        self.usuario_id = usuario_id
        if vence_em is not None:
            self.vence_em = vence_em

    def marcar_cancelado(self) -> None:
        self.status = STATUS_CANCELADO
