from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "academia"


def test_arquivos_do_site_existem():
    obrigatorios = (
        "index.html",
        "css/style.css",
        "js/main.js",
        "js/site-data.js",
        "netlify.toml",
        "_headers",
        ".htaccess",
        "img/logo.png",
        "img/hero.jpg",
        "img/hero.webp",
        "img/favicon.png",
    )
    for nome in obrigatorios:
        assert (SITE / nome).is_file(), f"faltou {nome}"


def test_conteudo_principal_da_pagina():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    data = (SITE / "js/site-data.js").read_text(encoding="utf-8")
    assert "Action Fitness" in html
    assert 'lang="pt-BR"' in html
    assert "Estreito" in html
    assert "Chico Brito, 1006" in html
    assert "https://wa.me/5599992348793" in html
    assert "actionfitness_academia" in html
    assert "Wellhub" in html
    assert "TotalPass" in html
    assert "Musculação" in html
    assert "Treinamento híbrido" in html
    assert "4,9" in html
    assert "Consulte condições" in html
    assert "R$ 89,90" not in html
    assert "FitUP" not in html
    assert "mailto:" not in html
    assert "5599992348793" in data
    assert "wa-float" in html


def test_estilo_e_script_referenciados():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "css/style.css").read_text(encoding="utf-8")
    js = (SITE / "js/main.js").read_text(encoding="utf-8")
    assert 'href="css/style.css"' in html
    assert 'src="js/main.js"' in html
    assert 'src="js/site-data.js"' in html
    assert "--red: #e11d2e" in css
    assert "id=\"experiencia\"" in html
    assert 'id="instagram"' in html
    assert "hero.webp" in html
    assert "IntersectionObserver" in js
    assert "data-hoje" in js
    assert "gallery_open" in js
    assert "view_plans" in js
    assert "menu-toggle" in js
