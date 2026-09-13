from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "araujoia"
SRC = (SITE / "src").read_text if False else SITE / "src"


def _read(*parts):
    return (SITE.joinpath(*parts)).read_text(encoding="utf-8")


def test_arquivos_do_site_existem():
    for path in (
        "index.html",
        "package.json",
        "src/App.jsx",
        "src/data/site.js",
        "public/robots.txt",
        "public/sitemap.xml",
        "public/favicon.svg",
    ):
        assert (SITE / path).is_file(), f"faltou {path}"


def test_conteudo_principal_da_pagina():
    html = _read("index.html")
    data = _read("src/data/site.js")
    app = _read("src/App.jsx")
    assert "AraújoIA | Sites, Sistemas e Soluções Digitais" in html
    assert "A AraújoIA desenvolve sites, sistemas, automações" in html
    assert "application/ld+json" in html
    assert "https://wa.me/5599991677463" in data
    assert "https://www.instagram.com/arauj0.ia/" in data
    assert "@Arauj0.IA" in data
    assert "instagram.com/araujo.ia/" not in data
    assert "marcielfreitasaraujo@gmail.com" not in data
    assert "https://finup-araujo-ia.netlify.app/" in data
    assert "https://marcielfreitasaraujo-dotcom.github.io/ESTRUTURASDEDECISAOSIPLES.C/" in data
    assert "<Hero />" in app
    assert "<Projects />" in app
    assert "<FAQ />" in app


def test_estilo_e_identidade():
    css = _read("src/index.css")
    tailwind = _read("tailwind.config.js")
    assert "background: #070a0a" in css
    assert "#3dbeb4" in tailwind
    assert "Syne" in tailwind
