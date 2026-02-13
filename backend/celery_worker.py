from app import create_app
from application.celery_init import make_celery
from celery import platforms

platforms.C_FORCE_ROOT = True

flask_app = create_app()

celery_app = make_celery(flask_app)

flask_app.celery = celery_app

from application.tasks import daily_reminder, monthly_report 

if __name__ == "__main__":
    print(" Registered tasks:", list(celery_app.tasks.keys()))
    print(" Beat schedule:", flask_app.config.get('CELERY_BEAT_SCHEDULE', {}))

    celery_app.start(argv=[
        'worker',
        '--loglevel=info',
        '--beat'
    ])
