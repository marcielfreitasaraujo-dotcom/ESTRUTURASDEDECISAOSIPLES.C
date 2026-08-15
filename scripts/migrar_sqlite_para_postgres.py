#!/usr/bin/env python3
"""Copia dados de um SQLite para um PostgreSQL.

NÃO executa sozinho. Sempre gera backup antes.
Uso:

  python scripts/migrar_sqlite_para_postgres.py
  python scripts/migrar_sqlite_para_postgres.py --executar

Variáveis:
  DATABASE_URL            origem (sqlite) — padrão do projeto
  DATABASE_URL_DESTINO    PostgreSQL de destino (obrigatório para --executar)
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app import create_app
from app.extensions import db
from app.services.backup import criar_backup
from config import normalizar_database_url


TABELAS_ORDEM = [
    "usuarios",
    "categorias",
    "contas",
    "recorrencias",
    "movimentacoes",
    "comprovantes",
    "contas_pagar",
    "cartoes",
    "parcelas",
    "orcamentos",
    "configuracoes",
    "auditoria",
    "notificacoes",
]


def _contar(engine, tabela: str) -> int:
    insp = inspect(engine)
    if tabela not in insp.get_table_names():
        return 0
    with engine.connect() as conn:
        return int(conn.execute(text(f"SELECT COUNT(*) FROM {tabela}")).scalar() or 0)


def main() -> int:
    parser = argparse.ArgumentParser(description="Migração SQLite → PostgreSQL (não destrutiva).")
    parser.add_argument(
        "--executar",
        action="store_true",
        help="De fato copia os dados. Sem esta flag, só mostra o diagnóstico.",
    )
    args = parser.parse_args()

    app = create_app()
    origem = app.config["SQLALCHEMY_DATABASE_URI"]
    destino = os.environ.get("DATABASE_URL_DESTINO")
    destino_norm = normalizar_database_url(destino) if destino else None

    print("=== Diagnóstico ===")
    print(f"Origem : {origem}")
    print(f"Destino: {destino_norm or '(não definido — exporte DATABASE_URL_DESTINO)'}")

    with app.app_context():
        engine_origem = db.engine
        print("\nRegistros na origem:")
        totais = {}
        for tabela in TABELAS_ORDEM:
            totais[tabela] = _contar(engine_origem, tabela)
            print(f"  {tabela:16} {totais[tabela]}")

        print("\nCriando backup de segurança da origem…")
        pasta = criar_backup()
        print(f"Backup em {pasta}")

        if not args.executar:
            print(
                "\nNenhuma cópia foi feita. Se os números estiverem ok e o PostgreSQL "
                "já existir vazio, rode de novo com --executar e DATABASE_URL_DESTINO."
            )
            return 0

        if not destino_norm or destino_norm.startswith("sqlite"):
            print("Erro: DATABASE_URL_DESTINO precisa ser um PostgreSQL.", file=sys.stderr)
            return 1
        if origem == destino_norm:
            print("Erro: origem e destino são iguais.", file=sys.stderr)
            return 1

        engine_dest = create_engine(destino_norm, pool_pre_ping=True)
        print("Criando tabelas no destino (create_all, sem apagar a origem)…")
        db.metadata.create_all(engine_dest)

        SessionOrigem = sessionmaker(bind=engine_origem)
        SessionDest = sessionmaker(bind=engine_dest)
        so, sd = SessionOrigem(), SessionDest()
        try:
            with engine_origem.connect() as co, engine_dest.begin() as cd:
                insp_o = inspect(engine_origem)
                insp_d = inspect(engine_dest)
                for tabela in TABELAS_ORDEM:
                    if tabela not in insp_o.get_table_names():
                        continue
                    if tabela not in insp_d.get_table_names():
                        print(f"  pulando {tabela} (não existe no destino)")
                        continue
                    linhas = co.execute(text(f"SELECT * FROM {tabela}")).mappings().all()
                    if not linhas:
                        continue
                    colunas = list(linhas[0].keys())
                    placeholders = ", ".join(f":{c}" for c in colunas)
                    cols = ", ".join(colunas)
                    cd.execute(
                        text(f"INSERT INTO {tabela} ({cols}) VALUES ({placeholders})"),
                        [dict(l) for l in linhas],
                    )
                    print(f"  copiou {tabela}: {len(linhas)}")
            print("\nMigração concluída. A origem SQLite NÃO foi apagada.")
            print("Confira as contagens no PostgreSQL antes de apontar DATABASE_URL para ele.")
        finally:
            so.close()
            sd.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
