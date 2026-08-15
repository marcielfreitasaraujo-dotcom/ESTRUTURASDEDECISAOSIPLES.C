from pathlib import Path

import pytest

from app.extensions import db
from app.models import Comprovante, Conta, Movimentacao, Usuario
from app.services.backup import criar_backup, _uri_sem_senha
from app.storage import eh_caminho_legado
from config import ProductionConfig, normalizar_database_url, opcoes_engine


def test_saude_publico(client):
    resp = client.get("/api/saude")
    assert resp.status_code == 200
    dados = resp.get_json()
    assert dados["ok"] is True
    assert dados["app"] == "fincasa"


def test_normaliza_postgres_heroku():
    url = normalizar_database_url("postgres://u:p@host:5432/db")
    assert url.startswith("postgresql+psycopg://")
    assert "u:p@host:5432/db" in url


def test_engine_sqlite_mantem_check_same_thread():
    opcoes = opcoes_engine("sqlite:///tmp.db")
    assert "check_same_thread" in opcoes["connect_args"]


def test_engine_postgres_sem_check_same_thread():
    opcoes = opcoes_engine("postgresql+psycopg://u:p@localhost/db")
    assert "connect_args" not in opcoes
    assert opcoes["pool_pre_ping"] is True


def test_producao_exige_secret_key(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        ProductionConfig.init_app(None)


def test_backup_nao_apaga_origem(admin_client, app):
    with app.app_context():
        pasta = criar_backup()
        assert pasta.is_dir()
        uri = app.config["SQLALCHEMY_DATABASE_URI"]
        origem = Path(uri.replace("sqlite:///", "", 1))
        assert origem.is_file()
        assert (pasta / origem.name).is_file()


def test_caminho_legado_detecta_absoluto():
    assert eh_caminho_legado("/tmp/arquivo.pdf") is True
    assert eh_caminho_legado("1/abc.pdf") is False
    assert eh_caminho_legado(r"C:\Projetos\nota.pdf") is True


def test_uri_backup_nao_expõe_senha():
    assert "***@" in _uri_sem_senha("postgresql+psycopg://user:segredo@host:5432/db")
    assert "segredo" not in _uri_sem_senha("postgresql+psycopg://user:segredo@host:5432/db")
    assert _uri_sem_senha("sqlite:///instance/financeiro.db") == "sqlite:///instance/financeiro.db"


def test_comprovante_grava_chave_relativa(admin_client, app):
    from datetime import date
    from io import BytesIO

    png = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
        "0000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
    )
    with app.app_context():
        conta_id = Conta.query.filter_by(nome="Carteira").first().id
        usuario_id = Usuario.query.filter_by(username="admin").first().id

    admin_client.post(
        "/movimentacoes/nova",
        data={
            "tipo": "despesa",
            "valor": "12,00",
            "descricao": "Nota relativa",
            "conta_id": str(conta_id),
            "data": date.today().isoformat(),
            "forma_pagamento": "dinheiro",
            "comprovante": (BytesIO(png), "nota.png"),
        },
        follow_redirects=True,
    )
    with app.app_context():
        mov = Movimentacao.query.filter_by(descricao="Nota relativa").first()
        assert mov.comprovante is not None
        chave = mov.comprovante.caminho
        assert not eh_caminho_legado(chave)
        assert chave.startswith(f"{usuario_id}/")
        assert chave.endswith(".png")


def test_usuario_nao_acessa_comprovante_alheio(app, client):
    from datetime import date
    from decimal import Decimal

    with app.app_context():
        ana = Usuario(nome="Ana", username="ana2", perfil="usuario", ativo=True)
        ana.definir_senha("senha123")
        beta = Usuario(nome="Beta", username="beta2", perfil="usuario", ativo=True)
        beta.definir_senha("senha123")
        db.session.add_all([ana, beta])
        db.session.flush()
        conta = Conta(usuario_id=ana.id, nome="Carteira Ana2", tipo="carteira", saldo_inicial=0)
        db.session.add(conta)
        db.session.flush()
        mov = Movimentacao(
            usuario_id=ana.id,
            conta_id=conta.id,
            tipo="despesa",
            descricao="Com nota privada",
            valor=Decimal("20.00"),
            data=date.today(),
            forma_pagamento="dinheiro",
            criado_por=ana.id,
        )
        db.session.add(mov)
        db.session.flush()
        comp = Comprovante(
            movimentacao_id=mov.id,
            usuario_id=ana.id,
            nome_original="nota.png",
            nome_interno="abc.png",
            mime_type="image/png",
            tamanho=10,
            caminho=f"{ana.id}/abc.png",
        )
        db.session.add(comp)
        db.session.commit()
        comp_id = comp.id

    client.post("/login", data={"username": "beta2", "senha": "senha123"})
    assert client.get(f"/comprovantes/{comp_id}").status_code == 403
