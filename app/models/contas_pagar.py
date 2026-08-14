from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


TIPOS_TITULO = (
    ("pagar", "Conta a pagar"),
    ("receber", "Conta a receber"),
)

STATUS_TITULO = (
    ("pendente", "Pendente"),
    ("vence_hoje", "Vence hoje"),
    ("atrasado", "Atrasado"),
    ("pago", "Pago"),
    ("recebido", "Recebido"),
)


class ContaPagar(db.Model):
    """Títulos a pagar (contas) e a receber (empréstimos e valores a receber)."""

    __tablename__ = "contas_pagar"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    conta_id = db.Column(db.Integer, db.ForeignKey("contas.id"), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=True)
    movimentacao_id = db.Column(db.Integer, db.ForeignKey("movimentacoes.id"), nullable=True)
    tipo = db.Column(db.String(20), nullable=False, default="pagar", index=True)
    descricao = db.Column(db.String(180), nullable=False)
    pessoa = db.Column(db.String(120), nullable=True)
    observacao = db.Column(db.Text, nullable=True)
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

    conta = db.relationship("Conta", foreign_keys=[conta_id])
    categoria = db.relationship("Categoria", foreign_keys=[categoria_id])
    movimentacao = db.relationship("Movimentacao", foreign_keys=[movimentacao_id])

    @property
    def eh_pagar(self) -> bool:
        return self.tipo != "receber"

    @property
    def quitado(self) -> bool:
        return self.data_pagamento is not None or self.status in ("pago", "recebido")

    def status_atual(self, hoje: date | None = None) -> str:
        hoje = hoje or date.today()
        if self.quitado:
            return "pago" if self.eh_pagar else "recebido"
        if self.vencimento < hoje:
            return "atrasado"
        if self.vencimento == hoje:
            return "vence_hoje"
        return "pendente"

    @property
    def status_label(self) -> str:
        return dict(STATUS_TITULO).get(self.status_atual(), self.status_atual())

    @property
    def dias_atraso(self) -> int:
        if self.quitado:
            return 0
        delta = (date.today() - self.vencimento).days
        return max(delta, 0)

    @property
    def tipo_label(self) -> str:
        return dict(TIPOS_TITULO).get(self.tipo, self.tipo)


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
