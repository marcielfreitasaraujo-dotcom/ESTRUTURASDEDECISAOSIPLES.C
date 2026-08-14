import pytest

from app import create_app
from app.extensions import db
from config import Config


class TestConfig(Config):
    TESTING = True
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "teste"


@pytest.fixture()
def app(tmp_path):
    db_path = tmp_path / "teste.db"
    TestConfig.SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    TestConfig.UPLOAD_FOLDER = tmp_path / "uploads"
    TestConfig.BACKUP_FOLDER = tmp_path / "backups"
    application = create_app(TestConfig)
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def admin_client(client):
    resp = client.post(
        "/login",
        data={"username": "admin", "senha": "admin123"},
        follow_redirects=True,
    )
    assert resp.status_code == 200
    return client
