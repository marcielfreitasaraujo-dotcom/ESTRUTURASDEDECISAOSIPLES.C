from app.extensions import db
from app.models import Categoria
from app.services.seed import criar_membro_familia


def _criar_usuario(app, nome, username):
    with app.app_context():
        u = criar_membro_familia(nome, username, "senha123", eh_familia=True)
        db.session.commit()
        return u.id


def _entrar(app, username):
    c = app.test_client()
    resp = c.post("/login", data={"username": username, "senha": "senha123"})
    c.get(resp.headers["Location"])
    return c


def test_usuario_cria_categoria_que_so_ele_ve(app):
    _criar_usuario(app, "Ana", "ana")
    _criar_usuario(app, "Bia", "bia")
    ana = _entrar(app, "ana")
    bia = _entrar(app, "bia")

    resp = ana.post("/categorias/nova", data={"nome": "Pet da Ana", "tipo": "despesa", "cor": "#123456"})
    assert resp.status_code == 302
    assert "Pet da Ana" in ana.get("/categorias").get_data(as_text=True)
    assert "Pet da Ana" in ana.get("/vencimentos").get_data(as_text=True)
    assert "Pet da Ana" not in bia.get("/categorias").get_data(as_text=True)
    assert "Pet da Ana" not in bia.get("/vencimentos").get_data(as_text=True)


def test_usuario_nao_edita_categoria_de_outro_nem_padrao(app):
    _criar_usuario(app, "Ana", "ana")
    _criar_usuario(app, "Bia", "bia")
    ana = _entrar(app, "ana")
    bia = _entrar(app, "bia")
    ana.post("/categorias/nova", data={"nome": "Academia", "tipo": "despesa"})
    with app.app_context():
        cid = Categoria.query.filter_by(nome="Academia").one().id
        padrao_id = Categoria.query.filter_by(sistema=True).first().id

    assert bia.post(f"/categorias/{cid}/excluir").status_code == 403
    assert bia.post(f"/categorias/{padrao_id}/editar", data={"nome": "X"}).status_code == 403
    assert ana.post(f"/categorias/{cid}/editar", data={"nome": "Academia+"}).status_code == 302
    with app.app_context():
        assert db.session.get(Categoria, cid).nome == "Academia+"


def test_categoria_do_admin_continua_para_todos(app, admin_client):
    admin_client.post("/categorias/nova", data={"nome": "Global Admin", "tipo": "despesa"})
    _criar_usuario(app, "Ana", "ana")
    ana = _entrar(app, "ana")
    assert "Global Admin" in ana.get("/categorias").get_data(as_text=True)


def test_id_de_categoria_alheia_e_ignorado(app):
    _criar_usuario(app, "Ana", "ana")
    _criar_usuario(app, "Bia", "bia")
    ana = _entrar(app, "ana")
    ana.post("/categorias/nova", data={"nome": "Secreta", "tipo": "despesa"})
    with app.app_context():
        cid = Categoria.query.filter_by(nome="Secreta").one().id
        bia_id = db.session.query(__import__("app.models", fromlist=["Usuario"]).Usuario.id).filter_by(username="bia").scalar()
        assert Categoria.id_permitido(bia_id, cid) is None
        assert Categoria.id_permitido(bia_id, "abc") is None
