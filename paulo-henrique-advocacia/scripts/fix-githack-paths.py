#!/usr/bin/env python3
"""Prefix leftover /images/ paths so raw.githack can load photos."""

from pathlib import Path
import re
import sys

BASE = (
    "/marcielfreitasaraujo-dotcom/ESTRUTURASDEDECISAOSIPLES.C"
    "/cursor/fix-logo-crest-tip-ad5f/paulo-henrique-site"
)
ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "paulo-henrique-site")

# "/images/..." that is not already under BASE, and not a full https URL.
PATTERN = re.compile(
    r'(?<!paulo-henrique-site)(?<!paulohenriqueadvocacia\.com\.br)(/images/)'
)

TEXT_SUFFIXES = {
    ".html",
    ".js",
    ".css",
    ".txt",
    ".xml",
    ".webmanifest",
    ".json",
}


def rewrite(text: str) -> str:
    text = PATTERN.sub(BASE + r"\1", text)
    for name in ("/icon.png", "/apple-icon.png", "/favicon.ico"):
        text = text.replace(f'"{name}"', f'"{BASE}{name}"')
        text = text.replace(f"'{name}'", f"'{BASE}{name}'")
    return text


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in TEXT_SUFFIXES:
            continue
        original = path.read_text(encoding="utf-8", errors="ignore")
        updated = rewrite(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
            print("fixed", path.relative_to(ROOT))
    print(f"updated {changed} files")


if __name__ == "__main__":
    main()
