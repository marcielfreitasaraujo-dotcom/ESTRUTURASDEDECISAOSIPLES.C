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


def test_nao_inventa_contato():
    assert 'whatsapp: ""' in CONFIG
    assert 'instagram: ""' in CONFIG
    assert "wa.me/55" not in HTML
    assert "instagram.com/" not in HTML
    assert "R$" not in HTML
    assert "depoimento" not in HTML.lower()


def test_acessibilidade_basica():
    assert 'lang="pt-BR"' in HTML
    assert "Pular para o conteúdo" in HTML
    assert 'aria-label="Abrir menu"' in HTML
    assert 'Fale com a Movifit' in HTML
