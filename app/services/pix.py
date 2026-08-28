"""Gera payload PIX (BR Code / EMV) e QR Code em data URI."""

from __future__ import annotations

import base64
import io
import re
from decimal import Decimal


def _tlv(ident: str, valor: str) -> str:
    valor = valor or ""
    return f"{ident}{len(valor):02d}{valor}"


def _crc16_ccitt(payload: str) -> str:
    crc = 0xFFFF
    for ch in payload.encode("utf-8"):
        crc ^= ch << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def normalizar_chave_pix(chave: str) -> str:
    chave = (chave or "").strip()
    if not chave:
        return ""
    # e-mail
    if "@" in chave:
        return chave.lower()
    so_digitos = re.sub(r"\D", "", chave)
    # Telefone já com DDI 55
    if so_digitos.startswith("55") and len(so_digitos) in {12, 13}:
        return so_digitos
    # CPF / CNPJ formatados (pontos, traço, barra)
    if re.fullmatch(r"[\d.\-/]+", chave.replace(" ", "")) and len(so_digitos) in {11, 14}:
        if "." in chave or "/" in chave or (chave.count("-") == 1 and len(so_digitos) == 11):
            return so_digitos
    # Telefone BR (com ou sem máscara)
    if len(so_digitos) in {10, 11} and (
        chave.startswith("(") or chave.startswith("+") or "-" in chave or " " in chave
    ):
        return "55" + so_digitos
    if re.fullmatch(r"\d{10,11}", chave):
        return "55" + chave
    # CNPJ/CPF só dígitos
    if len(so_digitos) in {11, 14} and re.fullmatch(r"\d+", chave):
        return so_digitos
    # chave aleatória (EVP) ou outro formato
    return chave


def sanitizar_texto_emv(texto: str, max_len: int) -> str:
    """Remove acentos problemáticos e limita tamanho (padrão PIX)."""
    mapa = str.maketrans(
        "ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ",
        "AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn",
    )
    limpo = (texto or "").translate(mapa)
    limpo = re.sub(r"[^A-Za-z0-9 .,\-_/]", "", limpo)
    return limpo.strip()[:max_len] or "FINUP"


def montar_txid(usuario_id: int | None = None) -> str:
    """txid permitido: até 25 chars [A-Za-z0-9]."""
    from datetime import datetime, timezone

    agora = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
    base = f"FINUP{usuario_id or 0}{agora}"
    return re.sub(r"[^A-Za-z0-9]", "", base)[:25]


def gerar_payload_pix(
    *,
    chave: str,
    nome_recebedor: str,
    cidade: str,
    valor: Decimal | float | str | None = None,
    txid: str | None = None,
    descricao: str | None = None,
) -> str:
    """Monta o PIX copia-e-cola (BR Code estático/com valor)."""
    chave_n = normalizar_chave_pix(chave)
    if not chave_n:
        raise ValueError("Informe a chave PIX.")
    nome = sanitizar_texto_emv(nome_recebedor, 25)
    cidade_n = sanitizar_texto_emv(cidade or "SAO PAULO", 15)
    tx = re.sub(r"[^A-Za-z0-9]", "", txid or "***")[:25] or "***"

    merchant_account = _tlv("00", "br.gov.bcb.pix") + _tlv("01", chave_n)
    if descricao:
        desc = sanitizar_texto_emv(descricao, 72)
        if desc:
            merchant_account += _tlv("02", desc)

    payload = (
        _tlv("00", "01")
        + _tlv("26", merchant_account)
        + _tlv("52", "0000")
        + _tlv("53", "986")
    )
    if valor is not None:
        valor_dec = Decimal(str(valor)).quantize(Decimal("0.01"))
        if valor_dec > 0:
            payload += _tlv("54", f"{valor_dec:.2f}")
    payload += (
        _tlv("58", "BR")
        + _tlv("59", nome)
        + _tlv("60", cidade_n)
        + _tlv("62", _tlv("05", tx))
        + "6304"
    )
    return payload + _crc16_ccitt(payload)


def payload_para_qr_data_uri(payload: str, box_size: int = 6) -> str:
    """QR Code PNG em data URI (para <img src=...>)."""
    import qrcode

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"
