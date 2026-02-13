from flask import Flask
from application.database import db
from application.resources import api
from application.routes import bp
from datetime import datetime
from application.models import User, Subject, Chapter, Quiz, Question, Score, Role
from application.config import *
from flask_security import Security, SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash, check_password_hash
from application.celery_init import make_celery
from application import mail

def create_app():
    app = Flask(
    __name__,
    template_folder="../frontend/templates",  
    static_folder="../frontend/static"
    )
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    mail.init_app(app)
    app.register_blueprint(bp)
    api.init_app(app)

    app.config["CELERY_BROKER_URL"] = "redis://localhost:6379/0"
    app.config["CELERY_RESULT_BACKEND"] = "redis://localhost:6379/1"

    app.celery = make_celery(app)
    
    # from application.tasks import daily_reminder, monthly_report
    # daily_reminder.apply_async(),monthly_report.apply_async()

    # @app.teardown_appcontext
    # def shutdown_session(exception=None):
    #     db.session.remove()

    with app.app_context():
        db.create_all()

        datastore = SQLAlchemyUserDatastore(db, User, Role)
        app.security = Security(app, datastore) 

        if not app.security.datastore.find_role("admin"):
            app.security.datastore.create_role(name="admin", description="Administrator Role")
        if not app.security.datastore.find_role("user"):
            app.security.datastore.create_role(name="user", description="Regular User")
        
    return app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)