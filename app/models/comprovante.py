from app.extensions import db
from app.models.usuario import agora


class Comprovante(db.Model):
    __tablename__ = "comprovantes"

    id = db.Column(db.Integer, primary_key=True)
    movimentacao_id = db.Column(
        db.Integer,
        db.ForeignKey("movimentacoes.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    nome_original = db.Column(db.String(255), nullable=False)
    nome_interno = db.Column(db.String(80), nullable=False, unique=True)
    mime_type = db.Column(db.String(80), nullable=False)
    tamanho = db.Column(db.Integer, nullable=False)
    caminho = db.Column(db.String(500), nullable=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)

    movimentacao = db.relationship("Movimentacao", back_populates="comprovante")
    usuario = db.relationship("Usuario")

    @property
    def eh_imagem(self) -> bool:
        return self.mime_type.startswith("image/")

    @property
    def eh_pdf(self) -> bool:
        return self.mime_type == "application/pdf"
