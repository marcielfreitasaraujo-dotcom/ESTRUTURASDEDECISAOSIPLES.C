#!/usr/bin/env python3
"""Sanidade do Cabana House — não usa o FinUP."""

from __future__ import annotations

import hashlib
import re
import struct
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COLOR_OPACITY = re.compile(
    r"\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|divide|placeholder)"
    r"-[a-z][a-z0-9]*/(\d{1,3})\b"
)
IMAGE_REF = re.compile(r"/images/[a-z0-9-]+\.jpg")
WEBP_REF = re.compile(r"/images/[a-z0-9-]+\.webp")
PNG_ASSINATURA = b"\x89PNG\r\n\x1a\n"
TAG_CRUA = re.compile(r"<(?:img|source)\b[^>]*>", re.S)


def cabecalho_png(caminho: Path) -> tuple[int, int, int]:
    """Largura, altura e color type do IHDR. Color type 6 = RGBA."""
    dados = caminho.read_bytes()
    assert dados[:8] == PNG_ASSINATURA, caminho
    largura, altura = struct.unpack(">II", dados[16:24])
    return largura, altura, dados[25]


class TestCabanaHouse(unittest.TestCase):
    def test_dados_reais_do_cliente(self) -> None:
        texto = (ROOT / "src/data/restaurant.ts").read_text(encoding="utf-8")
        self.assertIn("5599992084455", texto)
        self.assertIn("Av. Chico Brito", texto)
        self.assertIn("Estreito", texto)
        self.assertNotIn("neighborhood", texto)

    def test_cardapio_marcado_como_mock(self) -> None:
        texto = (ROOT / "src/data/menu.ts").read_text(encoding="utf-8")
        self.assertIn("MOCK", texto)
        self.assertIn("mock: true", texto)

    def test_avaliacoes_sem_depoimentos_inventados(self) -> None:
        texto = (ROOT / "src/data/reviews.ts").read_text(encoding="utf-8")
        self.assertIn("reviewCount: 17", texto)
        self.assertIn("quotes: []", texto)

    def test_destaques_nao_usam_quatro_colunas_na_coluna_estreita(self) -> None:
        """Em md o layout vira duas colunas e a lista perde metade da largura.

        Com 4 tracks ali, "Experiência" não cabe e o texto vaza da moldura entre
        768px e ~1010px de viewport.
        """
        texto = (ROOT / "src/components/About.tsx").read_text(encoding="utf-8")
        ul = next(l for l in texto.splitlines() if "<ul" in l)
        self.assertIn("md:grid-cols-2", ul, ul.strip())
        self.assertNotIn("md:grid-cols-4", ul, ul.strip())
        self.assertNotIn("lg:grid-cols-4", ul, ul.strip())

    def test_componentes_existem(self) -> None:
        for nome in (
            "Navbar",
            "Hero",
            "About",
            "Brasa",
            "Menu",
            "MenuCard",
            "Gallery",
            "Lightbox",
            "Experience",
            "Reviews",
            "Location",
            "CTA",
            "Footer",
            "WhatsAppButton",
        ):
            self.assertTrue((ROOT / "src/components" / f"{nome}.tsx").is_file(), nome)

    def test_imagens_principais_existem(self) -> None:
        for nome in ("hero", "about", "brasa", "experience", "cta"):
            self.assertTrue((ROOT / "public/images" / f"{nome}.jpg").is_file(), nome)
            self.assertTrue((ROOT / "public/images" / f"{nome}.webp").is_file(), nome)

    def test_marca_oficial_presente(self) -> None:
        for nome in ("logo.png", "apple-touch-icon.png", "favicon-32.png", "favicon-16.png"):
            self.assertTrue((ROOT / "public/brand" / nome).is_file(), nome)

    def test_logo_tem_fundo_transparente(self) -> None:
        """Sem canal alfa o selo volta a aparecer dentro de um quadrado branco no site escuro."""
        for nome in ("logo.png", "apple-touch-icon.png", "favicon-32.png", "favicon-16.png"):
            largura, altura, color_type = cabecalho_png(ROOT / "public/brand" / nome)
            self.assertEqual(color_type, 6, f"{nome} precisa ser RGBA")
            self.assertEqual(largura, altura, f"{nome} precisa ser quadrado")

    def test_logo_provisoria_removida(self) -> None:
        """A logo oficial substituiu o rascunho; sobras voltariam a aparecer no site."""
        for nome in ("logo.svg", "mark.svg"):
            self.assertFalse((ROOT / "public/brand" / nome).exists(), nome)
        for arquivo in [*(ROOT / "src").rglob("*.tsx"), ROOT / "index.html"]:
            texto = arquivo.read_text(encoding="utf-8")
            self.assertNotIn("logo.svg", texto, arquivo.name)
            self.assertNotIn("mark.svg", texto, arquivo.name)

    def test_build_usa_caminhos_relativos(self) -> None:
        """Sem `base: './'` o build só funciona na raiz de um domínio.

        Servido em subpasta (githack, GitHub Pages de projeto) um caminho absoluto
        aponta para a raiz do host e o site abre sem CSS, sem JS e sem imagem.
        """
        config = (ROOT / "vite.config.ts").read_text(encoding="utf-8")
        self.assertRegex(config, r"base:\s*'\./'")

    def test_assets_passam_pelo_resolvedor_de_base(self) -> None:
        """Uma tag crua com `src` absoluto escapa do `asset()` e quebra em subpasta.

        `<Picture src="/images/...">` continua valendo: quem resolve a base ali é o
        próprio Picture. O risco é o `<img>`/`<source>` escrito à mão.
        """
        for arquivo in (ROOT / "src").rglob("*.tsx"):
            for tag in TAG_CRUA.findall(arquivo.read_text(encoding="utf-8")):
                for atributo in ('src="/', 'srcSet="/'):
                    self.assertNotIn(
                        atributo, tag, f"{arquivo.name}: envolva com asset() -> {tag[:60]}"
                    )

    def test_cada_foto_aparece_em_um_unico_lugar(self) -> None:
        """Repetir a mesma foto em seções diferentes descaracteriza a apresentação."""
        usos: dict[str, int] = {}
        for arquivo in [*(ROOT / "src").rglob("*.tsx"), *(ROOT / "src").rglob("*.ts")]:
            for caminho in IMAGE_REF.findall(arquivo.read_text(encoding="utf-8")):
                usos[caminho] = usos.get(caminho, 0) + 1
        self.assertEqual([c for c, n in usos.items() if n > 1], [])

    def test_fotos_nao_sao_o_mesmo_arquivo(self) -> None:
        """Arquivos com nomes diferentes e conteúdo igual voltam a repetir a mesma imagem."""
        por_hash: dict[str, list[str]] = {}
        for arquivo in sorted((ROOT / "public/images").glob("*.jpg")):
            digest = hashlib.md5(arquivo.read_bytes()).hexdigest()
            por_hash.setdefault(digest, []).append(arquivo.name)
        self.assertEqual([nomes for nomes in por_hash.values() if len(nomes) > 1], [])

    def test_todas_as_fotos_referenciadas_existem(self) -> None:
        faltando = []
        for arquivo in [*(ROOT / "src").rglob("*.tsx"), *(ROOT / "src").rglob("*.ts")]:
            texto = arquivo.read_text(encoding="utf-8")
            for caminho in IMAGE_REF.findall(texto) + WEBP_REF.findall(texto):
                if not (ROOT / "public" / caminho.lstrip("/")).is_file():
                    faltando.append(caminho)
        self.assertEqual(faltando, [])

    def test_opacidades_geradas_pelo_tailwind(self) -> None:
        """Tailwind só emite modificadores de opacidade múltiplos de 5; o resto some do CSS."""
        fora_da_escala = []
        for arquivo in (ROOT / "src").rglob("*.tsx"):
            for valor in COLOR_OPACITY.findall(arquivo.read_text(encoding="utf-8")):
                if int(valor) % 5:
                    fora_da_escala.append(f"{arquivo.name}: /{valor}")
        self.assertEqual(fora_da_escala, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
