import json


def test_manifest_publico(client):
    resp = client.get("/manifest.webmanifest")
    assert resp.status_code == 200
    assert "manifest" in (resp.mimetype or "")
    assert "no-cache" in (resp.headers.get("Cache-Control") or "")
    data = json.loads(resp.get_data(as_text=True))
    assert data["name"] == "FinUP"
    assert data["short_name"] == "FinUP"
    assert data["display"] == "standalone"
    assert data["start_url"] == "/login"
    sizes = {icon["sizes"] for icon in data["icons"]}
    assert "192x192" in sizes
    assert "512x512" in sizes


def test_service_worker_publico(client):
    resp = client.get("/sw.js")
    assert resp.status_code == 200
    assert "javascript" in (resp.mimetype or "")
    assert resp.headers.get("Service-Worker-Allowed") == "/"
    assert "no-cache" in (resp.headers.get("Cache-Control") or "")
    body = resp.get_data(as_text=True)
    assert "finup-static" in body
    assert "/static/" in body
    # Garantia: SW não menciona cache de API/HTML financeiro
    assert "/api/" not in body or "navigate" in body


def test_login_tem_manifest_e_register(client):
    html = client.get("/login").get_data(as_text=True)
    assert 'rel="manifest"' in html
    assert "pwa-register.js" in html
    assert 'name="theme-color"' in html


def test_app_autenticado_tem_manifest_e_register(admin_client):
    home = admin_client.get("/").get_data(as_text=True)
    assert 'rel="manifest"' in home
    assert "pwa-register.js" in home


def test_saude_e_login_intactos_com_pwa(client):
    saude = client.get("/api/saude")
    assert saude.status_code == 200
    assert saude.get_json()["ok"] is True
    assert client.get("/login").status_code == 200


def test_icones_pwa_existem(client):
    for path in (
        "/static/img/icon-192.png",
        "/static/img/icon-512.png",
        "/static/img/icon-192-maskable.png",
        "/static/img/icon-512-maskable.png",
    ):
        resp = client.get(path)
        assert resp.status_code == 200
        assert resp.data[:8] == b"\x89PNG\r\n\x1a\n"


def test_manifest_pronto_para_loja(client, app):
    from pathlib import Path

    data = json.loads(client.get("/manifest.webmanifest").get_data(as_text=True))
    # id igual ao start_url: quem já instalou continua com o mesmo app
    assert data["id"] == data["start_url"] == "/login"
    assert "finance" in data["categories"]
    formatos = {s["form_factor"] for s in data["screenshots"]}
    assert formatos == {"narrow", "wide"}
    for s in data["screenshots"]:
        arquivo = Path(app.static_folder) / s["src"].removeprefix("/static/")
        assert arquivo.is_file(), s["src"]
        assert client.get(s["src"]).status_code == 200


def test_assetlinks_desligado_por_padrao(client, monkeypatch):
    monkeypatch.delenv("ANDROID_APP_PACKAGE", raising=False)
    monkeypatch.delenv("ANDROID_SHA256_FINGERPRINTS", raising=False)
    assert client.get("/.well-known/assetlinks.json").status_code == 404
    monkeypatch.setenv("ANDROID_APP_PACKAGE", "br.com.araujooficial.finup")
    assert client.get("/.well-known/assetlinks.json").status_code == 404


def test_assetlinks_ligado(client, admin_client, monkeypatch):
    monkeypatch.setenv("ANDROID_APP_PACKAGE", "br.com.araujooficial.finup")
    monkeypatch.setenv("ANDROID_SHA256_FINGERPRINTS", " aa:bb , CC:DD ")
    for c in (client, admin_client):
        resp = c.get("/.well-known/assetlinks.json")
        assert resp.status_code == 200
        assert resp.mimetype == "application/json"
        alvo = resp.get_json()[0]["target"]
        assert alvo["package_name"] == "br.com.araujooficial.finup"
        assert alvo["sha256_cert_fingerprints"] == ["AA:BB", "CC:DD"]
