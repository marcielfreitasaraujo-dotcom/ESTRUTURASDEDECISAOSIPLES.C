from datetime import date, datetime, timezone

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def agora():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Usuario(UserMixin, db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(190), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(256), nullable=False)
    perfil = db.Column(db.String(20), nullable=False, default="usuario")
    tema = db.Column(db.String(10), nullable=False, default="claro")
    ver_familia = db.Column(db.Boolean, nullable=False, default=False)
    eh_familia = db.Column(db.Boolean, nullable=False, default=False)
    assinatura_ativa = db.Column(db.Boolean, nullable=False, default=True)
    assinatura_vence_em = db.Column(db.Date, nullable=True)
    email_verificado = db.Column(db.Boolean, nullable=False, default=True)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    contas = db.relationship("Conta", back_populates="usuario", lazy="dynamic")
    movimentacoes = db.relationship("Movimentacao", back_populates="usuario", foreign_keys="Movimentacao.usuario_id", lazy="dynamic")

    def definir_senha(self, senha: str) -> None:
        self.senha_hash = generate_password_hash(senha)

    def verificar_senha(self, senha: str) -> bool:
        return check_password_hash(self.senha_hash, senha)

    @property
    def eh_admin(self) -> bool:
        return self.perfil == "admin"

    @property
    def eh_email(self) -> bool:
        u = (self.username or "").strip()
        return "@" in u and "." in u.split("@")[-1]

    @property
    def tem_acesso_assinatura(self) -> bool:
        if self.eh_admin:
            return True
        if self.eh_familia:
            return True
        if not bool(self.assinatura_ativa):
            return False
        if self.assinatura_vence_em and self.assinatura_vence_em < date.today():
            return False
        return True

    @property
    def assinatura_vencida(self) -> bool:
        if self.eh_admin or self.eh_familia:
            return False
        if not self.assinatura_vence_em:
            return False
        return self.assinatura_vence_em < date.today()

    def get_id(self) -> str:
        return str(self.id)
