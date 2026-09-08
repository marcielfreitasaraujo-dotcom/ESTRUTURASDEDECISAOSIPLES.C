from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "movifit"
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
CONFIG = (ROOT / "js" / "config.js").read_text(encoding="utf-8")


def test_arquivos_essenciais_existem():
    for rel in [
        "index.html",
        "css/style.css",
        "js/main.js",
        "js/config.js",
        "img/logo.png",
        "img/logo-transparente.png",
        "img/favicon.png",
        "img/hero.webp",
        "img/og.jpg",
        "fonts/bebas-neue-400-latin.woff2",
        "fonts/inter-400-latin.woff2",
        "fonts/oswald-600-latin.woff2",
        "robots.txt",
        "site.webmanifest",
    ]:
        assert (ROOT / rel).is_file(), rel


def test_seo_e_identidade():
    assert "Movifit Academia | Academia em Estreito - MA" in HTML
    assert "Um espaço para quem busca treino, disciplina, foco e resultados" in HTML
    assert "GymOrFitnessCenter" in HTML
    assert "Av. Chico Brito, 94" in HTML
    assert "65975-000" in HTML
    assert "#ffd000" in (ROOT / "css" / "style.css").read_text(encoding="utf-8").lower()


def test_secoes_obrigatorias():
    for secao in [
        'id="inicio"',
        'id="diferenciais"',
        'id="movifit"',
        'id="estrutura"',
        'id="experiencia"',
        'id="horarios"',
        'id="localizacao"',
        'id="galeria"',
        'id="contato"',
    ]:
        assert secao in HTML, secao


def test_horarios_oficiais():
    assert "05h às 21:30h" in HTML
    assert "06h às 10:00h" in HTML
    assert "opens\": \"05:00\"" in HTML or 'opens": "05:00"' in HTML
    assert "21:30" in HTML


def test_contato_oficial():
    assert 'whatsapp: "5599920008098"' in CONFIG
    assert "movifit_academia" in CONFIG
    assert "lead-form" not in HTML
    assert 'name="nome"' not in HTML
    assert "Seu nome" not in HTML
    assert "R$" not in HTML
    assert "depoimento" not in HTML.lower()


def test_acessibilidade_basica():
    assert "fonts.googleapis.com" not in HTML
    assert 'lang="pt-BR"' in HTML
    assert "Pular para o conteúdo" in HTML
    assert 'aria-label="Abrir menu"' in HTML
    assert "data-whatsapp" in HTML
    assert "data-instagram" in HTML
    assert "lead-form" not in HTML
    assert 'Fale com a Movifit' in HTML


def test_links_whatsapp_instagram_no_html():
    wa = "https://wa.me/5599920008098"
    ig = "https://www.instagram.com/movifit_academia/"
    assert HTML.count('data-whatsapp') == 3
    assert HTML.count('data-instagram') == 3
    assert HTML.count(wa) == 3
    assert ig in HTML
    assert HTML.count('href="' + ig + '"') == 3
    js = (ROOT / "js" / "main.js").read_text(encoding="utf-8")
    assert 'target", "_blank"' not in js
    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    assert "pointer-events: none" in css
    assert "touch-action: manipulation" in css
