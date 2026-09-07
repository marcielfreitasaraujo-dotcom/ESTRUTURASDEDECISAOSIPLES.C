#!/usr/bin/env python3
"""Sanidade do Cabana House — não usa o FinUP."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COLOR_OPACITY = re.compile(
    r"\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|divide|placeholder)"
    r"-[a-z][a-z0-9]*/(\d{1,3})\b"
)


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

    def test_logo_existe(self) -> None:
        self.assertTrue((ROOT / "public/brand/logo.svg").is_file())

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
