"""Vitrine do FinUP Design System (só admin). Não altera nenhum dado."""

from decimal import Decimal

from flask import Blueprint, render_template
from flask_login import login_required

from app.utils.decorators import admin_obrigatorio

design_bp = Blueprint("design", __name__)


@design_bp.route("/design-system")
@login_required
@admin_obrigatorio
def vitrine():
    # Valores fictícios, só para mostrar os componentes
    exemplos = [
        {"titulo": "Salário", "tipo": "Receita", "data": "05/11/2026", "valor": Decimal("3000.00"),
         "tom": "pos", "cat": "Salário", "cor": "#36C9A5", "conta": "Nubank", "status": ("Recebido", "pos")},
        {"titulo": "Mercado do mês", "tipo": "Despesa", "data": "06/11/2026", "valor": Decimal("485.90"),
         "tom": "neg", "cat": "Alimentação", "cor": "#E5AD45", "conta": "Cartão", "status": ("Pago", "pos")},
        {"titulo": "Conta de energia", "tipo": "Despesa", "data": "10/11/2026", "valor": Decimal("293.64"),
         "tom": "neg", "cat": "Moradia", "cor": "#5AA9E6", "conta": "Caixa", "status": ("Pendente", "warn")},
        {"titulo": "Internet", "tipo": "Despesa", "data": "02/11/2026", "valor": Decimal("99.90"),
         "tom": "neg", "cat": "Serviços", "cor": "#9B8CF2", "conta": "Nubank", "status": ("Atrasado", "neg")},
    ]
    orcamentos = [
        {"cat": "Alimentação", "cor": "#E5AD45", "gasto": Decimal("485.90"), "limite": Decimal("800"), "pct": 61},
        {"cat": "Transporte", "cor": "#5AA9E6", "gasto": Decimal("410.00"), "limite": Decimal("450"), "pct": 91},
        {"cat": "Lazer", "cor": "#E65D69", "gasto": Decimal("320.00"), "limite": Decimal("250"), "pct": 128},
    ]
    return render_template("design/vitrine.html", exemplos=exemplos, orcamentos=orcamentos)
