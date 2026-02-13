from celery import shared_task
from application.models import User, Score, Quiz, Chapter, Subject
from application.utils import send_email
from flask import url_for
from datetime import datetime, date
from io import StringIO
import csv
from celery.utils.log import get_task_logger
logger = get_task_logger(__name__)

@shared_task(name="daily_reminder")
def daily_reminder():
    logger.info("Starting daily reminder task")
    today = date.today()
    quizzes_today = Quiz.query.filter(Quiz.date_of_quiz == today).count()
    users = User.query.all()

    for user in users:
        if user.is_admin:
            continue
        if quizzes_today > 0:
            body = (
                f"Hi {user.username},\n\n"
                f"You have {quizzes_today} quizzes scheduled for today.\n"
                f"Please login and complete them!\n\n"
                f"Thanks!"
            )
        else:
            body = (
                f"Hi {user.username},\n\n"
                f"You have no quizzes scheduled for today.\n"
                f"Enjoy your day!\n\n"
                f"Thanks!"
            )
        send_email(
            subject="Daily Quiz Reminder",
            recipients=[user.email],
            body=body
        )
    return "Daily reminders sent."
    
@shared_task(name="monthly_report")
def monthly_report():
    start_of_month = datetime.today().replace(day=1)
    users = User.query.filter(User.active == True).all()

    report_count = 0
    for user in users:
        if user.is_admin: 
            continue
        scores = (
            Score.query.join(Quiz).join(Chapter).join(Subject)
            .filter(Score.user_id == user.id,Quiz.date_of_quiz >= start_of_month).all())

        total_quizzes = len(scores)
        total_score = sum(s.total_scored or 0 for s in scores)
        average_score = total_score / total_quizzes if total_quizzes else 0

        body_html = f"""
        <h2>Hi {user.username},</h2>
        <p>Here is your performance summary for {start_of_month.strftime('%B %Y')}:</p>
        <ul>
            <li><b>Quizzes Taken:</b> {total_quizzes}</li>
            <li><b>Total Score:</b> {total_score}</li>
            <li><b>Average Score:</b> {average_score:.2f}</li>
        </ul>
        <p>Keep it up!</p>
        """

        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow([
            "Quiz ID",
            "Subject",
            "Chapter",
            "Date of Quiz",
            "Score",
            "Out Of",
            "Attempted On",
            "Remarks"
        ])
        for s in scores:
            quiz = s.quiz
            if not quiz:
                continue 
            chapter = quiz.chapter
            subject = chapter.subject
            total_questions = len(quiz.questions) if quiz.questions else 0
            writer.writerow([
                s.quiz_id,
                subject.name if subject else 'N/A',
                chapter.name if chapter else 'N/A',
                quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else 'N/A',
                s.total_scored or 0,
                total_questions,
                s.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S') if s.time_stamp_of_attempt else 'N/A',
                quiz.remarks or ''
            ])

        csv_bytes = csv_file.getvalue().encode('utf-8')

        send_email(
            subject=f"Monthly Performance Report - {start_of_month.strftime('%B %Y')}",
            recipients=[user.email],
            body=None,
            html=body_html,
            attachments=[("monthly_report.csv", "text/csv", csv_bytes)]
        )
        report_count += 1
    return f" Monthly reports sent for {report_count} users."

@shared_task(name="export_user_csv")
def export_user_csv(user_id):
    user = User.query.get(user_id)
    scores = Score.query.filter_by(user_id=user_id).all()

    csv_file = StringIO()
    writer = csv.writer(csv_file)
    writer.writerow(["Quiz ID", "Chapter ID", "Date", "Score", "Remarks"])
    for s in scores:
        writer.writerow([s.quiz_id, s.quiz.chapter_id, s.date_of_quiz, s.total_scored, s.remarks or ''])

    send_email(
        subject="Your Quiz Export",
        recipients=[user.email],
        body=f"Hi {user.username}, attached is your requested quiz export.",
        attachments=[("quiz_export.csv", "text/csv", csv_file.getvalue().encode('utf-8'))]
    )
    return "User CSV export sent."

