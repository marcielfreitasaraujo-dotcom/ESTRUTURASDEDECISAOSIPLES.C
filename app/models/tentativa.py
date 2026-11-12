from app.extensions import db
from app.models.usuario import agora


class TentativaAcesso(db.Model):
    """Tentativas que falharam (login, código de e-mail, recuperação de senha).

    Fica no banco para valer entre os workers do Gunicorn e entre deploys.
    """

    __tablename__ = "tentativas_acesso"

    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(200), nullable=False, index=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora, index=True)
