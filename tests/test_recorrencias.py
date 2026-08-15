from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Conta, ContaPagar, Recorrencia, Usuario
from app.services.recorrencias import gerar_titulos_recorrentes


def _admin():
    return Usuario.query.filter_by(username="admin").first()


def test_recorrencia_gera_mes_atual_e_proximo_sem_duplicar(app):
    with app.app_context():
        admin = _admin()
        conta = Conta.query.filter_by(usuario_id=admin.id, nome="Nubank").first()
        rec = Recorrencia(
            usuario_id=admin.id,
            conta_id=conta.id,
            tipo="pagar",
            descricao="Faculdade Recorrente",
            valor=Decimal("129.00"),
            periodicidade="mensal",
            dia_vencimento=6,
            ativo=True,
        )
        db.session.add(rec)
        db.session.commit()

        n1 = gerar_titulos_recorrentes(admin.id)
        db.session.commit()
        n2 = gerar_titulos_recorrentes(admin.id)
        db.session.commit()
        n3 = gerar_titulos_recorrentes(admin.id)

        assert n1 == 2
        assert n2 == 0
        assert n3 == 0
        qtd = ContaPagar.query.filter_by(recorrencia_id=rec.id, ativo=True).count()
        assert qtd == 2


def test_nao_duplica_titulo_ja_lancado_na_mao(app):
    with app.app_context():
        admin = _admin()
        hoje = date.today()
        venc = date(hoje.year, hoje.month, min(6, 28))
        db.session.add(
            ContaPagar(
                usuario_id=admin.id,
                conta_id=Conta.query.filter_by(usuario_id=admin.id).first().id,
                tipo="pagar",
                descricao="Internet Recorrente",
                valor=Decimal("99.90"),
                vencimento=venc,
                status="pendente",
                ativo=True,
            )
        )
        rec = Recorrencia(
            usuario_id=admin.id,
            tipo="pagar",
            descricao="Internet Recorrente",
            valor=Decimal("99.90"),
            periodicidade="mensal",
            dia_vencimento=venc.day,
            ativo=True,
        )
        db.session.add(rec)
        db.session.commit()
        gerar_titulos_recorrentes(admin.id)
        db.session.commit()
        iguais = ContaPagar.query.filter_by(
            usuario_id=admin.id,
            descricao="Internet Recorrente",
            vencimento=venc,
            ativo=True,
        ).count()
        assert iguais == 1


def test_desativar_recorrencia_para_de_gerar(app):
    with app.app_context():
        admin = _admin()
        rec = Recorrencia(
            usuario_id=admin.id,
            tipo="pagar",
            descricao="Academia Teste",
            valor=Decimal("89.90"),
            periodicidade="mensal",
            dia_vencimento=10,
            ativo=True,
        )
        db.session.add(rec)
        db.session.commit()
        gerar_titulos_recorrentes(admin.id)
        db.session.commit()
        rec.ativo = False
        db.session.commit()
        antes = ContaPagar.query.filter_by(recorrencia_id=rec.id, ativo=True).count()
        assert gerar_titulos_recorrentes(admin.id) == 0
        depois = ContaPagar.query.filter_by(recorrencia_id=rec.id, ativo=True).count()
        assert depois == antes


def test_pagina_recorrentes(admin_client):
    resp = admin_client.get("/recorrentes")
    assert resp.status_code == 200
    assert "Contas recorrentes" in resp.get_data(as_text=True)
