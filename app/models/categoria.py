from app.extensions import db
from app.models.usuario import agora


TIPOS_CATEGORIA = (
    ("receita", "Receita"),
    ("despesa", "Despesa"),
    ("investimento", "Investimento"),
)


class Categoria(db.Model):
    __tablename__ = "categorias"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=True, index=True)
    nome = db.Column(db.String(80), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    icone = db.Column(db.String(40), nullable=True)
    cor = db.Column(db.String(16), nullable=True)
    eh_investimento = db.Column(db.Boolean, nullable=False, default=False)
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    sistema = db.Column(db.Boolean, nullable=False, default=False)
    criado_em = db.Column(db.DateTime, nullable=False, default=agora)
    atualizado_em = db.Column(db.DateTime, nullable=False, default=agora, onupdate=agora)

    usuario = db.relationship("Usuario")

    @property
    def eh_global(self) -> bool:
        """Padrão do sistema ou criada pelo admin: aparece para todos."""
        if self.sistema or self.usuario_id is None:
            return True
        return bool(self.usuario is not None and self.usuario.eh_admin)

    def pode_editar(self, usuario) -> bool:
        if usuario is None or not usuario.is_authenticated:
            return False
        if self.eh_global:
            return bool(usuario.eh_admin)
        return self.usuario_id == usuario.id

    @classmethod
    def visiveis(cls, usuario_id: int):
        """Categorias ativas que este usuário pode ver e usar."""
        from app.models.usuario import Usuario

        admins = db.session.query(Usuario.id).filter(Usuario.perfil == "admin")
        return cls.query.filter(
            cls.ativo.is_(True),
            db.or_(
                cls.sistema.is_(True),
                cls.usuario_id.is_(None),
                cls.usuario_id == usuario_id,
                cls.usuario_id.in_(admins),
            ),
        )

    @classmethod
    def id_permitido(cls, usuario_id: int, valor) -> int | None:
        """Converte o id vindo do formulário, aceitando só categorias visíveis."""
        try:
            cid = int(valor)
        except (TypeError, ValueError):
            return None
        existe = cls.visiveis(usuario_id).filter(cls.id == cid).first()
        return existe.id if existe else None
    movimentacoes = db.relationship("Movimentacao", back_populates="categoria", lazy="dynamic")
