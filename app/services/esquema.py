from sqlalchemy import inspect, text

from app.extensions import db


COLUNAS_CONTAS_PAGAR = {
    "tipo": "ALTER TABLE contas_pagar ADD COLUMN tipo VARCHAR(20) DEFAULT 'pagar'",
    "pessoa": "ALTER TABLE contas_pagar ADD COLUMN pessoa VARCHAR(120)",
    "observacao": "ALTER TABLE contas_pagar ADD COLUMN observacao TEXT",
    "movimentacao_id": "ALTER TABLE contas_pagar ADD COLUMN movimentacao_id INTEGER",
}


def garantir_esquema() -> None:
    """Acrescenta colunas novas em bancos SQLite já criados na Fase 1."""
    inspetor = inspect(db.engine)
    tabelas = inspetor.get_table_names()
    if "contas_pagar" not in tabelas:
        return
    existentes = {col["name"] for col in inspetor.get_columns("contas_pagar")}
    with db.engine.begin() as conn:
        for nome, sql in COLUNAS_CONTAS_PAGAR.items():
            if nome not in existentes:
                conn.execute(text(sql))
        conn.execute(
            text("UPDATE contas_pagar SET tipo = 'pagar' WHERE tipo IS NULL OR tipo = ''")
        )
