from pathlib import Path

ASSINATURAS = {
    "jpg": (b"\xff\xd8\xff",),
    "jpeg": (b"\xff\xd8\xff",),
    "png": (b"\x89PNG\r\n\x1a\n",),
    "pdf": (b"%PDF",),
    "webp": (b"RIFF",),
}

MIME_POR_EXT = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "pdf": "application/pdf",
    "webp": "image/webp",
}


def extensao_segura(nome: str) -> str | None:
    if not nome or "." not in nome:
        return None
    ext = nome.rsplit(".", 1)[-1].lower().strip()
    if ext in ASSINATURAS:
        return ext
    return None


def validar_conteudo(caminho: Path, ext: str) -> bool:
    try:
        with caminho.open("rb") as fh:
            cabeca = fh.read(16)
    except OSError:
        return False
    if ext == "webp":
        return cabeca.startswith(b"RIFF") and b"WEBP" in cabeca
    return any(cabeca.startswith(sig) for sig in ASSINATURAS[ext])
