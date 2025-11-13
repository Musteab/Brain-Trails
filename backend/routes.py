from flask import jsonify, request, Blueprint
from flask_login import login_required, current_user
from extensions import db
from models import Flashcard, Quiz, Question, Note, StudySession, Deck, UserFlashcardProgress, Tag, note_tags, UserQuizResult, XPEvent, Badge, UserBadge, Streak, Challenge, UserChallenge, UserPreference, User
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os

bp = Blueprint('flashcards', __name__)

# Flashcard routes
@bp.route('/api/flashcards', methods=['GET'])
@login_required
def get_flashcards():
    flashcards = Flashcard.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': f.id,
        'front': f.front,
        'back': f.back,
        'last_reviewed': f.last_reviewed,
        'next_review': f.next_review
    } for f in flashcards]), 200

@bp.route('/api/flashcards', methods=['POST'])
@login_required
def create_flashcard():
    data = request.get_json()
    deck_id = data.get('deck_id')
    question = data.get('front')
    answer = data.get('back')
    if not deck_id or not question or not answer:
        return jsonify({'error': 'deck_id, front, and back are required'}), 400
    flashcard = Flashcard(
        question=question,
        answer=answer,
        deck_id=deck_id
    )
    db.session.add(flashcard)
    db.session.commit()
    return jsonify({'message': 'Flashcard created successfully', 'id': flashcard.id}), 201

# Quiz routes
@bp.route('/api/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    user_id = get_jwt_identity()
    quizzes = Quiz.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': q.id,
        'title': q.title,
        'created_at': q.created_at
    } for q in quizzes]), 200

@bp.route('/api/quizzes', methods=['POST'])
@jwt_required()
def create_quiz():
    user_id = get_jwt_identity()
    data = request.get_json()
    quiz = Quiz(user_id=user_id, title=data['title'])
    db.session.add(quiz)
    db.session.commit()
    return jsonify({'message': 'Quiz created successfully', 'id': quiz.id}), 201

@bp.route('/api/quizzes/<int:quiz_id>/questions', methods=['POST'])
@jwt_required()
def add_question(quiz_id):
    user_id = get_jwt_identity()
    quiz = Quiz.query.get_or_404(quiz_id)
    if quiz.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    question = Question(
        quiz_id=quiz_id,
        question_text=data['question_text'],
        correct_answer=data['correct_answer'],
        options=data.get('options')
    )
    db.session.add(question)
    db.session.commit()
    return jsonify({'message': 'Question added successfully', 'id': question.id}), 201

# Note routes
@bp.route('/api/notes', methods=['GET'])
@login_required
def get_notes():
    notes = Note.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'content': n.content,
        'summary': n.summary,
        'created_at': n.created_at,
        'updated_at': n.updated_at
    } for n in notes]), 200

@bp.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    data = request.get_json()
    note = Note(
        user_id=current_user.id,
        title=data['title'],
        content=data['content'],
        summary=data['summary']
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({'message': 'Note created successfully', 'id': note.id}), 201

# Study session routes
@bp.route('/api/study-sessions', methods=['GET'])
@login_required
def get_study_sessions():
    sessions = StudySession.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': s.id,
        'start_time': s.start_time,
        'end_time': s.end_time,
        'duration': s.duration,
        'focus_score': s.focus_score,
        'notes': s.notes
    } for s in sessions]), 200

@bp.route('/api/study-sessions', methods=['POST'])
@login_required
def create_study_session():
    data = request.get_json()
    session = StudySession(
        user_id=current_user.id,
        start_time=data['start_time'],
        end_time=data.get('end_time'),
        duration=data.get('duration'),
        focus_score=data.get('focus_score'),
        notes=data.get('notes')
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({'message': 'Study session created successfully', 'id': session.id}), 201

# Helper: SM-2 Algorithm
def update_sm2(progress, quality):
    # quality: 0-5 (0=Again, 3=Good, 5=Easy)
    if quality < 3:
        progress.repetitions = 0
        progress.interval = 1
    else:
        if progress.repetitions == 0:
            progress.interval = 1
        elif progress.repetitions == 1:
            progress.interval = 6
        else:
            progress.interval = int(progress.interval * progress.ease_factor)
        progress.repetitions += 1
    progress.ease_factor = max(1.3, progress.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    progress.last_reviewed = datetime.utcnow()
    progress.next_review = progress.last_reviewed + timedelta(days=progress.interval)
    db.session.commit()

# Deck endpoints
@bp.route('/api/decks', methods=['GET'])
@jwt_required()
def get_decks():
    user_id = get_jwt_identity()
    decks = Deck.query.filter_by(user_id=user_id).all()
    return jsonify([{'id': d.id, 'name': d.name} for d in decks])

@bp.route('/api/decks', methods=['POST'])
@jwt_required()
def create_deck():
    user_id = int(get_jwt_identity())
    data = request.json
    deck = Deck(name=data['name'], user_id=user_id)
    db.session.add(deck)
    db.session.commit()
    return jsonify({'id': deck.id, 'name': deck.name}), 201

# Flashcard endpoints
@bp.route('/api/decks/<int:deck_id>/flashcards', methods=['GET'])
@jwt_required()
def get_deck_flashcards(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    flashcards = Flashcard.query.filter_by(deck_id=deck.id).all()
    return jsonify([
        {'id': f.id, 'question': f.question, 'answer': f.answer} for f in flashcards
    ])

@bp.route('/api/decks/<int:deck_id>/flashcards', methods=['POST'])
@jwt_required()
def add_flashcard(deck_id):
    user_id = get_jwt_identity()
    deck = Deck.query.filter_by(id=deck_id, user_id=user_id).first_or_404()
    data = request.json
    flashcard = Flashcard(question=data['question'], answer=data['answer'], deck_id=deck.id)
    db.session.add(flashcard)
    db.session.commit()
    # Create progress for user
    progress = UserFlashcardProgress(user_id=user_id, flashcard_id=flashcard.id)
    db.session.add(progress)
    db.session.commit()
    return jsonify({'id': flashcard.id, 'question': flashcard.question, 'answer': flashcard.answer}), 201

# Get next card due for review (spaced repetition)
@bp.route('/api/flashcards/next', methods=['GET'])
@jwt_required()
def get_next_flashcard():
    user_id = get_jwt_identity()
    progress = UserFlashcardProgress.query.filter(
        UserFlashcardProgress.user_id == user_id,
        UserFlashcardProgress.next_review <= datetime.utcnow()
    ).order_by(UserFlashcardProgress.next_review.asc()).first()
    if not progress:
        return jsonify({'message': 'No cards due for review!'}), 404
    card = Flashcard.query.get(progress.flashcard_id)
    return jsonify({
        'id': card.id,
        'question': card.question,
        'answer': card.answer,
        'progress_id': progress.id,
        'interval': progress.interval,
        'ease_factor': progress.ease_factor,
        'repetitions': progress.repetitions
    })

# Submit review result
@bp.route('/api/flashcards/<int:flashcard_id>/review', methods=['POST'])
@jwt_required()
def review_flashcard(flashcard_id):
    user_id = get_jwt_identity()
    data = request.json
    quality = data.get('quality', 3)  # 0-5
    progress = UserFlashcardProgress.query.filter_by(user_id=user_id, flashcard_id=flashcard_id).first_or_404()
    update_sm2(progress, quality)
    return jsonify({'message': 'Progress updated.'})

# Delete flashcard
@bp.route('/api/flashcards/<int:flashcard_id>', methods=['DELETE'])
@jwt_required()
def delete_flashcard(flashcard_id):
    user_id = get_jwt_identity()
    # First get the flashcard to check ownership through the deck
    flashcard = Flashcard.query.get_or_404(flashcard_id)
    deck = Deck.query.get_or_404(flashcard.deck_id)
    
    # Check if the user owns the deck
    if deck.user_id != int(user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete associated progress records first
    UserFlashcardProgress.query.filter_by(flashcard_id=flashcard_id).delete()
    
    # Delete the flashcard
    db.session.delete(flashcard)
    db.session.commit()
    
    return jsonify({'message': 'Flashcard deleted successfully'}), 200

# --- Study Timers & Pomodoro ---
@bp.route('/api/study-sessions/start', methods=['POST'])
@jwt_required()
def start_study_session():
    # Start a new study session
    return jsonify({'message': 'Study session started'}), 201

@bp.route('/api/study-sessions/end', methods=['POST'])
@jwt_required()
def end_study_session():
    # End the current study session
    return jsonify({'message': 'Study session ended'}), 200

@bp.route('/api/study-sessions/stats', methods=['GET'])
@jwt_required()
def study_session_stats():
    # Return stats for the user's study sessions
    return jsonify({'total_sessions': 0, 'total_minutes': 0}), 200

# --- Interactive Notes Section ---
@bp.route('/api/notes', methods=['GET', 'POST'])
@jwt_required()
def notes():
    if request.method == 'GET':
        # Return all notes for user
        return jsonify([]), 200
    elif request.method == 'POST':
        # Create a new note
        return jsonify({'message': 'Note created'}), 201

@bp.route('/api/notes/<int:note_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def note_detail(note_id):
    if request.method == 'GET':
        # Return note detail
        return jsonify({}), 200
    elif request.method == 'PUT':
        # Update note
        return jsonify({'message': 'Note updated'}), 200
    elif request.method == 'DELETE':
        # Delete note
        return jsonify({'message': 'Note deleted'}), 200

@bp.route('/api/notes/<int:note_id>/tags', methods=['POST'])
@jwt_required()
def add_tag_to_note(note_id):
    # Add a tag to a note
    return jsonify({'message': 'Tag added'}), 200

@bp.route('/api/notes/<int:note_id>/highlight', methods=['POST'])
@jwt_required()
def highlight_note(note_id):
    # Add a highlight to a note
    return jsonify({'message': 'Highlight added'}), 200

# --- Quizzes & Practice Tests ---
@bp.route('/api/quizzes', methods=['GET', 'POST'])
@jwt_required()
def quizzes():
    if request.method == 'GET':
        # Return all quizzes for user
        return jsonify([]), 200
    elif request.method == 'POST':
        # Create a new quiz
        return jsonify({'message': 'Quiz created'}), 201

@bp.route('/api/quizzes/<int:quiz_id>/questions', methods=['GET', 'POST'])
@jwt_required()
def quiz_questions(quiz_id):
    if request.method == 'GET':
        # Return all questions for quiz
        return jsonify([]), 200
    elif request.method == 'POST':
        # Add a question to quiz
        return jsonify({'message': 'Question added'}), 201

@bp.route('/api/quizzes/<int:quiz_id>/start', methods=['POST'])
@jwt_required()
def start_quiz(quiz_id):
    # Start a quiz session
    return jsonify({'message': 'Quiz started'}), 200

@bp.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    # Submit answers for a quiz
    return jsonify({'message': 'Quiz submitted'}), 200

@bp.route('/api/quizzes/<int:quiz_id>/results', methods=['GET'])
@jwt_required()
def quiz_results(quiz_id):
    # Get results for a quiz
    return jsonify({'score': 0, 'answers': {}}), 200

# --- Gamification ---
@bp.route('/api/xp', methods=['POST'])
@jwt_required()
def award_xp():
    # Award XP to user
    return jsonify({'message': 'XP awarded'}), 200

@bp.route('/api/streak', methods=['GET'])
@jwt_required()
def get_streak():
    # Get user's streak
    return jsonify({'current_streak': 0, 'longest_streak': 0}), 200

@bp.route('/api/badges', methods=['GET'])
@jwt_required()
def get_badges():
    # Get user's badges
    return jsonify([]), 200

@bp.route('/api/leaderboard', methods=['GET'])
@jwt_required()
def leaderboard():
    # Get leaderboard
    return jsonify([]), 200

# --- Daily Challenges ---
@bp.route('/api/challenges/today', methods=['GET'])
@jwt_required()
def todays_challenges():
    # Get today's challenges
    return jsonify([]), 200

@bp.route('/api/challenges/<int:challenge_id>/complete', methods=['POST'])
@jwt_required()
def complete_challenge(challenge_id):
    # Mark challenge as complete
    return jsonify({'message': 'Challenge completed'}), 200

# --- Study Mood & Theme Customizer ---
@bp.route('/api/preferences', methods=['GET', 'POST'])
@jwt_required()
def user_preferences():
    if request.method == 'GET':
        # Get user preferences
        return jsonify({'theme': 'light', 'music': None}), 200
    elif request.method == 'POST':
        # Set user preferences
        return jsonify({'message': 'Preferences updated'}), 200

@bp.route('/api/flashcards/<int:flashcard_id>', methods=['PUT'])
@jwt_required()
def update_flashcard(flashcard_id):
    user_id = get_jwt_identity()
    # First get the flashcard to check ownership through the deck
    flashcard = Flashcard.query.get_or_404(flashcard_id)
    deck = Deck.query.get_or_404(flashcard.deck_id)
    
    # Check if the user owns the deck
    if deck.user_id != int(user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    if 'question' in data:
        flashcard.question = data['question']
    if 'answer' in data:
        flashcard.answer = data['answer']
    
    db.session.commit()
    return jsonify({
        'id': flashcard.id,
        'question': flashcard.question,
        'answer': flashcard.answer
    }), 200

@bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({
        'username': user.username,
        'email': user.email,
        'display_name': getattr(user, 'display_name', user.username),
        'bio': getattr(user, 'bio', ''),
        'theme': getattr(user, 'theme', 'default'),
        'avatar_url': getattr(user, 'avatar_url', '')
    })

@bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.json
    user.display_name = data.get('display_name', user.display_name if hasattr(user, 'display_name') else user.username)
    user.bio = data.get('bio', getattr(user, 'bio', ''))
    user.theme = data.get('theme', getattr(user, 'theme', 'default'))
    user.avatar_url = data.get('avatar_url', getattr(user, 'avatar_url', ''))
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'})

@bp.route('/api/generate-quiz-from-notes', methods=['POST'])
@jwt_required()
def generate_quiz_from_notes():
    user_id = get_jwt_identity()
    data = request.json
    name = data.get('name')
    notes = data.get('notes')
    num_questions = data.get('num_questions', 5)
    time_limit = data.get('time_limit', 60)
    if not notes:
        return jsonify({'error': 'Notes are required'}), 400
    if not name:
        return jsonify({'error': 'Quiz name is required'}), 400

    api_key = os.getenv('OPENROUTER_API_KEY')
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "BrainTrails"
    }
    prompt = (
        f"Based on the following notes, generate {num_questions} multiple-choice questions. "
        f"For each question, provide: question, options (list of 4), and correct_answer. "
        f"Respond ONLY with a valid JSON array of objects, no explanation or extra text. Notes: {notes}"
    )
    data = {
        "model": "qwen/qwen3-4b:free",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that generates multiple-choice quiz questions from notes."},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
    print('OpenRouter response:', response.status_code, response.text)
    if response.status_code != 200:
        return jsonify({'error': f"OpenRouter error: {response.text}"}), 500

    try:
        content = response.json()["choices"][0]["message"]["content"]
        import json
        questions = json.loads(content)
    except Exception as e:
        return jsonify({'error': 'Failed to parse OpenRouter output', 'details': str(e), 'raw': response.text}), 500

    # Save quiz and questions to DB
    from models import Quiz, Question, db
    quiz = Quiz(user_id=user_id, title=name, time_limit=time_limit)
    db.session.add(quiz)
    db.session.commit()
    for q in questions:
        question = Question(
            quiz_id=quiz.id,
            question_text=q['question'],
            correct_answer=q['correct_answer'],
            options=q['options']
        )
        db.session.add(question)
    db.session.commit()

    return jsonify({'quiz_id': quiz.id, 'questions': questions}), 201 