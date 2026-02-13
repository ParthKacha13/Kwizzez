from .database import db, datetime
from flask import Blueprint, jsonify, request, render_template, current_app
from flask_security import hash_password,auth_required,current_user, roles_required,login_user, roles_accepted
import uuid
from werkzeug.security import check_password_hash,generate_password_hash
from .models import User, Chapter, Quiz, Question, Score, Subject, UserAnswer
from functools import wraps
from celery.result import AsyncResult
from application.tasks import export_user_csv
bp = Blueprint("api", __name__)
import json
from application.extensions import rd

@bp.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@bp.route('/api/admin/users', methods=['GET'])
@auth_required("token")  
@roles_required("admin")
def get_all_users():
    users = User.query.all()
    user_data = [{
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "qualification": user.qualification,
        "dob": user.dob.strftime('%Y-%m-%d'),
        "is_active": user.active
    } for user in users]
    return jsonify(user_data), 200

@bp.route('/api/home')
@auth_required('token')
@roles_accepted('user', 'admin')
def home_dashboard():
    user = current_user
    return jsonify({
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user.is_admin
    })

@bp.route('/api/register', methods=['POST'])
def create_user():
    data = request.get_json()

    # Check if email already exists
    if current_app.security.datastore.find_user(email=data["email"]):
        return jsonify({"message": "User with this email already exists!"}), 400

    # Check if username already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Username already taken!"}), 400

    # Create new user
    new_user = current_app.security.datastore.create_user(
        email=data["email"],
        username=data["username"],
        password=generate_password_hash(data["password"]),
        full_name=data["full_name"],
        qualification=data.get("qualification"),
        dob=datetime.strptime(data["dob"], "%Y-%m-%d").date(),
        fs_uniquifier=str(uuid.uuid4()),
        active=True,
        is_admin=False
    )

    current_app.security.datastore.add_role_to_user(new_user, "user")
    db.session.commit()

    return jsonify({
        "message": "User created successfully"
    }), 201

@bp.route('/api/login', methods=['POST'])
def user_login():
    data = request.get_json()
    email= data.get("email")
    password= data.get("password")
    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400
    user = current_app.security.datastore.find_user(email=email)

    if user:
        if check_password_hash(user.password,password):
            login_user(user)
            return jsonify({
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin,
                "auth-token": user.get_auth_token()
            }), 200
        else:
            return jsonify({
                "message": "Incorrect password"
            }), 400
    else:
        return jsonify({
            "message": "User not found"
        }), 404
    
@bp.route('/api/logout', methods=['POST'])
def user_logout():
    if current_user.is_authenticated:
        current_user.auth_token = None
        db.session.commit()
        return jsonify({
            "message": "Logged out successfully"
        }), 200
    else:
        return jsonify({
            "message": "User not authenticated"
        }), 401
    

@bp.route("/api/chapters/<int:chapter_id>/quizzes", methods=["POST"])
@auth_required('token')
def create_quiz(chapter_id):
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return {"message": "Chapter not found"}, 404

    data = request.get_json()
    if not data:
        return {"message": "Invalid data"}, 400

    date_of_quiz_str = data.get("date_of_quiz")
    time_duration = data.get("time_duration")
    remarks = data.get("remarks")

    if not date_of_quiz_str or not time_duration:
        return {"message": "Missing date_of_quiz or time_duration"}, 400

    try:
        date_of_quiz = datetime.strptime(date_of_quiz_str, "%Y-%m-%d").date()

        new_quiz = Quiz(
            chapter_id=chapter_id,
            date_of_quiz=date_of_quiz,
            time_duration=time_duration,
            remarks=remarks
        )

        db.session.add(new_quiz)
        db.session.commit()  

        return jsonify({
            "id": new_quiz.id,
            "date_of_quiz": new_quiz.date_of_quiz.isoformat() if new_quiz.date_of_quiz else None,
            "time_duration": new_quiz.time_duration,
            "remarks": new_quiz.remarks
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"ERROR: {str(e)}")
        return {"message": f"Database error: {str(e)}"}, 500

#CACHE
@bp.route("/api/chapters/<int:chapter_id>/quizzes", methods=["GET"])
@auth_required('token')
def get_chapter_quizzes(chapter_id):
    cache_key = f"quizzes-chapter-{chapter_id}"
    cached = rd.get(cache_key)
    if cached:
        print("🟢 Returned from Redis Cache")
        return jsonify(json.loads(cached)), 200
    print("🔴 Cache miss, querying database...")
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return {"message": "Chapter not found"}, 404

    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    result=[
        {
            "id": q.id,
            "date_of_quiz": q.date_of_quiz.isoformat() if q.date_of_quiz else None,
            "time_duration": q.time_duration,
            "remarks": q.remarks,
            "questions": [{
                "id": que.id,
                "statement": que.question_statement
            } for que in q.questions]
        } for q in quizzes
    ]
    rd.setex(cache_key, 3600, json.dumps(result)) 
    print("🔵 Cached in Redis")
    return jsonify(result), 200

@bp.route('/api/quizzes')
@auth_required('token')
def get_all_quizzes():
    quizzes = Quiz.query.all()
    result = []
    for q in quizzes:
        result.append({
            "id": q.id,
            "date_of_quiz": q.date_of_quiz.isoformat() if q.date_of_quiz else None,
            "time_duration": q.time_duration,
            "remarks": q.remarks,
            "chapter_id": q.chapter_id,
            "chapter": {
                "id": q.chapter.id,
                "name": q.chapter.name
            },
            "questions": [{
                "id": que.id,
                "question_statement": que.question_statement,
                "option1": que.option1,
                "option2": que.option2,
                "option3": que.option3,
                "option4": que.option4,
                "correct_option": que.correct_option
            } for que in q.questions]
        })
    return jsonify(result), 200


@bp.route("/api/submit_quiz", methods=["POST"])
@auth_required('token')  
def submit_quiz():
    user = current_user 

    data = request.json
    quiz_id = data.get("quiz_id")
    score = data.get("score")
    total_questions = data.get("total_questions")

    new_score = Score(
        user_id=user.id,
        quiz_id=quiz_id,
        score=score,
        total_questions=total_questions
    )
    db.session.add(new_score)
    db.session.commit()

    return jsonify({"message": "Score saved!"}), 200

@bp.route('/api/user/quiz-attempts-by-subject')
@auth_required('token')
def quiz_attempts_by_subject():
    from sqlalchemy import func
    results = (
        db.session.query(Subject.name, func.count(Score.id))
        .join(Quiz, Quiz.subject_id == Subject.id)
        .join(Score, Score.quiz_id == Quiz.id)
        .filter(Score.user_id == current_user.id)
        .group_by(Subject.name)
        .all()
    )

    data = { name: count for name, count in results }
    return jsonify(data)

@bp.route('/api/clear-cache')
@auth_required('token')
@roles_accepted('admin')
def clear_cache():
    rd.delete("cache-quizzes")
    return {"message": "Cache cleared"}

@bp.route('/api/quizzes/<int:quiz_id>')
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify(quiz.to_dict())

@bp.route('/api/admin/subject-top-scores')
@auth_required('token')
@roles_accepted('admin')
def subject_top_scores():
    from sqlalchemy import func
    quiz = Quiz.query.filter_by(id=Quiz.id, chapter_id=Chapter.id).first()
    results = (
        db.session.query(
            Subject.name,
            func.max(Score.total_scored).label("top_score")
        )
        .join(Chapter, Chapter.subject_id == Subject.id)
        .join(Quiz, Quiz.chapter_id == Chapter.id)
        .outerjoin(Score, Score.quiz_id == Quiz.id)
        .group_by(Subject.name)
        .all()
    )

    data = []
    for name, score in results:
        data.append({
            "subject": name,
            "top_score": score or 0 
        })

    return jsonify(data)


@bp.route('/api/admin/subject-user-attempts')
@auth_required('token')
@roles_accepted('admin')
def subject_user_attempts():
    from sqlalchemy import func
    results = (
        db.session.query(Subject.name, func.count(Score.id))
        .join(Chapter, Chapter.subject_id == Subject.id)
        .join(Quiz, Quiz.chapter_id == Chapter.id)
        .join(Score, Score.quiz_id == Quiz.id)
        .group_by(Subject.name)
        .all()
    )
    data = [{"subject": name, "attempt_count": count} for name, count in results]
    return jsonify(data)

@bp.route("/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>/questions")
@auth_required('token')
def get_quiz_questions(chapter_id, quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return {"message": "Quiz not found"}, 404

    questions = []
    for q in quiz.questions:
        questions.append({
            "id": q.id,
            "question_statement": q.question_statement,
            "option1": q.option1,
            "option2": q.option2,
            "option3": q.option3,
            "option4": q.option4,
            "correct_option": q.correct_option 
        })
        
    return jsonify(questions), 200


@bp.route('/api/export_quiz_csv')
@auth_required('token')
def export_quiz_csv():
    user_id = current_user.id
    export_user_csv.delay(user_id)
    return jsonify({"status": "Export started. Check your email soon!"})



@bp.route('/api/csv_result/<task_id>')
def csv_result(task_id):
    celery = current_app.extensions["celery"]
    result = AsyncResult(task_id, app=celery)
    return jsonify({
        "ready": result.ready(),
        "successful": result.successful(),
        "result": result.result if result.ready() else None
    })
