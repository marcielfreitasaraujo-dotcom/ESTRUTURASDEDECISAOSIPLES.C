# AGENTS.md

## Cursor Cloud specific instructions

### Product
FinUP is a single Flask web app (personal/family finance). Local default DB is SQLite (`instance/financeiro.db`); no Redis/Postgres daemon is required for day-to-day development.

### Start / stop
- Activate venv and run: `source venv/bin/activate && python app.py` (or `./iniciar.sh`, which also refreshes deps).
- App listens on `http://127.0.0.1:5000` (`0.0.0.0:5000`). Health: `GET /api/saude`.
- Optional local config: copy `.env.example` → `.env` (already gitignored). Dev login: `admin` / `admin123` (see README).

### Lint / test / build
- No project linter (ruff/flake8/eslint) is configured.
- Tests: `source venv/bin/activate && pytest -q` (in-memory/temp SQLite via `tests/conftest.py`; do not point tests at the live `instance/` DB).
- Production-style serve is Gunicorn (`Procfile` / README); for Cloud Agent work prefer `python app.py` in development mode.

### Gotchas
- System package `python3.12-venv` must be present before `python3 -m venv venv` works on Ubuntu; the environment snapshot should already include it after initial setup.
- Use `./venv/bin/...` or `source venv/bin/activate` — do not rely on a global `pip`/`pytest` outside the venv.
- Uploads and SQLite live under `uploads/` and `instance/`; both are local and gitignored (except keep files).
