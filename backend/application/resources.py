from flask_restful import Api,Resource, reqparse
from .models import *
from flask_security import auth_required, current_user, roles_required,roles_accepted
from sqlalchemy.orm import joinedload
from flask import request
from application.extensions import rd

api=Api()

def roles_list(roles):
    role_list=[] 
    for role in roles:
        role_list.append(role.name)
    return role_list

subject_parser = reqparse.RequestParser()
subject_parser.add_argument('name', type=str, required=True, help="Name cannot be blank")
subject_parser.add_argument('description', required=False, help="Description is optional")

class SubjectListResource(Resource):
    @auth_required('token')
    @roles_accepted('user','admin')
    def get(self):
        subjects = Subject.query.all()
        if subjects:
            sub_json = [{
                "id": subject.id,
                "name": subject.name,
                "description": subject.description
            }for subject in subjects]
            return sub_json, 200
        else:
            return {
                "message": "No subjects found"
            }, 404
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        args = subject_parser.parse_args()
        if Subject.query.filter_by(name=args['name']).first():
            return {
                "message": "Subject with this name already exists"
            }, 400
        try:
            subject = Subject(name = args['name'],
                                description = args['description'])
            db.session.add(subject)
            db.session.commit()
            return {
                    "message": "Subject added successfully"
                }, 201
        except Exception as e:
            return {
                "message": f"Error adding subject: {str(e)}"
            }, 500
    @auth_required('token')
    @roles_required('admin')
    def put(self,sub_id):
        args = subject_parser.parse_args()
        sub = Subject.query.get(sub_id)
        if args['name'] == "":
            return {
                "message": "Name is required"
            },400
        if sub:
            sub.name = args['name']
            if args['description'] is not None and args['description'].strip() != "":
                sub.description = args['description']
            db.session.commit()
            return {
                "message": "Subject updated successfully"
            }, 200
        else:
            return {
                "message": "Subject not found"
            }, 404
    @auth_required('token')
    @roles_required('admin')
    def delete(self,sub_id):
        sub = Subject.query.get(sub_id)
        if sub:
            db.session.delete(sub)
            db.session.commit()
            return {
                "message": "Subject deleted successfully"
            }, 200
        else:
            return {
                "message": "Subject not found"
            }, 404

api.add_resource(SubjectListResource, '/api/subjects','/api/subjects/<int:sub_id>')   

chapter_parser = reqparse.RequestParser()
chapter_parser.add_argument('name', type=str, required=True, help="Name is required")
chapter_parser.add_argument('description', required=False, help="Description is optional")

class ChapterListResource(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self, subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        
        chapters = Chapter.query.options(joinedload(Chapter.questions)).filter_by(subject_id=subject_id).all()
        chapter_json = []
        for chapter in chapters:
            chapter_json.append({
                "id": chapter.id,
                "name": chapter.name,
                "description": chapter.description,
                "questions": [
                    {
                        "id": q.id,
                        "question_statement": q.question_statement
                    } for q in chapter.questions
                ]
            })
        return chapter_json, 200
    @auth_required('token')
    @roles_required('admin')
    def post(self, subject_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        args = chapter_parser.parse_args()
        if Chapter.query.filter_by(name=args['name'], subject_id=subject_id).first():
            return {"message": "Chapter with this name already exists in this subject"}, 400
        
        if Chapter.query.filter_by(name=args['name'], subject_id=subject_id).first():
            return {
                "message": "Chapter with this name already exists in this subject"
            }, 400
        try:
            new_chapter = Chapter(
                name=args['name'],
                description=args['description'],
                subject_id=subject_id
            )
            db.session.add(new_chapter)
            db.session.commit()
            return {"message": "Chapter added successfully"}, 201
        except Exception as e:
            return {"message": f"Error adding chapter: {str(e)}"}, 500

    @auth_required('token')
    @roles_required('admin')
    def put(self, subject_id, chapter_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        chapter = Chapter.query.filter_by(id=chapter_id, subject_id=subject_id).first()
        if not chapter:
            return {"message": "Chapter not found in the given subject"}, 404
        args = chapter_parser.parse_args()
        if not args['name'].strip():
            return {"message": "Name is required"}, 400
        chapter.name = args['name']
        if args['description'] is not None and args['description'].strip() != "":
            chapter.description = args['description']
        db.session.commit()
        return {"message": "Chapter updated successfully"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, subject_id, chapter_id):
        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404
        chapter = Chapter.query.filter_by(id=chapter_id, subject_id=subject_id).first()
        if not chapter:
            return {"message": "Chapter not found in the given subject"}, 404
        db.session.delete(chapter)
        db.session.commit()
        return {"message": "Chapter deleted successfully"}, 200

api.add_resource(
    ChapterListResource,
    '/api/subjects/<int:subject_id>/chapters',
    '/api/subjects/<int:subject_id>/chapters/<int:chapter_id>'
)

quiz_parser = reqparse.RequestParser()
quiz_parser.add_argument('date_of_quiz', required=True, help="Date is required. Format: YYYY-MM-DD")
quiz_parser.add_argument('time_duration', required=True, help="Time duration (HH:MM) required")
quiz_parser.add_argument('remarks', required=False)

quiz_update_parser = reqparse.RequestParser()
quiz_update_parser.add_argument('date_of_quiz', required=False)
quiz_update_parser.add_argument('time_duration', required=False)
quiz_update_parser.add_argument('remarks', required=False)

class QuizListResource(Resource):
    @auth_required('token')
    @roles_accepted('user','admin')
    def get(self, chapter_id, quiz_id=None):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404

        if quiz_id is not None:
            quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
            if not quiz:
                return {"message": "Quiz not found"}, 404
            return {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks
            }, 200
        

        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
        if quizzes:
            quiz_json = [{
                "id": quiz.id,
                "chapter_id": quiz.chapter_id, 
                "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks
            } for quiz in quizzes]
            return quiz_json, 200
        else:
            return {"message": "No quizzes found"}, 404
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404
        
        args = quiz_parser.parse_args()
        try:
            new_quiz = Quiz(chapter_id=chapter_id,
                            date_of_quiz=datetime.strptime(args['date_of_quiz'], "%Y-%m-%d").date(),
                            time_duration=args['time_duration'],
                            remarks=args['remarks'],
                            )
            db.session.add(new_quiz)
            db.session.commit()
            cache_key = f"quizzes-chapter-{chapter_id}"
            rd.delete(cache_key)
            print(f"🗑️ Cache key deleted: {cache_key}")
            return {
                    "message": "Quiz added successfully"
                }, 201
        
        except Exception as e:
            return {
                "message": f"Error adding quiz: {str(e)}"
            }, 500
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, chapter_id, quiz_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found in the given chapter"}, 404

        args = quiz_update_parser.parse_args()
        try:
            if args['time_duration'] is not None and args['time_duration'].strip() != "":
                quiz.time_duration = args['time_duration']
            if args['remarks'] is not None and args['remarks'].strip() != "":
                quiz.remarks = args['remarks']
            if args['date_of_quiz'] is not None and args['date_of_quiz'].strip() != "":
                quiz.date_of_quiz = datetime.strptime(args['date_of_quiz'], "%Y-%m-%d").date()
            db.session.commit()
            cache_key = f"quizzes-chapter-{chapter_id}"
            rd.delete(cache_key)
            print(f"🗑️ Cache key deleted: {cache_key}")
            return {"message": "Quiz updated successfully"}, 200
        except Exception as e:
            return {
                "message": f"Error updating quiz: {str(e)}"
            }, 500
    @auth_required('token')
    @roles_required('admin')
    def delete(self, chapter_id, quiz_id):
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        try:
            # Delete all related records in proper order
            UserAnswer.query.filter_by(quiz_id=quiz_id).delete()
            Score.query.filter_by(quiz_id=quiz_id).delete()
            Question.query.filter_by(quiz_id=quiz_id).delete()
            
            db.session.delete(quiz)
            db.session.commit()
            
            cache_key = f"quizzes-chapter-{chapter_id}"
            rd.delete(cache_key)
            print(f"🗑️ Cache key deleted: {cache_key}")
            return {"message": "Quiz deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": f"Error deleting quiz: {str(e)}"}, 500
        
        
api.add_resource(QuizListResource, '/api/chapters/<int:chapter_id>/quizzes', '/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>')

question_parser = reqparse.RequestParser()
question_parser.add_argument('question_statement', type=str, required=True, help="Question statement is required")
question_parser.add_argument('option1', type=str, required=True, help="Option 1 is required")
question_parser.add_argument('option2', type=str, required=True, help="Option 2 is required")
question_parser.add_argument('option3', type=str, required=True, help="Option 3 is required")
question_parser.add_argument('option4', type=str, required=True, help="Option 4 is required")
question_parser.add_argument('correct_option', type=int, required=True, help="Correct option (1-4) is required")

question_update_parser = reqparse.RequestParser()
question_update_parser.add_argument('question_statement', type=str, required=False)
question_update_parser.add_argument('option1', type=str, required=False)
question_update_parser.add_argument('option2', type=str, required=False)
question_update_parser.add_argument('option3', type=str, required=False)
question_update_parser.add_argument('option4', type=str, required=False)
question_update_parser.add_argument('correct_option', type=int, required=False)

class QuestionListResource(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self, chapter_id, quiz_id):
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        questions = quiz.questions
        if not questions:
            return {"message": "No questions found"}, 404

        is_admin = "admin" in [role.name for role in current_user.roles]
        return [{
            "id": q.id,
            "quiz_id": quiz_id,
            "chapter_id": chapter_id,
            "question_statement": q.question_statement,
            "option1": q.option1,
            "option2": q.option2,
            "option3": q.option3,
            "option4": q.option4,
            "correct_option": q.correct_option if is_admin else None
        } for q in questions], 200

    @auth_required('token')
    @roles_required('admin')
    def post(self, chapter_id, quiz_id):
        args = question_parser.parse_args()
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        if args['correct_option'] not in [1, 2, 3, 4]:
            return {"message": "Correct option must be between 1 and 4"}, 400

        if Question.query.filter_by(question_statement=args['question_statement'], quiz_id=quiz_id).first():
            return {"message": "Question already exists"}, 400

        new_q = Question(
            quiz_id=quiz_id,
            chapter_id=chapter_id,
            question_statement=args['question_statement'],
            option1=args['option1'],
            option2=args['option2'],
            option3=args['option3'],
            option4=args['option4'],
            correct_option=args['correct_option']
        )
        # rd.delete("cache-quizzes")
        db.session.add(new_q)
        db.session.commit()
        return {"message": "Question created", "id": new_q.id}, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, chapter_id, quiz_id, question_id):
        args = question_update_parser.parse_args()
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        q = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
        if not q:
            return {"message": "Question not found"}, 404

        if args['correct_option'] is not None and args['correct_option'] not in [1, 2, 3, 4]:
            return {"message": "Correct option must be 1-4"}, 400

        if args['question_statement']: q.question_statement = args['question_statement'].strip()
        if args['option1']: q.option1 = args['option1'].strip()
        if args['option2']: q.option2 = args['option2'].strip()
        if args['option3']: q.option3 = args['option3'].strip()
        if args['option4']: q.option4 = args['option4'].strip()
        if args['correct_option'] is not None: q.correct_option = args['correct_option']
        
        # rd.delete("cache-quizzes")
        db.session.commit()
        return {"message": "Updated"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, chapter_id, quiz_id, question_id):
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        q = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
        if not q:
            return {"message": "Question not found"}, 404

        # rd.delete("cache-quizzes")
        db.session.delete(q)
        db.session.commit()
        return {"message": "Deleted"}, 200
api.add_resource(
    QuestionListResource,
    '/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>/questions',
    '/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>/questions/<int:question_id>'
)

score_parser = reqparse.RequestParser()
score_parser.add_argument('total_scored', type=int, required=True, help="Total score is required")

class ScoreListResource(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self, quiz_id):
        scores = Score.query.filter_by(quiz_id=quiz_id).all()
        if not scores:
            return {"message": "No scores found"}, 404

        return [{
            "id": s.id,
            "user_id": s.user_id,
            "quiz_id": s.quiz_id,
            "score": s.total_scored,
            "attempted_on": s.time_stamp_of_attempt.strftime("%Y-%m-%d %H:%M:%S")
        } for s in scores], 200

    @auth_required('token')
    @roles_required('user')
    def post(self, chapter_id, quiz_id):
        data = request.get_json()
        user_answers = data.get("answers", [])

        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"message": "Quiz not found"}, 404

        questions = Question.query.filter_by(quiz_id=quiz.id).order_by(Question.id).all()
        if not questions:
            return {"message": "No questions found"}, 400

        if len(questions) != len(user_answers):
            return {"message": "Answers count mismatch"}, 400

        # ✅ Prevent duplicate attempt
        if Score.query.filter_by(user_id=current_user.id, quiz_id=quiz_id).first():
            return {"message": "You have already attempted this quiz"}, 400

        total_score = 0

        for idx, question in enumerate(questions):
            answer = user_answers[idx]
            if answer is not None:
                try:
                    if int(answer) == question.correct_option:
                        total_score += 1
                except ValueError:
                    continue  # Skip invalid

            # Save each answer
            user_answer = UserAnswer(
                user_id=current_user.id,
                quiz_id=quiz.id,
                question_id=question.id,
                selected_option=answer,
                time_stamp=datetime.utcnow()
            )
            db.session.add(user_answer)

        new_score = Score(
            user_id=current_user.id,
            quiz_id=quiz.id,
            total_scored=total_score,
            time_stamp_of_attempt=datetime.utcnow()
        )
        db.session.add(new_score)
        db.session.commit()

        return {"message": "Score saved", "score": total_score}, 201


api.add_resource(
    ScoreListResource,
    '/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>/score',
    '/api/quizzes/<int:quiz_id>/scores'
)

# ✅ Add a new Resource
class AllQuizzesResource(Resource):
    @auth_required('token')
    def get(self):
        quizzes = Quiz.query.all()
        output = []
        for quiz in quizzes:
            output.append({
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "date": quiz.date_of_quiz.strftime("%Y-%m-%d"),
                "duration": quiz.time_duration,
                "remarks": quiz.remarks,
                "subject_name": quiz.chapter.subject.name,
                "chapter_name": quiz.chapter.name,
                "questions": [
                    {
                        "id": q.id,
                        "statement": q.question_statement
                    } for q in quiz.questions
                ]
            })
        return output, 200

# ✅ Register new resource
api.add_resource(AllQuizzesResource, '/api/quizzes')


class UserScoreResource(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self):
        scores = Score.query.filter_by(user_id=current_user.id).all()
        output = []
        for score in scores:
            quiz = Quiz.query.get(score.quiz_id)
            chapter = quiz.chapter
            subject = chapter.subject
            output.append({
                "username": current_user.username,
                "quiz_id": quiz.id,
                "chapter": chapter.name,
                "subject": subject.name,
                "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d'),
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,    
                "total_scored": score.total_scored,
                "attempted_on": score.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S'),
                "total_questions": len(quiz.questions),
                "date_of_quiz": quiz.date_of_quiz.strftime('%Y-%m-%d'),
                "total_possible": len(quiz.questions)
            })
        return output, 200

api.add_resource(UserScoreResource, '/api/me/scores')

class AttemptDetailsResource(Resource):
    @auth_required('token')
    @roles_accepted('user', 'admin')
    def get(self, chapter_id, quiz_id):
        quiz = Quiz.query.filter_by(id=quiz_id, chapter_id=chapter_id).first()
        if not quiz:
            return {"error": "Quiz not found."}, 404

        questions = Question.query.filter_by(quiz_id=quiz.id).all()
        if not questions:
            return {"error": "No questions found for this quiz."}, 404

        user_answers = UserAnswer.query.filter_by(
            user_id=current_user.id,
            quiz_id=quiz.id
        ).all()

        answers_map = {ua.question_id: ua.selected_option for ua in user_answers}

        output = []
        for q in questions:
            output.append({
                "id": q.id,
                "question_statement": q.question_statement,
                "options": [q.option1, q.option2, q.option3, q.option4],
                "correct_option": q.correct_option,
                "user_selected": answers_map.get(q.id)
            })

        return output, 200


# Register:
api.add_resource(AttemptDetailsResource, '/api/chapters/<int:chapter_id>/quizzes/<int:quiz_id>/attempt-details')