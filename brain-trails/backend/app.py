"""
🎮 Brain Trails - Flask Backend
Cozy API Server for the gamified study app
"""

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend communication (Next.js on port 3000)
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])


# ============================================
# 🏥 Health & Status Routes
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify backend connectivity.
    Returns server status and timestamp.
    """
    return jsonify({
        "status": "Online",
        "message": "Backend connected!",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })


@app.route('/api', methods=['GET'])
def api_root():
    """
    API root endpoint with available routes info.
    """
    return jsonify({
        "name": "Brain Trails API",
        "description": "Cozy gamified study companion backend",
        "endpoints": {
            "health": "/api/health",
            "quests": "/api/quests (coming soon)",
            "traveler": "/api/traveler (coming soon)",
            "achievements": "/api/achievements (coming soon)"
        }
    })


# ============================================
# 🚀 Run Server
# ============================================

if __name__ == '__main__':
    print("🎮 Brain Trails Backend Starting...")
    print("📍 API available at: http://localhost:5000/api")
    print("🏥 Health check: http://localhost:5000/api/health")
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
