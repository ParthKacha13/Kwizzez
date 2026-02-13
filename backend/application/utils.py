def send_email(subject, recipients, body=None, html=None, attachments=None):
    from flask_mail import Message
    from flask import current_app
    from application import mail

    with current_app.app_context():
        msg = Message(
            subject,
            recipients=recipients,
            body=body,
            html=html,
            sender=current_app.config["MAIL_DEFAULT_SENDER"]
        )
        if attachments:
            for attachment in attachments:
                msg.attach(*attachment)
        mail.send(msg)