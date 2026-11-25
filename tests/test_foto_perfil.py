import io

from PIL import Image
from sqlalchemy import text

from app import create_app
from app.extensions import db
from app.models import FotoPerfil, Usuario


def imagem(fmt="JPEG", tam=(600, 400), modo="RGB", **kw):
    cor = (200, 30, 30) if modo == "RGB" else (200, 30, 30, 120)
    buf = io.BytesIO()
    Image.new(modo, tam, cor).save(buf, fmt, **kw)
    buf.seek(0)
    return buf


def enviar(c, arq, nome="eu.jpg"):
    return c.post(
        "/configuracoes/foto",
        data={"foto": (arq, nome)},
        content_type="multipart/form-data",
        follow_redirects=True,
    )


def test_sem_foto_mostra_inicial(admin_client):
    html = admin_client.get("/configuracoes").get_data(as_text=True)
    assert "foto/imagem" not in html
    assert "Salvar foto" in html
    assert admin_client.get("/configuracoes/foto/imagem").status_code == 404


def test_enviar_trocar_e_remover(app, admin_client):
    for fmt, modo in (("JPEG", "RGB"), ("PNG", "RGBA"), ("WEBP", "RGB")):
        resp = enviar(admin_client, imagem(fmt, modo=modo))
        assert "Foto de perfil atualizada" in resp.get_data(as_text=True)
    resp = admin_client.get("/configuracoes/foto/imagem")
    assert resp.status_code == 200 and resp.mimetype == "image/jpeg"
    assert "private" in resp.headers["Cache-Control"]
    assert Image.open(io.BytesIO(resp.data)).size == (256, 256)
    cond = admin_client.get(
        "/configuracoes/foto/imagem", headers={"If-None-Match": resp.headers["ETag"]}
    )
    assert cond.status_code == 304
    assert "foto/imagem" in admin_client.get("/").get_data(as_text=True)
    with app.app_context():
        assert FotoPerfil.query.count() == 1
    admin_client.post("/configuracoes/foto/remover")
    assert "foto/imagem" not in admin_client.get("/").get_data(as_text=True)


def test_metadados_sao_removidos(admin_client):
    exif = Image.Exif()
    exif[0x010F] = "MarcaDoCelular"
    enviar(admin_client, imagem(exif=exif))
    dados = admin_client.get("/configuracoes/foto/imagem").data
    assert b"MarcaDoCelular" not in dados
    assert not Image.open(io.BytesIO(dados)).getexif()


def test_arquivos_invalidos_mantem_a_foto_atual(admin_client):
    enviar(admin_client, imagem())
    antes = admin_client.get("/configuracoes/foto/imagem").data
    cortada = io.BytesIO(imagem(tam=(800, 800)).getvalue()[:400])
    svg = io.BytesIO(b"<svg onload='alert(1)'/>")
    gigante = imagem("PNG", tam=(6000, 5000))
    invalidos = (io.BytesIO(b"nada"), io.BytesIO(b""), cortada, svg, imagem("GIF"), gigante)
    for arq in invalidos:
        assert "Foto de perfil atualizada" not in enviar(admin_client, arq).get_data(as_text=True)
    assert admin_client.get("/configuracoes/foto/imagem").data == antes


def test_exige_login(client):
    for resp in (
        client.get("/configuracoes/foto/imagem"),
        client.post("/configuracoes/foto"),
        client.post("/configuracoes/foto/remover"),
    ):
        assert resp.status_code == 302 and "/login" in resp.headers["Location"]


def test_cada_usuario_so_ve_a_propria(app, admin_client):
    enviar(admin_client, imagem())
    with app.app_context():
        ana = Usuario(nome="Ana", username="ana_foto", perfil="usuario", ativo=True, eh_familia=True)
        ana.definir_senha("segredo1")
        db.session.add(ana)
        db.session.commit()
    outro = app.test_client()
    resp = outro.post("/login", data={"username": "ana_foto", "senha": "segredo1"})
    outro.get(resp.headers["Location"])
    assert outro.get("/configuracoes").status_code == 200
    assert outro.get("/configuracoes/foto/imagem").status_code == 404
    outro.post("/configuracoes/foto/remover")
    assert admin_client.get("/configuracoes/foto/imagem").status_code == 200


def test_falha_na_tabela_nao_derruba_o_sistema(app, admin_client):
    with app.app_context():
        db.session.execute(text("DROP TABLE fotos_perfil"))
        db.session.commit()
    for rota in ("/", "/configuracoes", "/vencimentos", "/relatorios"):
        assert admin_client.get(rota, follow_redirects=True).status_code == 200
    resp = enviar(admin_client, imagem())
    assert "Não foi possível salvar" in resp.get_data(as_text=True)


def test_banco_antigo_ganha_a_tabela_sem_mudar_usuarios(app):
    from tests.conftest import TestConfig

    def colunas():
        return [c[1] for c in db.session.execute(text("PRAGMA table_info(usuarios)"))]

    with app.app_context():
        antes = colunas()
        usuarios = Usuario.query.count()
        db.session.execute(text("DROP TABLE fotos_perfil"))
        db.session.commit()
    TestConfig.SQLALCHEMY_DATABASE_URI = app.config["SQLALCHEMY_DATABASE_URI"]
    novo = create_app(TestConfig)
    with novo.app_context():
        assert FotoPerfil.query.count() == 0
        assert Usuario.query.count() == usuarios
        assert colunas() == antes
