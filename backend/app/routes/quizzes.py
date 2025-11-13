from typing import Dict, List, Tuple

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..ai.quiz import generate_quiz_items
from ..extensions import db
from ..models import Question, Quiz, UserQuizResult

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/quizzes")


@quizzes_bp.route("", methods=["GET"])
@jwt_required()
def list_quizzes():
    user_id = int(get_jwt_identity())
    quizzes = Quiz.query.filter_by(user_id=user_id).order_by(Quiz.created_at.desc()).all()
    return jsonify([quiz.to_dict() for quiz in quizzes])


@quizzes_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_quiz():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    notes = (payload.get("notes") or "").strip()
    title = (payload.get("title") or "Smart Quiz").strip()
    num_questions = int(payload.get("num_questions", 5))
    time_limit = int(payload.get("time_limit", 120))
    if not notes:
        return jsonify({"error": "notes are required"}), 400

    questions = generate_quiz_items(notes, num_questions=num_questions)
    if not questions:
        return jsonify({"error": "Unable to generate quiz questions"}), 500

    quiz = Quiz(user_id=user_id, title=title, time_limit=time_limit)
    db.session.add(quiz)
    db.session.flush()
    for q in questions:
        question = Question(
            quiz_id=quiz.id,
            question_text=q["question"],
            correct_answer=q["correct_answer"],
            options=q["options"],
            explanation=q.get("explanation"),
        )
        db.session.add(question)
    db.session.commit()

    return jsonify({"quiz": quiz.to_dict(include_questions=True)}), 201


@quizzes_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def quiz_detail(quiz_id: int):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first_or_404()
    return jsonify(quiz.to_dict(include_questions=True))


@quizzes_bp.route("/<int:quiz_id>/questions", methods=["GET"])
@jwt_required()
def quiz_questions(quiz_id: int):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first_or_404()
    return jsonify(
        {
            "quiz": quiz.to_dict(),
            "questions": [question.to_dict() for question in quiz.questions],
        }
    )


@quizzes_bp.route("/<int:quiz_id>/attempts", methods=["POST"])
@jwt_required()
def submit_quiz(quiz_id: int):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first_or_404()
    payload = request.get_json() or {}
    answers = payload.get("answers", [])

    score, breakdown = _score_quiz(quiz, answers)

    result = UserQuizResult(
        user_id=user_id,
        quiz_id=quiz.id,
        score=score,
        answers=breakdown,
        duration_seconds=payload.get("duration_seconds", 0),
    )
    db.session.add(result)
    db.session.commit()

    return jsonify({"score": score, "breakdown": breakdown})


@quizzes_bp.route("/<int:quiz_id>", methods=["DELETE"])
@jwt_required()
def delete_quiz(quiz_id: int):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.filter_by(id=quiz_id, user_id=user_id).first_or_404()
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted"})


def _score_quiz(quiz: Quiz, answers: List[Dict]) -> Tuple[float, List[Dict]]:
    correct = 0
    breakdown = []
    answer_map = {item.get("question_id"): item.get("answer") for item in answers}
    for question in quiz.questions:
        submitted = answer_map.get(question.id)
        is_correct = submitted is not None and str(submitted).strip().lower() == str(
            question.correct_answer
        ).strip().lower()
        if is_correct:
            correct += 1
        breakdown.append(
            {
                "question_id": question.id,
                "submitted": submitted,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
            }
        )
    total = len(quiz.questions) or 1
    score = round((correct / total) * 100, 2)
    return score, breakdown
