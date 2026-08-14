from decimal import Decimal

from app.extensions import db
from app.models.usuario import agora


class Orcamento(db.Model):
    """Limites por categoria — Fase 3."""

    __tablename__ = "orcamentos"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    limite = db.Column(db.Numeric(14, 2), nullable=False, default=Decimal("0.00"))
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    __table_args__ = (
        db.UniqueConstraint("usuario_id", "categoria_id", "ano", "mes", name="uq_orcamento_periodo"),
    )


class Configuracao(db.Model):
    __tablename__ = "configuracoes"

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(80), unique=True, nullable=False)
    valor = db.Column(db.Text, nullable=True)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)


class Auditoria(db.Model):
    """Trilha de quem criou, editou ou excluiu registros."""

    __tablename__ = "auditoria"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True, index=True)
    acao = db.Column(db.String(40), nullable=False)
    entidade = db.Column(db.String(40), nullable=False)
    entidade_id = db.Column(db.Integer, nullable=True)
    detalhes = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora, index=True)


class Notificacao(db.Model):
    __tablename__ = "notificacoes"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    titulo = db.Column(db.String(180), nullable=False)
    mensagem = db.Column(db.Text, nullable=True)
    tipo = db.Column(db.String(20), nullable=False, default="info")
    lida = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
