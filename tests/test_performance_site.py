from pathlib import Path

SITE = Path(__file__).resolve().parents[1] / "performance"


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
        "img/frente.jpg",
        "img/hero.jpg",
        "img/hero.webp",
        "img/sobre.jpg",
        "img/galeria-1.jpg",
        "img/favicon.png",
    )
    for nome in obrigatorios:
        assert (SITE / nome).is_file(), f"faltou {nome}"


def test_conteudo_principal_da_pagina():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    data = (SITE / "js/site-data.js").read_text(encoding="utf-8")
    assert "Performance Academia" in html
    assert 'lang="pt-BR"' in html
    assert "Estreito" in html
    assert "Santos Dumont, 635" in html
    assert "https://wa.me/5599981568022" in html
    assert "academia_performancee" in html
    assert "Wellhub" in html
    assert "TotalPass" in html
    assert "Musculação" in html
    assert "Dança" in html or "FitDance" in html
    assert "Cardio" in html
    assert "5,0" in html
    assert "Consulte condições" in html
    assert "R$ 89,90" not in html
    assert "Action Fitness" not in html
    assert "mailto:" not in html
    assert "5599981568022" in data
    assert "wa-float" in html


def test_estilo_e_script_referenciados():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "css/style.css").read_text(encoding="utf-8")
    js = (SITE / "js/main.js").read_text(encoding="utf-8")
    assert 'href="css/style.css"' in html
    assert 'src="js/main.js"' in html
    assert 'src="js/site-data.js"' in html
    assert "--action-lime: #98f800" in css
    assert 'alt="Performance Academia"' in html
    assert "img/logo.png" in html
    assert "--action-black: #080a08" in css
    assert ".btn-cta" in css
    assert "img/sobre.jpg" in html
    assert ".selo-hoje[hidden]" in css
    assert 'id="experiencia"' in html
    assert 'id="instagram"' in html
    assert "hero.webp" in html
    assert "IntersectionObserver" in js
    assert "data-hoje" in js
    assert "gallery_open" in js
    assert "view_plans" in js
    assert "menu-toggle" in js


def test_secoes_performance_especificas():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    css = (SITE / "css/style.css").read_text(encoding="utf-8")
    assert "jornada" in html
    assert ".jornada" in css
    assert "Chegue" in html
    assert "Treine" in html
    assert "Supere" in html
    assert "Seu treino," in html
    assert "seu momento." in html
    assert "Entre, treine," in html
    assert "evolua" in html.lower()
    assert "img/logo.png" in html
    assert "Performance Academia" in html
    assert "hero-scroll" in html
    assert ".hero-scroll" in css
    assert "frase-impacto" in html
    assert ".frase-impacto" in css
    assert "Frente da Performance Academia" in html
    assert "cta-box-foto" in html
    assert 'href="https://wa.me/5599981568022?text=Ol%C3%A1%21%20Quero%20agendar%20um%20treino%20na%20Performance%20Academia."' in html
    assert "btn-instagram" in html
    assert ".btn-instagram" in css
    assert html.count('class="btn btn-ghost" data-evento="click_whatsapp" href="https://wa.me/5599981568022?text=Ol%C3%A1%21%20Quero%20consultar%20o%20plano') == 4
