# FinCasa — Controle Financeiro Pessoal e Familiar

Sistema web para registrar receitas, despesas e comprovantes em poucos segundos, com saldo calculado automaticamente.

Esta entrega cobre a **Fase 1 (MVP)** e a **Fase 2 em andamento**: login, dashboard, movimentações, comprovantes, contas a pagar/receber e **contas recorrentes**. Relatórios, família, cartões, orçamento e PostgreSQL continuam para as próximas fases.

## Como executar

### Linux / macOS

```bash
chmod +x iniciar.sh
./iniciar.sh
```

### Windows

```bat
iniciar.bat
```

### Manual

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abra [http://127.0.0.1:5000](http://127.0.0.1:5000).

**Primeiro acesso**

- Usuário: `admin`
- Senha: `admin123`

Altere a senha em **Configurações** depois do primeiro login.

Para ver o dashboard preenchido, use **Configurações → Inserir dados de demonstração** (não duplica se já tiver sido carregado).

## O que já funciona

- Login com senha em hash (Werkzeug)
- Dashboard com totais reais, gráficos (Chart.js) e últimas movimentações
- Lançamento rápido (`+ Lançamento`) em modal, de qualquer tela
- Receita, despesa, investimento e transferência entre contas
- Saldo automático por conta (saldo inicial + entradas − saídas)
- Conferência da carteira (saldo esperado × saldo informado)
- Upload de comprovante (JPG, PNG, PDF, até 8 MB), vinculado ao lançamento
- Histórico com filtros de período, tipo, categoria, conta, forma e comprovante
- Pesquisa no topo
- Contas a pagar e a receber (empréstimos), com atraso em vermelho
- Contas recorrentes (faculdade, internet, aluguel) gerando o próximo vencimento sem duplicar
- Exclusão lógica (o lançamento some dos totais, mas permanece na auditoria)
- Tema claro e escuro
- Layout responsivo (menu compacto e botão `+` no celular)

## Testes

```bash
source venv/bin/activate
pytest -q
```

## Stack

Python 3 · Flask · SQLAlchemy · SQLite · HTML/CSS/JS · Chart.js · Pillow

O banco fica em `instance/financeiro.db`. Comprovantes em `uploads/comprovantes/` (acesso só autenticado).
