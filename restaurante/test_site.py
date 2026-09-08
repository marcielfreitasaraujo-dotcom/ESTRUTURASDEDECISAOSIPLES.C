#!/usr/bin/env python3
"""Checagens do site Casa do Rio — não usa o banco nem o app FinUP."""

from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class TestSiteRestaurante(unittest.TestCase):
    def test_arquivos_essenciais_existem(self) -> None:
        for relativo in (
            "index.html",
            "css/style.css",
            "js/main.js",
            "js/site-data.js",
            "img/logo.png",
            "img/hero.jpg",
            "img/hero.webp",
            "netlify.toml",
            "_headers",
            ".htaccess",
        ):
            caminho = ROOT / relativo
            self.assertTrue(caminho.is_file(), f"faltou {relativo}")
            self.assertGreater(caminho.stat().st_size, 32, f"{relativo} está vazio")

    def test_html_tem_secoes_principais(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for trecho in (
            "Casa do Rio",
            'id="inicio"',
            'id="sobre"',
            'id="cardapio"',
            'id="reservas"',
            'id="localizacao"',
            'id="experiencia"',
            'id="assinatura"',
            "form-reserva",
            "Reservar mesa",
            "application/ld+json",
            "wa.me",
        ):
            self.assertIn(trecho, html)

    def test_html_nao_aponta_para_finup(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("finup.araujooficial.com.br", html.lower())
        self.assertNotIn("/login", html)

    def test_cardapio_tem_pratos_regionais(self) -> None:
        dados = (ROOT / "js/site-data.js").read_text(encoding="utf-8").lower()
        for prato in ("tambaqui", "pintado", "carne de sol", "moqueca"):
            self.assertIn(prato, dados)

    def test_js_liga_whatsapp_e_pedido(self) -> None:
        js = (ROOT / "js/main.js").read_text(encoding="utf-8")
        self.assertIn("wa.me", js)
        self.assertIn("form-reserva", js)
        self.assertIn("data-add", js)
        self.assertIn("data-enviar-pedido", js)
        self.assertIn("Escape", js)
        self.assertIn("ArrowRight", js)

    def test_acessibilidade_basica(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('class="skip"', html)
        self.assertIn('lang="pt-BR"', html)
        self.assertIn('aria-modal="true"', html)
        self.assertIn("reserva-nome", html)
        self.assertIn("lightbox", html)
        self.assertIn("hasMenu", html)


if __name__ == "__main__":
    unittest.main(verbosity=2)
