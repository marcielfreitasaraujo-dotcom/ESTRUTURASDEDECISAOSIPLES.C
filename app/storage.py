from __future__ import annotations

from pathlib import Path
from typing import BinaryIO, Protocol

from flask import current_app
from werkzeug.datastructures import FileStorage


class Armazenamento(Protocol):
    def salvar(self, chave: str, arquivo: FileStorage) -> Path: ...

    def caminho(self, chave: str) -> Path: ...

    def existe(self, chave: str) -> bool: ...

    def remover(self, chave: str) -> None: ...

    def abrir(self, chave: str) -> BinaryIO: ...


class ArmazenamentoLocal:
    """Disco local. Trocar por nuvem no futuro sem mudar as rotas."""

    def __init__(self, raiz: Path):
        self.raiz = Path(raiz)
        self.raiz.mkdir(parents=True, exist_ok=True)

    def _destino(self, chave: str) -> Path:
        chave = chave.replace("\\", "/").lstrip("/")
        destino = (self.raiz / chave).resolve()
        if not str(destino).startswith(str(self.raiz.resolve())):
            raise ValueError("Chave de arquivo inválida.")
        destino.parent.mkdir(parents=True, exist_ok=True)
        return destino

    def salvar(self, chave: str, arquivo: FileStorage) -> Path:
        destino = self._destino(chave)
        arquivo.save(destino)
        return destino

    def caminho(self, chave: str) -> Path:
        return self._destino(chave)

    def existe(self, chave: str) -> bool:
        return self._destino(chave).is_file()

    def remover(self, chave: str) -> None:
        destino = self._destino(chave)
        if destino.is_file():
            destino.unlink(missing_ok=True)

    def abrir(self, chave: str) -> BinaryIO:
        return self._destino(chave).open("rb")


def get_storage() -> Armazenamento:
    backend = (current_app.config.get("STORAGE_BACKEND") or "local").lower()
    if backend != "local":
        # Futuro: s3, r2, etc. Mantém local até haver implementação.
        backend = "local"
    return ArmazenamentoLocal(Path(current_app.config["UPLOAD_FOLDER"]))


def eh_caminho_legado(valor: str) -> bool:
    if not valor:
        return False
    caminho = Path(valor)
    if caminho.is_absolute():
        return True
    return len(valor) > 2 and valor[1] == ":"


def resolver_arquivo(chave_ou_caminho: str) -> Path | None:
    if not chave_ou_caminho:
        return None
    if eh_caminho_legado(chave_ou_caminho):
        legado = Path(chave_ou_caminho)
        return legado if legado.is_file() else None
    storage = get_storage()
    if storage.existe(chave_ou_caminho):
        return storage.caminho(chave_ou_caminho)
    legado = Path(chave_ou_caminho)
    return legado if legado.is_file() else None
