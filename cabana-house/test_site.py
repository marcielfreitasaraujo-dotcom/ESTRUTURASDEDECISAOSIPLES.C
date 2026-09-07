#!/usr/bin/env python3
"""Sanidade do Cabana House — não usa o FinUP."""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class TestCabanaHouse(unittest.TestCase):
    def test_dados_reais_do_cliente(self) -> None:
        texto = (ROOT / "src/data/restaurant.ts").read_text(encoding="utf-8")
        self.assertIn("5599992084455", texto)
        self.assertIn("Av. Chico Brito", texto)
        self.assertIn("Estreito", texto)

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
