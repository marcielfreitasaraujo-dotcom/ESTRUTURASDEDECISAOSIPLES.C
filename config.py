from datetime import timedelta
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

_DEV_SECRET = "fincasa-dev-altere-em-producao"


def _bool_env(nome: str, padrao: bool = False) -> bool:
    valor = os.environ.get(nome)
    if valor is None:
        return padrao
    return valor.strip().lower() in {"1", "true", "sim", "yes", "on"}


def normalizar_database_url(url: str) -> str:
    if not url:
        return url
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def opcoes_engine(url: str) -> dict:
    if (url or "").startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True}


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", _DEV_SECRET)
    DEBUG = _bool_env("DEBUG", False)
    TESTING = False

    SQLALCHEMY_DATABASE_URI = normalizar_database_url(
        os.environ.get(
            "DATABASE_URL",
            f"sqlite:///{BASE_DIR / 'instance' / 'financeiro.db'}",
        )
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = opcoes_engine(
        os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'financeiro.db'}")
    )

    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    UPLOAD_FOLDER = Path(os.environ.get("UPLOAD_FOLDER", BASE_DIR / "uploads" / "comprovantes"))
    BACKUP_FOLDER = Path(os.environ.get("BACKUP_FOLDER", BASE_DIR / "backups"))
    STORAGE_BACKEND = os.environ.get("STORAGE_BACKEND", "local")
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 8 * 1024 * 1024))
    ALLOWED_RECEIPT_EXTENSIONS = {"jpg", "jpeg", "png", "pdf", "webp"}
    ALLOWED_RECEIPT_MIMES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
    }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = _bool_env("SESSION_COOKIE_SECURE", False)
    SESSION_PERMANENT = False
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = _bool_env("SESSION_COOKIE_SECURE", False)
    REMEMBER_COOKIE_DURATION = timedelta(0)
    REMEMBER_COOKIE_NAME = "remember_token"
    PREFERRED_URL_SCHEME = os.environ.get("PREFERRED_URL_SCHEME", "http")
    SERVER_URL = os.environ.get("SERVER_URL", "http://127.0.0.1:5000")

    ADMIN_INICIAL_USUARIO = os.environ.get("ADMIN_USUARIO", "admin")
    ADMIN_INICIAL_SENHA = os.environ.get("ADMIN_SENHA", "admin123")
    ADMIN_INICIAL_NOME = os.environ.get("ADMIN_NOME", "Marciel")
    # Dados financeiros sempre por usuário; admin não vê lançamentos alheios
    ADMIN_ACESSA_TUDO = _bool_env("ADMIN_ACESSA_TUDO", False)

    @staticmethod
    def init_app(app) -> None:
        return


class DevelopmentConfig(Config):
    DEBUG = _bool_env("DEBUG", True)


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = "https"
    ADMIN_INICIAL_SENHA = os.environ.get("ADMIN_SENHA")

    @staticmethod
    def init_app(app) -> None:
        chave = os.environ.get("SECRET_KEY", "")
        if not chave or chave == _DEV_SECRET:
            raise RuntimeError(
                "Em produção, defina a variável de ambiente SECRET_KEY com um valor secreto."
            )


class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "teste"


def get_config():
    nome = (os.environ.get("FLASK_ENV") or os.environ.get("FINCASA_ENV") or "development").lower()
    if nome in {"prod", "production"}:
        return ProductionConfig
    if nome in {"test", "testing"}:
        return TestingConfig
    return DevelopmentConfig
