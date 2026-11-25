from app.extensions import db
from app.models.usuario import agora


class FotoPerfil(db.Model):
    """Foto do usuário, em tabela própria.

    Fica no banco (e não em disco) para não sumir a cada deploy, e fora de
    `usuarios` para não alterar a tabela usada no login.
    """

    __tablename__ = "fotos_perfil"

    usuario_id = db.Column(
        db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    # Muda a cada troca: entra no endereço da imagem para o navegador atualizar.
    versao = db.Column(db.String(32), nullable=False)
    dados = db.Column(db.LargeBinary, nullable=False)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)
