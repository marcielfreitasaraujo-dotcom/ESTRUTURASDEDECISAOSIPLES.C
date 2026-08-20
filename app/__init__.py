import logging
import os
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session
from flask_login import current_user
from werkzeug.middleware.proxy_fix import ProxyFix

from config import get_config, opcoes_engine
from app.extensions import csrf, db, login_manager
from app.models import Usuario
from app.utils.formatters import formatar_data, formatar_moeda, nome_mes, parse_moeda

logger = logging.getLogger("finup")


def _configurar_log(app: Flask) -> None:
    if app.testing:
        return
    nivel = logging.DEBUG if app.debug else logging.INFO
    logging.basicConfig(
        level=nivel,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    uri = str(app.config.get("SQLALCHEMY_DATABASE_URI") or "")
    tipo_banco = "sqlite" if uri.startswith("sqlite") else "postgres" if "postgres" in uri else "outro"
    logger.info(
        "FinUP iniciado ambiente=%s debug=%s banco=%s",
        os.environ.get("FLASK_ENV")
        or os.environ.get("FINUP_ENV")
        or os.environ.get("FINCASA_ENV")
        or "development",
        app.debug,
        tipo_banco,
    )


def create_app(config_class=None) -> Flask:
    if config_class is None:
        config_class = get_config()

    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static",
    )
    app.config.from_object(config_class)
    app.config["UPLOAD_FOLDER"] = Path(app.config["UPLOAD_FOLDER"])
    app.config["BACKUP_FOLDER"] = Path(app.config["BACKUP_FOLDER"])
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = opcoes_engine(app.config["SQLALCHEMY_DATABASE_URI"])
    if hasattr(config_class, "init_app"):
        config_class.init_app(app)

    app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)
    app.config["BACKUP_FOLDER"].mkdir(parents=True, exist_ok=True)

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    _configurar_log(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(Usuario, int(user_id))

    app.jinja_env.filters["moeda"] = formatar_moeda
    app.jinja_env.filters["data_br"] = formatar_data
    app.jinja_env.globals["nome_mes"] = nome_mes
    app.jinja_env.globals["parse_moeda"] = parse_moeda

    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.movimentacoes import movimentacoes_bp
    from app.routes.comprovantes import comprovantes_bp
    from app.routes.contas import contas_bp
    from app.routes.categorias import categorias_bp
    from app.routes.configuracoes import configuracoes_bp
    from app.routes.pesquisa import pesquisa_bp
    from app.routes.vencimentos import vencimentos_bp
    from app.routes.recorrencias import recorrencias_bp
    from app.routes.relatorios import relatorios_bp
    from app.routes.cartoes import cartoes_bp
    from app.routes.orcamentos import orcamentos_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(movimentacoes_bp)
    app.register_blueprint(comprovantes_bp)
    app.register_blueprint(contas_bp)
    app.register_blueprint(categorias_bp)
    app.register_blueprint(configuracoes_bp)
    app.register_blueprint(pesquisa_bp)
    app.register_blueprint(vencimentos_bp)
    app.register_blueprint(recorrencias_bp)
    app.register_blueprint(relatorios_bp)
    app.register_blueprint(cartoes_bp)
    app.register_blueprint(orcamentos_bp)

    @app.after_request
    def registrar_requisicao(response):
        session.permanent = False
        nome_lembrar = app.config.get("REMEMBER_COOKIE_NAME", "remember_token")
        if request.cookies.get(nome_lembrar):
            response.delete_cookie(
                nome_lembrar,
                path=app.config.get("REMEMBER_COOKIE_PATH", "/"),
                secure=bool(app.config.get("REMEMBER_COOKIE_SECURE")),
                httponly=True,
                samesite=app.config.get("SESSION_COOKIE_SAMESITE", "Lax"),
            )
        if app.testing or request.endpoint in (None, "static"):
            return response
        logger.info("%s %s -> %s", request.method, request.path, response.status_code)
        return response

    @app.get("/api/saude")
    def saude():
        return jsonify(
            {
                "ok": True,
                "app": "finup",
                "ambiente": os.environ.get("FLASK_ENV")
                or os.environ.get("FINUP_ENV")
                or os.environ.get("FINCASA_ENV")
                or "development",
            }
        )

    @app.before_request
    def gerar_recorrentes_do_usuario():
        if not current_user.is_authenticated:
            return
        if request.endpoint in (
            None,
            "static",
            "auth.login",
            "auth.logout",
            "auth.sessao_iniciar",
            "auth.sessao_verificar",
            "auth.sessao_fechar",
            "saude",
        ):
            return
        from app.services.recorrencias import gerar_titulos_recorrentes
        from app.utils.casa import id_casa

        if gerar_titulos_recorrentes(id_casa()):
            db.session.commit()

    @app.context_processor
    def inject_globals():
        from app.models import Categoria, Conta, FORMAS_PAGAMENTO
        from datetime import date

        contas = []
        categorias = []
        qtd_atrasadas = 0
        titulos_atrasados = []
        if current_user.is_authenticated:
            from app.services.vencimentos import qtd_atrasadas as contar_atrasadas, query_titulos
            from app.utils.casa import id_casa

            uid = id_casa()
            contas = (
                Conta.query.filter_by(usuario_id=uid, ativo=True)
                .order_by(Conta.nome)
                .all()
            )
            categorias = Categoria.query.filter_by(ativo=True).order_by(Categoria.nome).all()
            qtd_atrasadas = contar_atrasadas(uid)
            titulos_atrasados = [
                t for t in query_titulos(uid).all() if t.status_atual() == "atrasado"
            ][:6]
        return {
            "contas_menu": contas,
            "categorias_menu": categorias,
            "formas_pagamento": FORMAS_PAGAMENTO,
            "hoje": date.today(),
            "qtd_atrasadas": qtd_atrasadas,
            "titulos_atrasados": titulos_atrasados,
        }

    @app.errorhandler(403)
    def forbidden(_e):
        return render_template("erros/403.html"), 403

    @app.errorhandler(404)
    def not_found(_e):
        return render_template("erros/404.html"), 404

    with app.app_context():
        from app import models  # noqa: F401
        from app.services.seed import inicializar_sistema

        db.create_all()
        from app.services.esquema import garantir_esquema

        garantir_esquema()
        inicializar_sistema(app)

    return app
