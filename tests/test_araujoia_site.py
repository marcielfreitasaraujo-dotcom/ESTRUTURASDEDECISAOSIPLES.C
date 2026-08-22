from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "araujoia"


def test_arquivos_do_site_existem():
    for nome in ("index.html", "style.css", "script.js"):
        assert (SITE / nome).is_file(), f"faltou {nome}"


def test_conteudo_principal_da_pagina():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    assert "AraujoIA" in html
    assert 'id="contato"' in html
    assert "marcielfreitasaraujo@gmail.com" in html
    assert "https://wa.me/5599991677463" in html
    assert "Sites profissionais para empresas" in html


def test_estilo_e_script_referenciados():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "style.css").read_text(encoding="utf-8")
    js = (SITE / "script.js").read_text(encoding="utf-8")
    assert 'href="style.css"' in html
    assert 'src="script.js"' in html
    assert "--accent: #3dbeb4" in css
    assert "IntersectionObserver" in js
