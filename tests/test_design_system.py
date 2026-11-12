from app.extensions import db
from app.services.seed import criar_membro_familia


def test_vitrine_abre_para_admin(admin_client):
    resp = admin_client.get("/design-system")
    html = resp.get_data(as_text=True)
    assert resp.status_code == 200
    assert "FinUP Design System" in html
    assert "css/fx.css" in html
    assert "icons/lucide.svg" in html
    assert "Sistema AraujoIA" in html


def test_vitrine_fechada_para_usuario_comum(app):
    with app.app_context():
        criar_membro_familia("Ana", "ana", "senha123", eh_familia=True)
        db.session.commit()
    c = app.test_client()
    resp = c.post("/login", data={"username": "ana", "senha": "senha123"})
    c.get(resp.headers["Location"])
    assert c.get("/design-system").status_code == 403


def test_vitrine_exige_login(client):
    resp = client.get("/design-system")
    assert resp.status_code in (302, 401)


def test_sprite_lucide_tem_icones_do_menu(app):
    from pathlib import Path

    sprite = (Path(app.static_folder) / "icons" / "lucide.svg").read_text(encoding="utf-8")
    for nome in ("house", "trending-up", "trending-down", "arrow-left-right", "landmark",
                 "calendar-clock", "repeat", "tags", "credit-card", "target", "settings"):
        assert f'id="i-{nome}"' in sprite
