import uuid
from pathlib import Path

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Comprovante, Movimentacao
from app.utils.security import MIME_POR_EXT, extensao_segura, validar_conteudo


class ComprovanteInvalido(ValueError):
    pass


def _pasta_usuario(usuario_id: int) -> Path:
    pasta = Path(current_app.config["UPLOAD_FOLDER"]) / str(usuario_id)
    pasta.mkdir(parents=True, exist_ok=True)
    return pasta


def salvar_comprovante(movimentacao: Movimentacao, arquivo: FileStorage) -> Comprovante:
    if not arquivo or not arquivo.filename:
        raise ComprovanteInvalido("Nenhum arquivo enviado.")

    ext = extensao_segura(arquivo.filename)
    if not ext:
        raise ComprovanteInvalido("Formato não permitido. Use JPG, PNG ou PDF.")

    nome_interno = f"{uuid.uuid4().hex}.{ext}"
    destino = _pasta_usuario(movimentacao.usuario_id) / nome_interno
    arquivo.save(destino)

    if not validar_conteudo(destino, ext):
        destino.unlink(missing_ok=True)
        raise ComprovanteInvalido("O conteúdo do arquivo não corresponde à extensão.")

    tamanho = destino.stat().st_size
    if tamanho <= 0:
        destino.unlink(missing_ok=True)
        raise ComprovanteInvalido("Arquivo vazio.")

    if movimentacao.comprovante:
        remover_comprovante(movimentacao)

    comprovante = Comprovante(
        movimentacao_id=movimentacao.id,
        usuario_id=movimentacao.usuario_id,
        nome_original=secure_filename(arquivo.filename)[:255] or f"comprovante.{ext}",
        nome_interno=nome_interno,
        mime_type=MIME_POR_EXT[ext],
        tamanho=tamanho,
        caminho=str(destino),
    )
    db.session.add(comprovante)
    db.session.flush()
    return comprovante


def remover_comprovante(movimentacao: Movimentacao) -> None:
    comprovante = movimentacao.comprovante
    if not comprovante:
        return
    caminho = Path(comprovante.caminho)
    db.session.delete(comprovante)
    db.session.flush()
    if caminho.exists():
        caminho.unlink(missing_ok=True)
