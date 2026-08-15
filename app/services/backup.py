import logging
import shutil
from datetime import datetime
from pathlib import Path

from flask import current_app

from config import BASE_DIR

logger = logging.getLogger("fincasa.backup")


def _uri_sem_senha(uri: str) -> str:
    if "@" in uri and "://" in uri:
        esquema, resto = uri.split("://", 1)
        if "@" in resto:
            _, host = resto.rsplit("@", 1)
            return f"{esquema}://***@{host}"
    return uri


def criar_backup() -> Path:
    """Copia o SQLite (se existir) e a pasta de comprovantes. Não apaga o original."""
    destino_raiz = Path(current_app.config["BACKUP_FOLDER"])
    destino_raiz.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.now().strftime("%Y%m%d-%H%M%S")
    pasta = destino_raiz / carimbo
    pasta.mkdir(parents=True, exist_ok=False)

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI") or ""
    if uri.startswith("sqlite:///"):
        origem_db = Path(uri.replace("sqlite:///", "", 1))
        if origem_db.is_file():
            shutil.copy2(origem_db, pasta / origem_db.name)
            logger.info("Backup do SQLite em %s", pasta / origem_db.name)
        else:
            (pasta / "AVISO-banco-nao-encontrado.txt").write_text(
                f"Arquivo não encontrado: {origem_db}\n", encoding="utf-8"
            )
    else:
        (pasta / "LEIA-ME-POSTGRES.txt").write_text(
            "Este ambiente usa PostgreSQL.\n"
            "Faça o dump no servidor com:\n"
            "  pg_dump \"$DATABASE_URL\" -F c -f financeiro.dump\n",
            encoding="utf-8",
        )

    uploads = Path(current_app.config["UPLOAD_FOLDER"])
    destino_uploads = pasta / "comprovantes"
    if uploads.is_dir():
        shutil.copytree(uploads, destino_uploads, dirs_exist_ok=True)

    (pasta / "origem.txt").write_text(
        f"base={BASE_DIR}\nuri={_uri_sem_senha(uri)}\ncriado={carimbo}\n",
        encoding="utf-8",
    )
    logger.info("Backup criado em %s", pasta)
    return pasta
