from celery.schedules import crontab
class Config:
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # recommended in prod

class LocalDevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///qm_v2.sqlite3?check_same_thread=False&timeout=20"

    SECRET_KEY = "quiz_master_v2_secret_key"
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = "this-is-a-password-salt"
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"

    CELERY_BROKER_URL = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND = "redis://localhost:6379/1"
    CELERY_TIMEZONE = "Asia/Kolkata"
    CELERY_ENABLE_UTC = False
    CELERY_BEAT_SCHEDULER = 'celery.beat.PersistentScheduler'
    CELERY_BEAT_SCHEDULE_FILENAME = '/tmp/celerybeat-schedule.db'

    MAIL_SERVER = 'localhost'
    MAIL_PORT = 1025
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_USERNAME = ''
    MAIL_PASSWORD = ''
    MAIL_DEFAULT_SENDER = 'quiz.adm01@gmail.com'

    CELERY_BEAT_SCHEDULE = {
        "daily-reminder-task": {
            "task": "application.tasks.daily_reminder",  # fully qualified task name
            "schedule": crontab(hour=3, minute=48),
        },
        "monthly-report-task": {
            "task": "application.tasks.monthly_report",  # fully qualified task name
            "schedule": crontab(hour=3, minute=48),
        },
    }
