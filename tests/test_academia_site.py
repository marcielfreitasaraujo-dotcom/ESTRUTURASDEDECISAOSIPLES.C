from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "academia"


def test_arquivos_do_site_existem():
    obrigatorios = (
        "index.html",
        "css/style.css",
        "js/main.js",
        "netlify.toml",
        "_headers",
        ".htaccess",
        "img/logo.png",
        "img/hero.jpg",
        "img/sobre.jpg",
        "img/musculacao.jpg",
        "img/funcional.jpg",
        "img/spinning.jpg",
        "img/lutas.jpg",
        "img/ritmos.jpg",
        "img/avaliacao.jpg",
        "img/favicon.png",
    )
    for nome in obrigatorios:
        assert (SITE / nome).is_file(), f"faltou {nome}"


def test_conteudo_principal_da_pagina():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    assert "FitUP Academia" in html
    assert 'lang="pt-BR"' in html
    assert 'id="inicio"' in html
    assert 'id="sobre"' in html
    assert 'id="modalidades"' in html
    assert 'id="planos"' in html
    assert 'id="horarios"' in html
    assert 'id="localizacao"' in html
    assert 'id="contato"' in html
    assert "https://wa.me/559991677463" in html
    assert "https://www.instagram.com/fitup.estreito/" in html
    assert "Musculação" in html
    assert "Spinning" in html
    assert "R$ 89,90" in html
    assert "Estreito" in html
    assert "wa-float" in html
    assert "mailto:" not in html


def test_estilo_e_script_referenciados():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "css/style.css").read_text(encoding="utf-8")
    js = (SITE / "js/main.js").read_text(encoding="utf-8")
    assert 'href="css/style.css"' in html
    assert 'src="js/main.js"' in html
    assert "--orange: #ff5a1f" in css
    assert "data-plano-tab" in js
    assert "menu-toggle" in js
