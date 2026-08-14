import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "fincasa-dev-altere-em-producao")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'instance' / 'financeiro.db'}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"check_same_thread": False}}

    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    UPLOAD_FOLDER = BASE_DIR / "uploads" / "comprovantes"
    BACKUP_FOLDER = BASE_DIR / "backups"
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB
    ALLOWED_RECEIPT_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
    ALLOWED_RECEIPT_MIMES = {
        "image/jpeg",
        "image/png",
        "application/pdf",
    }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_HTTPONLY = True

    ADMIN_INICIAL_USUARIO = os.environ.get("ADMIN_USUARIO", "admin")
    ADMIN_INICIAL_SENHA = os.environ.get("ADMIN_SENHA", "admin123")
    ADMIN_INICIAL_NOME = os.environ.get("ADMIN_NOME", "Marciel")
