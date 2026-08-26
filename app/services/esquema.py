from sqlalchemy import inspect, text

from app.extensions import db


COLUNAS_CONTAS_PAGAR = {
    "tipo": "ALTER TABLE contas_pagar ADD COLUMN tipo VARCHAR(20) DEFAULT 'pagar'",
    "pessoa": "ALTER TABLE contas_pagar ADD COLUMN pessoa VARCHAR(120)",
    "observacao": "ALTER TABLE contas_pagar ADD COLUMN observacao TEXT",
    "movimentacao_id": "ALTER TABLE contas_pagar ADD COLUMN movimentacao_id INTEGER",
}

COLUNAS_RECORRENCIAS = {
    "tipo": "ALTER TABLE recorrencias ADD COLUMN tipo VARCHAR(20) DEFAULT 'pagar'",
    "pessoa": "ALTER TABLE recorrencias ADD COLUMN pessoa VARCHAR(120)",
    "observacao": "ALTER TABLE recorrencias ADD COLUMN observacao TEXT",
    "mes_vencimento": "ALTER TABLE recorrencias ADD COLUMN mes_vencimento INTEGER",
}

COLUNAS_PARCELAS = {
    "categoria_id": "ALTER TABLE parcelas ADD COLUMN categoria_id INTEGER",
    "valor_pago": "ALTER TABLE parcelas ADD COLUMN valor_pago NUMERIC(14, 2) DEFAULT 0",
}

COLUNAS_USUARIOS = {
    "ver_familia": "ALTER TABLE usuarios ADD COLUMN ver_familia BOOLEAN DEFAULT FALSE",
    "eh_familia": "ALTER TABLE usuarios ADD COLUMN eh_familia BOOLEAN DEFAULT FALSE",
    "assinatura_ativa": "ALTER TABLE usuarios ADD COLUMN assinatura_ativa BOOLEAN DEFAULT TRUE",
    "assinatura_vence_em": "ALTER TABLE usuarios ADD COLUMN assinatura_vence_em DATE",
}


def _adicionar_colunas(tabela: str, colunas: dict) -> None:
    inspetor = inspect(db.engine)
    if tabela not in inspetor.get_table_names():
        return
    existentes = {col["name"] for col in inspetor.get_columns(tabela)}
    with db.engine.begin() as conn:
        for nome, sql in colunas.items():
            if nome not in existentes:
                conn.execute(text(sql))


def _migrar_assinatura_segura() -> None:
    """Garante que o deploy não trave ninguém: assinatura liberada + família pré-existente marcada."""
    inspetor = inspect(db.engine)
    if "usuarios" not in inspetor.get_table_names():
        return
    cols = {col["name"] for col in inspetor.get_columns("usuarios")}
    if "assinatura_ativa" not in cols or "eh_familia" not in cols:
        return

    with db.engine.begin() as conn:
        conn.execute(
            text("UPDATE usuarios SET assinatura_ativa = TRUE WHERE assinatura_ativa IS NULL")
        )
        # Uma vez só: usuários já existentes (não admin) viram família isenta,
        # para o site não mudar o acesso no primeiro deploy.
        if "configuracoes" in inspetor.get_table_names():
            row = conn.execute(
                text("SELECT valor FROM configuracoes WHERE chave = 'assinatura_migracao_v1'")
            ).fetchone()
            if row is None:
                conn.execute(
                    text(
                        "UPDATE usuarios SET eh_familia = TRUE "
                        "WHERE perfil != 'admin' AND (eh_familia IS NULL OR eh_familia = FALSE)"
                    )
                )
                conn.execute(
                    text(
                        "INSERT INTO configuracoes (chave, valor, atualizado_em) "
                        "VALUES ('assinatura_migracao_v1', '1', CURRENT_TIMESTAMP)"
                    )
                )
                # Bloqueio começa ligado (com defaults seguros). Admin pode desligar na aba.
                existe_bloqueio = conn.execute(
                    text("SELECT 1 FROM configuracoes WHERE chave = 'assinatura_bloqueio_ativo'")
                ).fetchone()
                if existe_bloqueio is None:
                    conn.execute(
                        text(
                            "INSERT INTO configuracoes (chave, valor, atualizado_em) "
                            "VALUES ('assinatura_bloqueio_ativo', '1', CURRENT_TIMESTAMP)"
                        )
                    )


def garantir_esquema() -> None:
    """Acrescenta colunas novas em bancos SQLite já criados na Fase 1."""
    _adicionar_colunas("contas_pagar", COLUNAS_CONTAS_PAGAR)
    _adicionar_colunas("recorrencias", COLUNAS_RECORRENCIAS)
    _adicionar_colunas("parcelas", COLUNAS_PARCELAS)
    _adicionar_colunas("usuarios", COLUNAS_USUARIOS)
    inspetor = inspect(db.engine)
    if "contas_pagar" in inspetor.get_table_names():
        with db.engine.begin() as conn:
            conn.execute(
                text("UPDATE contas_pagar SET tipo = 'pagar' WHERE tipo IS NULL OR tipo = ''")
            )
    if "recorrencias" in inspetor.get_table_names():
        with db.engine.begin() as conn:
            conn.execute(
                text("UPDATE recorrencias SET tipo = 'pagar' WHERE tipo IS NULL OR tipo = ''")
            )
    _migrar_assinatura_segura()
