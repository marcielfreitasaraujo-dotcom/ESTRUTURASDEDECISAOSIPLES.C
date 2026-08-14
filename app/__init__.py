from flask import Flask, render_template
from flask_login import current_user

from config import Config
from app.extensions import csrf, db, login_manager
from app.models import Usuario
from app.utils.formatters import formatar_data, formatar_moeda, nome_mes, parse_moeda


def create_app(config_class=Config) -> Flask:
    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static",
    )
    app.config.from_object(config_class)

    app.config["UPLOAD_FOLDER"].mkdir(parents=True, exist_ok=True)
    app.config["BACKUP_FOLDER"].mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

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

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(movimentacoes_bp)
    app.register_blueprint(comprovantes_bp)
    app.register_blueprint(contas_bp)
    app.register_blueprint(categorias_bp)
    app.register_blueprint(configuracoes_bp)
    app.register_blueprint(pesquisa_bp)

    @app.context_processor
    def inject_globals():
        from app.models import Categoria, Conta, FORMAS_PAGAMENTO
        from datetime import date

        contas = []
        categorias = []
        if current_user.is_authenticated:
            contas = (
                Conta.query.filter_by(usuario_id=current_user.id, ativo=True)
                .order_by(Conta.nome)
                .all()
            )
            categorias = Categoria.query.filter_by(ativo=True).order_by(Categoria.nome).all()
        return {
            "contas_menu": contas,
            "categorias_menu": categorias,
            "formas_pagamento": FORMAS_PAGAMENTO,
            "hoje": date.today(),
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
        inicializar_sistema(app)

    return app
