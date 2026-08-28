from decimal import Decimal

from app.services.pix import gerar_payload_pix, normalizar_chave_pix, _crc16_ccitt


def test_normalizar_email_e_cpf():
    assert normalizar_chave_pix("  Foo@Email.COM ") == "foo@email.com"
    assert normalizar_chave_pix("529.982.247-25") == "52998224725"
    assert normalizar_chave_pix("(11) 98888-7777") == "5511988887777"


def test_payload_pix_tem_crc_e_valor():
    payload = gerar_payload_pix(
        chave="teste@finup.app",
        nome_recebedor="FinUP Teste",
        cidade="São Paulo",
        valor=Decimal("29.90"),
        txid="FINUP1TEST",
    )
    assert payload.startswith("000201")
    assert "br.gov.bcb.pix" in payload
    assert "teste@finup.app" in payload
    assert "540529.90" in payload
    assert payload.endswith(_crc16_ccitt(payload[:-4]))
    assert len(payload) > 50


def test_qr_data_uri_gerado():
    from app.services.pix import payload_para_qr_data_uri

    payload = gerar_payload_pix(
        chave="teste@finup.app",
        nome_recebedor="FinUP",
        cidade="SAO PAULO",
        valor="10.00",
        txid="ABC123",
    )
    uri = payload_para_qr_data_uri(payload)
    assert uri.startswith("data:image/png;base64,")
    assert len(uri) > 200
