from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Categoria, Configuracao, Conta, ContaPagar, Movimentacao, Recorrencia, Usuario
from app.models.usuario import agora


CATEGORIAS_PADRAO = [
    ("Salário", "receita", False, "#059669", "wallet"),
    ("Vale", "receita", False, "#10b981", "banknote"),
    ("Vale-refeição", "receita", False, "#34d399", "utensils"),
    ("Extra", "receita", False, "#6ee7b7", "sparkles"),
    ("Venda", "receita", False, "#14b8a6", "tag"),
    ("Transferência recebida", "receita", False, "#2dd4bf", "arrow-down"),
    ("Outros (receita)", "receita", False, "#99f6e4", "plus"),
    ("Alimentação", "despesa", False, "#f97316", "utensils"),
    ("Transporte", "despesa", False, "#eab308", "car"),
    ("Combustível", "despesa", False, "#f59e0b", "fuel"),
    ("Moradia", "despesa", False, "#a855f7", "home"),
    ("Água", "despesa", False, "#38bdf8", "droplet"),
    ("Energia", "despesa", False, "#facc15", "zap"),
    ("Internet", "despesa", False, "#818cf8", "wifi"),
    ("Telefone", "despesa", False, "#60a5fa", "phone"),
    ("Faculdade", "despesa", False, "#c084fc", "graduation"),
    ("Saúde", "despesa", False, "#fb7185", "heart"),
    ("Lazer", "despesa", False, "#f472b6", "smile"),
    ("Assinaturas", "despesa", False, "#e879f9", "repeat"),
    ("Compras", "despesa", False, "#fb923c", "shopping"),
    ("Cartão", "despesa", False, "#f43f5e", "credit-card"),
    ("Aluguel", "despesa", False, "#d946ef", "building"),
    ("Suplemento", "despesa", False, "#84cc16", "dumbbell"),
    ("Veículo", "despesa", False, "#78716c", "car"),
    ("Outros (despesa)", "despesa", False, "#94a3b8", "more"),
    ("Investimentos", "investimento", True, "#7c3aed", "trending"),
    ("Empréstimo", "receita", False, "#10b981", "handshake"),
]


CONTAS_PADRAO = [
    ("Carteira", "carteira", Decimal("200.00")),
    ("Nubank", "conta_digital", Decimal("0.00")),
    ("Caixa", "banco", Decimal("0.00")),
    ("Mercado Pago", "conta_digital", Decimal("0.00")),
    ("Poupança", "poupanca", Decimal("0.00")),
]


def _cfg(chave: str) -> Configuracao | None:
    return Configuracao.query.filter_by(chave=chave).first()


def garantir_admin(app) -> Usuario:
    usuario = Usuario.query.filter_by(username=app.config["ADMIN_INICIAL_USUARIO"]).first()
    if usuario:
        return usuario
    usuario = Usuario(
        nome=app.config["ADMIN_INICIAL_NOME"],
        username=app.config["ADMIN_INICIAL_USUARIO"],
        perfil="admin",
        tema="claro",
        ativo=True,
    )
    usuario.definir_senha(app.config["ADMIN_INICIAL_SENHA"])
    db.session.add(usuario)
    db.session.flush()
    return usuario


def garantir_categorias() -> None:
    existentes = {c.nome for c in Categoria.query.filter_by(sistema=True).all()}
    for nome, tipo, investimento, cor, icone in CATEGORIAS_PADRAO:
        if nome in existentes:
            continue
        db.session.add(
            Categoria(
                nome=nome,
                tipo=tipo,
                eh_investimento=investimento,
                cor=cor,
                icone=icone,
                sistema=True,
                ativo=True,
            )
        )


def garantir_contas(usuario: Usuario) -> dict[str, Conta]:
    existentes = {c.nome: c for c in Conta.query.filter_by(usuario_id=usuario.id).all()}
    for nome, tipo, saldo in CONTAS_PADRAO:
        if nome in existentes:
            continue
        conta = Conta(
            usuario_id=usuario.id,
            nome=nome,
            tipo=tipo,
            saldo_inicial=saldo,
            ativo=True,
        )
        db.session.add(conta)
        db.session.flush()
        existentes[nome] = conta
    return existentes


def inicializar_sistema(app) -> None:
    garantir_admin(app)
    garantir_categorias()
    admin = Usuario.query.filter_by(perfil="admin").first()
    if admin:
        garantir_contas(admin)
    db.session.commit()


def _cat(nome: str) -> Categoria:
    return Categoria.query.filter_by(nome=nome).first()


def inserir_dados_demo(usuario: Usuario) -> bool:
    flag = _cfg("demo_carregada")
    criou = False
    if not (flag and flag.valor == "1"):
        contas = garantir_contas(usuario)
        garantir_categorias()
        db.session.flush()

        ano, mes = 2026, 8
        carteira = contas["Carteira"]
        nubank = contas["Nubank"]
        caixa = contas["Caixa"]
        mp = contas["Mercado Pago"]

        lancamentos = [
            (date(ano, mes, 1), "receita", "Salário", "Salário", Decimal("2500.00"), "transferencia", caixa),
            (date(ano, mes, 5), "receita", "Vale-refeição", "Vale-refeição", Decimal("300.00"), "outro", mp),
            (date(ano, mes, 15), "receita", "Vale", "Vale 15", Decimal("400.00"), "pix", nubank),
            (date(ano, mes, 3), "despesa", "Água", "Água", Decimal("82.40"), "debito", nubank),
            (date(ano, mes, 4), "despesa", "Energia", "Luz", Decimal("187.90"), "debito", nubank),
            (date(ano, mes, 6), "despesa", "Telefone", "Chip celular", Decimal("75.00"), "pix", nubank),
            (date(ano, mes, 6), "despesa", "Faculdade", "Faculdade", Decimal("129.00"), "pix", nubank),
            (date(ano, mes, 8), "investimento", "Investimentos", "XP Investimentos", Decimal("500.00"), "pix", caixa),
            (date(ano, mes, 8), "despesa", "Internet", "Internet", Decimal("99.90"), "debito", nubank),
            (date(ano, mes, 10), "despesa", "Alimentação", "Mercado", Decimal("312.50"), "debito", nubank),
            (date(ano, mes, 11), "despesa", "Alimentação", "Almoço", Decimal("28.00"), "dinheiro", carteira),
            (date(ano, mes, 12), "despesa", "Transporte", "Combustível", Decimal("50.00"), "dinheiro", carteira),
            (date(ano, mes, 12), "despesa", "Alimentação", "Lanche", Decimal("25.00"), "dinheiro", carteira),
            (date(ano, mes, 14), "despesa", "Transporte", "Combustível", Decimal("35.00"), "dinheiro", carteira),
            (date(ano, mes, 15), "despesa", "Veículo", "Bol. Honda", Decimal("326.25"), "pix", nubank),
            (date(ano, mes, 16), "despesa", "Suplemento", "Suplemento", Decimal("89.90"), "credito", nubank),
            (date(ano, mes, 18), "despesa", "Lazer", "Cinema", Decimal("48.00"), "dinheiro", carteira),
            (date(ano, mes, 20), "despesa", "Assinaturas", "Assinaturas", Decimal("55.90"), "credito", nubank),
            (date(ano, mes, 22), "despesa", "Compras", "Notebook (entrada)", Decimal("200.00"), "pix", caixa),
            (date(ano, mes, 25), "despesa", "Cartão", "Cartão Nubank", Decimal("440.01"), "debito", nubank),
            (date(ano, mes, 27), "despesa", "Alimentação", "Feira", Decimal("64.30"), "dinheiro", carteira),
            (date(ano, mes, 2), "receita", "Extra", "Extra", Decimal("100.00"), "pix", nubank),
        ]

        for data, tipo, cat_nome, desc, valor, forma, conta in lancamentos:
            categoria = _cat(cat_nome)
            db.session.add(
                Movimentacao(
                    usuario_id=usuario.id,
                    conta_id=conta.id,
                    categoria_id=categoria.id if categoria else None,
                    tipo=tipo,
                    descricao=desc,
                    valor=valor,
                    data=data,
                    forma_pagamento=forma,
                    criado_por=usuario.id,
                    ativo=True,
                )
            )

        if flag:
            flag.valor = "1"
            flag.atualizado_em = agora()
        else:
            db.session.add(Configuracao(chave="demo_carregada", valor="1"))
        db.session.commit()
        criou = True

    if inserir_vencimentos_demo(usuario):
        criou = True
    if inserir_recorrencias_demo(usuario):
        criou = True
    return criou


def inserir_vencimentos_demo(usuario: Usuario) -> bool:
    flag = _cfg("demo_vencimentos")
    if flag and flag.valor == "1":
        return False
    if ContaPagar.query.filter_by(usuario_id=usuario.id, ativo=True).count():
        if not flag:
            db.session.add(Configuracao(chave="demo_vencimentos", valor="1"))
            db.session.commit()
        return False

    contas = garantir_contas(usuario)
    garantir_categorias()
    db.session.flush()
    nubank = contas["Nubank"]
    caixa = contas["Caixa"]
    ano, mes = 2026, 8

    titulos = [
        ("pagar", "Chip celular", "Operadora", date(ano, mes, 6), Decimal("75.00"), "Telefone", nubank, "pago", date(ano, mes, 6)),
        ("pagar", "Faculdade", None, date(ano, mes, 6), Decimal("129.00"), "Faculdade", nubank, "pago", date(ano, mes, 6)),
        ("pagar", "XP Investimentos", "XP", date(ano, mes, 8), Decimal("500.00"), "Investimentos", caixa, "pago", date(ano, mes, 8)),
        ("pagar", "Bol. Honda", "Honda", date(ano, mes, 15), Decimal("326.25"), "Veículo", nubank, "pendente", None),
        ("pagar", "Cartão Nubank", "Nubank", date(ano, mes, 28), Decimal("440.01"), "Cartão", nubank, "pendente", None),
        ("pagar", "Internet", "Provedor", date(ano, mes, 5), Decimal("99.90"), "Internet", nubank, "pendente", None),
        ("receber", "Empréstimo para João", "João da Silva", date(ano, mes, 10), Decimal("150.00"), "Empréstimo", nubank, "pendente", None),
        ("receber", "Empréstimo para Maria", "Maria Souza", date(ano, mes, 20), Decimal("80.00"), "Empréstimo", caixa, "pendente", None),
    ]
    for tipo, desc, pessoa, venc, valor, cat_nome, conta, status, pago_em in titulos:
        categoria = _cat(cat_nome)
        titulo = ContaPagar(
            usuario_id=usuario.id,
            conta_id=conta.id,
            categoria_id=categoria.id if categoria else None,
            tipo=tipo,
            descricao=desc,
            pessoa=pessoa,
            valor=valor,
            vencimento=venc,
            status=status,
            data_pagamento=pago_em,
            valor_pago=valor if pago_em else None,
            pago_por=usuario.id if pago_em else None,
            ativo=True,
        )
        if pago_em:
            titulo.status = "pago" if tipo == "pagar" else "recebido"
        db.session.add(titulo)

    if flag:
        flag.valor = "1"
        flag.atualizado_em = agora()
    else:
        db.session.add(Configuracao(chave="demo_vencimentos", valor="1"))
    db.session.commit()
    return True


def inserir_recorrencias_demo(usuario: Usuario) -> bool:
    flag = _cfg("demo_recorrencias")
    if flag and flag.valor == "1":
        return False
    if Recorrencia.query.filter_by(usuario_id=usuario.id, ativo=True).count():
        if not flag:
            db.session.add(Configuracao(chave="demo_recorrencias", valor="1"))
            db.session.commit()
        return False

    contas = garantir_contas(usuario)
    garantir_categorias()
    db.session.flush()
    nubank = contas["Nubank"]

    itens = [
        ("Faculdade", Decimal("129.00"), 6, "Faculdade", nubank),
        ("Internet", Decimal("99.90"), 5, "Internet", nubank),
        ("Chip celular", Decimal("75.00"), 6, "Telefone", nubank),
    ]
    for desc, valor, dia, cat_nome, conta in itens:
        categoria = _cat(cat_nome)
        db.session.add(
            Recorrencia(
                usuario_id=usuario.id,
                conta_id=conta.id,
                categoria_id=categoria.id if categoria else None,
                tipo="pagar",
                descricao=desc,
                valor=valor,
                periodicidade="mensal",
                dia_vencimento=dia,
                ativo=True,
            )
        )
    db.session.flush()
    from app.services.recorrencias import gerar_titulos_recorrentes

    gerar_titulos_recorrentes(usuario.id)

    if flag:
        flag.valor = "1"
        flag.atualizado_em = agora()
    else:
        db.session.add(Configuracao(chave="demo_recorrencias", valor="1"))
    db.session.commit()
    return True
