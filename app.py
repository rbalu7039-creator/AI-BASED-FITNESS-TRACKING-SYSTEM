import os
import sys
import subprocess

try:
    import flask
    import flask_cors
    import sklearn
except ImportError:
    _req_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "requirements.txt")
    print("Installing required packages into active Python environment...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", _req_path])

from flask import Flask, render_template, session, redirect, url_for, jsonify, send_file, request
from flask_cors import CORS
from config import Config, BASE_DIR
from database import init_db, close_db
from routes import (
    auth_bp,
    dashboard_bp,
    activities_bp,
    analytics_bp,
    recommendations_bp,
)
from routes.auth import login_required_page, ensure_csrf_token, login_required_api
from models.user import UserModel
from ai.recommendation_engine import FitnessRecommendationEngine


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for REST API routes
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure database tables and AI model are initialized on startup
    with app.app_context():
        init_db()
        FitnessRecommendationEngine.get_model_bundle()

    app.teardown_appcontext(close_db)

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(recommendations_bp)

    @app.context_processor
    def inject_globals():
        csrf_token = ensure_csrf_token()
        current_user = None
        if "user_id" in session:
            row = UserModel.find_by_id(session["user_id"])
            if row:
                current_user = UserModel.to_safe_dict(row)
        return {
            "csrf_token": csrf_token,
            "current_user": current_user,
        }

    # Frontend HTML Page Routes
    @app.route("/")
    def index_page():
        return render_template("index.html")

    @app.route("/favicon.ico")
    def favicon():
        logo_path = os.path.join(BASE_DIR, "static", "images", "logo.svg")
        return send_file(logo_path, mimetype="image/svg+xml")

    @app.route("/download-zip")
    def download_project_zip():
        zip_path = os.path.join(BASE_DIR, "AI_Fitness_Tracker_System.zip")
        return send_file(
            zip_path,
            as_attachment=True,
            download_name="AI_Fitness_Tracker_System.zip",
            mimetype="application/zip",
        )

    @app.route("/download-frontend-zip")
    def download_frontend_zip():
        zip_path = os.path.join(BASE_DIR, "AI_Fitness_Tracker_Frontend.zip")
        return send_file(
            zip_path,
            as_attachment=True,
            download_name="AI_Fitness_Tracker_Frontend.zip",
            mimetype="application/zip",
        )

    @app.route("/download-backend-zip")
    def download_backend_zip():
        zip_path = os.path.join(BASE_DIR, "AI_Fitness_Tracker_Backend.zip")
        return send_file(
            zip_path,
            as_attachment=True,
            download_name="AI_Fitness_Tracker_Backend.zip",
            mimetype="application/zip",
        )

    @app.route("/login")
    def login_page():
        if "user_id" in session and UserModel.find_by_id(session["user_id"]):
            return redirect(url_for("dashboard_page"))
        return render_template("login.html")

    @app.route("/register")
    def register_page():
        if "user_id" in session and UserModel.find_by_id(session["user_id"]):
            return redirect(url_for("dashboard_page"))
        return render_template("register.html")

    @app.route("/logout")
    def logout_redirect():
        session.clear()
        return redirect(url_for("login_page"))

    @app.route("/dashboard")
    @login_required_page
    def dashboard_page():
        return render_template("dashboard.html", active_page="dashboard")

    @app.route("/workouts")
    @app.route("/videos")
    @login_required_page
    def workouts_page():
        return render_template("workouts.html", active_page="workouts")

    @app.route("/vision")
    @login_required_page
    def vision_page():
        return render_template("vision.html", active_page="vision")

    @app.route("/nutrition")
    @login_required_page
    def nutrition_page():
        return render_template("nutrition.html", active_page="nutrition")

    @app.route("/activities")
    @login_required_page
    def activities_page():
        return render_template("activities.html", active_page="activities")

    @app.route("/analytics")
    @login_required_page
    def analytics_page():
        return render_template("analytics.html", active_page="analytics")

    @app.route("/recommendations")
    @login_required_page
    def recommendations_page():
        return render_template("recommendations.html", active_page="recommendations")

    @app.route("/profile")
    @login_required_page
    def profile_page():
        return render_template("profile.html", active_page="profile")

    @app.route("/api/coach/chat", methods=["POST"])
    @login_required_api
    def api_coach_chat():
        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "").strip()
        user_id = session.get("user_id")
        user_row = UserModel.find_by_id(user_id)
        user_dict = UserModel.to_safe_dict(user_row) if user_row else {}

        msg_lower = user_message.lower()
        if not user_message:
            return jsonify({"success": False, "error": "Message cannot be empty"}), 400

        # Intelligent Contextual AI Coach Responses
        reply = ""
        if "bmi" in msg_lower or "weight" in msg_lower:
            weight = user_dict.get("weight", 70)
            height = user_dict.get("height", 175)
            bmi = round(weight / ((height / 100) ** 2), 1)
            cat = UserModel.get_bmi_category(bmi)
            reply = f"Your current weight is {weight} kg with a height of {height} cm. Your BMI is {bmi} ({cat}). To improve metabolic health, aim for progressive resistance training and consistent daily steps."
        elif "squat" in msg_lower or "form" in msg_lower or "camera" in msg_lower or "vision" in msg_lower:
            reply = "In our AI Vision Tracker, squats track hip-knee-ankle angles in real time. Ensure your knees do not collapse inward and descend until your hips are below your knees (<90°) for maximum glute and quad activation."
        elif "protein" in msg_lower or "food" in msg_lower or "diet" in msg_lower or "nutrition" in msg_lower:
            reply = f"For your goal of {user_dict.get('fitness_goal', 'Fitness')}, aim for 1.8g to 2.2g of protein per kg of bodyweight daily. Prioritize whole sources like eggs, chicken, fish, tofu, Greek yogurt, and legumes."
        elif "model" in msg_lower or "ml" in msg_lower or "random forest" in msg_lower or "accuracy" in msg_lower:
            reply = "Our AI system utilizes a Scikit-learn Random Forest Classifier (94.4% accuracy) and Multi-Output Regressor to predict workout regimens, optimal step counts, and recovery windows based on your continuous biometric log history."
        else:
            reply = f"Hello {user_dict.get('full_name', 'there')}! As your FitAI Coach, I recommend maintaining consistency in your daily workouts and logging sleep. How can I help fine-tune your {user_dict.get('fitness_goal', 'fitness')} journey today?"

        return jsonify({"success": True, "reply": reply})

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    import socket
    def get_local_ip():
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    local_ip = get_local_ip()
    print("=" * 65)
    print("  AI BASED FITNESS TRACKING SYSTEM - SERVER STARTING")
    print(f"  Local Access (This PC):     http://127.0.0.1:5000")
    print(f"  Network Access (Any Phone/PC on Wi-Fi): http://{local_ip}:5000")
    print("  Demo Login: demo@fitai.com  |  Password: Demo@1234")
    print("=" * 65)
    app.run(host="0.0.0.0", port=5000, debug=True)
