from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

MESES_PT = (
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
)


def parse_moeda(valor) -> Decimal:
    if valor is None or valor == "":
        return Decimal("0.00")
    if isinstance(valor, Decimal):
        return valor.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    texto = str(valor).strip()
    texto = texto.replace("R$", "").replace(" ", "")
    if "," in texto and "." in texto:
        if texto.rfind(",") > texto.rfind("."):
            texto = texto.replace(".", "").replace(",", ".")
        else:
            texto = texto.replace(",", "")
    elif "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def formatar_moeda(valor) -> str:
    numero = parse_moeda(valor)
    negativo = numero < 0
    numero = abs(numero)
    inteiro, frac = f"{numero:.2f}".split(".")
    grupos = []
    while inteiro:
        grupos.append(inteiro[-3:])
        inteiro = inteiro[:-3]
    corpo = ".".join(reversed(grupos))
    texto = f"R$ {corpo},{frac}"
    return f"- {texto}" if negativo else texto


def parse_data(texto, padrao=None):
    if not texto:
        return padrao or date.today()
    if isinstance(texto, date):
        return texto
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(texto, fmt).date()
        except ValueError:
            continue
    return padrao or date.today()


def formatar_data(valor) -> str:
    if not valor:
        return ""
    if isinstance(valor, datetime):
        valor = valor.date()
    return valor.strftime("%d/%m/%Y")


def nome_mes(ano: int, mes: int) -> str:
    return f"{MESES_PT[mes]} de {ano}"


def somar_meses(referencia: date, meses: int) -> date:
    mes0 = referencia.month - 1 + meses
    ano = referencia.year + mes0 // 12
    mes = mes0 % 12 + 1
    return date(ano, mes, 1)


def dia_seguro(ano: int, mes: int, dia: int) -> date:
    if mes == 12:
        ultimo = date(ano + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo = date(ano, mes + 1, 1) - timedelta(days=1)
    return date(ano, mes, min(max(dia, 1), ultimo.day))


def periodo_preset(chave: str, inicio_custom=None, fim_custom=None):
    hoje = date.today()
    if chave == "hoje":
        return hoje, hoje
    if chave == "ontem":
        ontem = hoje - timedelta(days=1)
        return ontem, ontem
    if chave == "esta_semana":
        inicio = hoje - timedelta(days=hoje.weekday())
        return inicio, hoje
    if chave == "semana_passada":
        inicio_esta = hoje - timedelta(days=hoje.weekday())
        fim = inicio_esta - timedelta(days=1)
        inicio = fim - timedelta(days=6)
        return inicio, fim
    if chave == "este_mes":
        inicio = date(hoje.year, hoje.month, 1)
        if hoje.month == 12:
            fim = date(hoje.year, 12, 31)
        else:
            fim = date(hoje.year, hoje.month + 1, 1) - timedelta(days=1)
        return inicio, fim
    if chave == "mes_passado":
        primeiro = date(hoje.year, hoje.month, 1)
        fim = primeiro - timedelta(days=1)
        return date(fim.year, fim.month, 1), fim
    if chave == "ultimos_30":
        return hoje - timedelta(days=29), hoje
    if chave == "personalizado":
        return parse_data(inicio_custom, date(hoje.year, hoje.month, 1)), parse_data(fim_custom, hoje)
    return date(hoje.year, hoje.month, 1), hoje
