# FinCasa — Controle Financeiro Pessoal e Familiar

Sistema web para registrar receitas, despesas e comprovantes em poucos segundos, com saldo calculado automaticamente.

O projeto continua **local com SQLite** no dia a dia. A arquitetura já está preparada para, no futuro, apontar para um **PostgreSQL na nuvem** e ser acessado de vários computadores — sem reescrever o sistema.

## Requisitos

- Python 3.12+
- pip
- (opcional em produção) PostgreSQL e um proxy HTTPS (Caddy, Nginx, provedor)

## Instalação local

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # opcional; ajuste a SECRET_KEY
```

Linux/macOS: `./iniciar.sh`  
Windows: `iniciar.bat`

Abra [http://127.0.0.1:5000](http://127.0.0.1:5000).

**Primeiro acesso (somente desenvolvimento)**

- Usuário: `admin`
- Senha: `admin123`

Altere a senha em **Configurações**. Em produção, defina `ADMIN_SENHA` no ambiente; a senha padrão não é criada.

Para preencher o dashboard de teste: **Configurações → Inserir dados de demonstração** (não duplica).

## Configuração (`.env`)

O arquivo `.env` é só para o seu computador. No servidor, use variáveis de ambiente. Nunca commite senha, token ou `SECRET_KEY` real.

| Variável | Desenvolvimento | Produção |
|---|---|---|
| `FLASK_ENV` | `development` | `production` |
| `DEBUG` | `true` | `false` |
| `SECRET_KEY` | qualquer valor local | **obrigatória** e secreta |
| `DATABASE_URL` | SQLite (padrão) | PostgreSQL |
| `SERVER_URL` | `http://127.0.0.1:5000` | `https://seudominio` |
| `ADMIN_SENHA` | padrão local | obrigatória se ainda não houver admin |
| `SESSION_COOKIE_SECURE` | `false` | `true` (HTTPS) |
| `STORAGE_BACKEND` | `local` | `local` (nuvem de arquivos depois) |

Exemplo local (SQLite, o padrão):

```
FLASK_ENV=development
SECRET_KEY=uma-chave-local
```

Exemplo de produção (não rode isso no seu PC se quiser manter o SQLite):

```
FLASK_ENV=production
DEBUG=false
SECRET_KEY=...          # gerada por você, nunca no Git
DATABASE_URL=postgresql://usuario:senha@host:5432/fincasa
SERVER_URL=https://meusistema.com.br
ADMIN_SENHA=...
```

O código **não** grava senha do banco nem secret em arquivo de código.

## Banco de dados

- **Local:** SQLite em `instance/financeiro.db` (não vai para o Git).
- **Produção:** PostgreSQL via `DATABASE_URL`. O aplicativo é que fala com o banco; o navegador nunca conecta no PostgreSQL.

O SQLite **não é apagado** ao preparar a nuvem. Para copiar dados no futuro:

```bash
python scripts/backup.py
DATABASE_URL_DESTINO=postgresql://... python scripts/migrar_sqlite_para_postgres.py
# revise as contagens; só então:
DATABASE_URL_DESTINO=postgresql://... python scripts/migrar_sqlite_para_postgres.py --executar
```

A origem SQLite permanece. Não rode `--executar` sem backup e sem a sua autorização explícita em um banco importante.

## Backup e restauração

Pelo sistema (admin): **Configurações → Gerar backup agora**.

Pelo terminal:

```bash
python scripts/backup.py
```

Isso copia o SQLite (se estiver em uso) e a pasta de comprovantes para `backups/AAAAAMMDD-HHMMSS/`. O banco atual **não é apagado**.

PostgreSQL em produção:

```bash
pg_dump "$DATABASE_URL" -F c -f backups/financeiro.dump
pg_restore -d "$DATABASE_URL" backups/financeiro.dump
```

## Comprovantes

Arquivos em `uploads/comprovantes/{usuario_id}/{uuid}.ext`. O banco guarda a **chave relativa**, não um caminho `C:\...`. Lançamentos antigos com caminho absoluto continuam sendo lidos.

Formatos: JPG, PNG, WEBP, PDF. Tamanho máximo: 8 MB. Acesso só autenticado.

## Testes

```bash
source venv/bin/activate
pytest -q
```

## Execução em produção (quando você autorizar o deploy)

Ainda **não** publique sozinho. Quando for a hora, em um Linux com HTTPS na frente:

```bash
export FLASK_ENV=production
export SECRET_KEY=...
export DATABASE_URL=postgresql://...
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2
```

Provedores compatíveis (Render, Railway, Fly.io, VPS): use o `Procfile`. A escolha do provedor fica para depois.

## O que já funciona no produto

- Login com senha em hash (Werkzeug) e sessão
- Dashboard com totais reais e gráficos
- Lançamento rápido, contas, categorias, comprovantes
- Histórico, filtros, tema claro/escuro
- Contas a pagar/receber (atraso em vermelho)
- Recorrentes sem duplicar vencimento
- Isolamento: usuário comum só vê os próprios dados
- Backup local manual

## Arquitetura (hoje e amanhã)

```
Navegador  --HTTPS-->  Flask (FinCasa)  -->  SQLite (local)
                                        \->  PostgreSQL (produção, quando apontar DATABASE_URL)
                                        \->  arquivos de comprovantes
```

Vários PCs usam o **mesmo login no mesmo servidor**. Não crie um `.db` diferente em cada computador se a meta for sincronizar.
