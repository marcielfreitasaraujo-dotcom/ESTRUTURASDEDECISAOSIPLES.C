#!/usr/bin/env python3
"""Gera um backup local. Não apaga o banco atual."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.services.backup import criar_backup


def main() -> None:
    app = create_app()
    with app.app_context():
        pasta = criar_backup()
        print(f"Backup criado em: {pasta}")


if __name__ == "__main__":
    main()
