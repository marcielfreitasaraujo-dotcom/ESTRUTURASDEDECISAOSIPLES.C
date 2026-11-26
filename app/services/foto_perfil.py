"""Foto de perfil: valida, reduz e guarda. Nunca pode derrubar as telas."""

import io
import logging
import uuid

from PIL import Image, ImageOps
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import FotoPerfil

logger = logging.getLogger("finup.foto_perfil")

LADO = 256
MAX_PIXELS = 25_000_000
FORMATOS = ("JPEG", "PNG", "WEBP")
MSG_INVALIDA = "Não foi possível usar esta imagem. Envie uma foto em JPG, PNG ou WebP."
MSG_GRANDE = "Esta foto é grande demais. Escolha uma menor."


def preparar_imagem(arquivo) -> bytes:
    """Devolve um JPEG quadrado pequeno, sem metadados (local, aparelho etc.)."""
    try:
        with Image.open(arquivo.stream, formats=FORMATOS) as img:
            grande = img.width * img.height > MAX_PIXELS
            if not grande:
                img.draft("RGB", (LADO * 2, LADO * 2))
                final = ImageOps.exif_transpose(img).convert("RGBA")
                final = ImageOps.fit(final, (LADO, LADO), Image.Resampling.LANCZOS)
    except Exception as exc:  # arquivo corrompido gera erros variados no Pillow
        raise ValueError(MSG_INVALIDA) from exc
    if grande:
        raise ValueError(MSG_GRANDE)
    fundo = Image.new("RGB", final.size, (255, 255, 255))
    fundo.paste(final, mask=final.getchannel("A"))
    saida = io.BytesIO()
    fundo.save(saida, "JPEG", quality=85, optimize=True)
    return saida.getvalue()


def salvar_foto(usuario_id: int, arquivo) -> None:
    dados = preparar_imagem(arquivo)
    foto = db.session.get(FotoPerfil, usuario_id)
    if foto is None:
        foto = FotoPerfil(usuario_id=usuario_id)
        db.session.add(foto)
    foto.dados = dados
    foto.versao = uuid.uuid4().hex


def remover_foto(usuario_id: int) -> None:
    FotoPerfil.query.filter_by(usuario_id=usuario_id).delete()


def versao_foto(usuario_id: int) -> str | None:
    """Só a versão (sem carregar a imagem). Qualquer falha vira "sem foto"."""
    try:
        with db.session.begin_nested():
            return (
                db.session.query(FotoPerfil.versao)
                .filter(FotoPerfil.usuario_id == usuario_id)
                .scalar()
            )
    except SQLAlchemyError:
        logger.exception("Falha ao consultar foto de perfil")
        return None
