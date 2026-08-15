import uuid
from pathlib import Path

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Comprovante, Movimentacao
from app.storage import eh_caminho_legado, get_storage, resolver_arquivo
from app.utils.security import MIME_POR_EXT, extensao_segura, validar_conteudo


class ComprovanteInvalido(ValueError):
    pass


def salvar_comprovante(movimentacao: Movimentacao, arquivo: FileStorage) -> Comprovante:
    if not arquivo or not arquivo.filename:
        raise ComprovanteInvalido("Nenhum arquivo enviado.")

    ext = extensao_segura(arquivo.filename)
    if not ext:
        raise ComprovanteInvalido("Formato não permitido. Use JPG, PNG, WEBP ou PDF.")

    nome_interno = f"{uuid.uuid4().hex}.{ext}"
    chave = f"{movimentacao.usuario_id}/{nome_interno}"
    storage = get_storage()
    destino = storage.salvar(chave, arquivo)

    if not validar_conteudo(destino, ext):
        storage.remover(chave)
        raise ComprovanteInvalido("O conteúdo do arquivo não corresponde à extensão.")

    tamanho = destino.stat().st_size
    if tamanho <= 0:
        storage.remover(chave)
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
        caminho=chave,
    )
    db.session.add(comprovante)
    db.session.flush()
    return comprovante


def remover_comprovante(movimentacao: Movimentacao) -> None:
    comprovante = movimentacao.comprovante
    if not comprovante:
        return
    chave = comprovante.caminho
    db.session.delete(comprovante)
    db.session.flush()
    if not chave:
        return
    if eh_caminho_legado(chave):
        Path(chave).unlink(missing_ok=True)
        return
    get_storage().remover(chave)


def arquivo_comprovante(comprovante: Comprovante) -> Path | None:
    return resolver_arquivo(comprovante.caminho)
