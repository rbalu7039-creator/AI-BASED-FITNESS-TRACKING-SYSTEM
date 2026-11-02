import re
import secrets
from functools import wraps
from flask import Blueprint, request, jsonify, session, redirect, url_for
from models.user import UserModel
from models.goals import GoalsModel

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def ensure_csrf_token():
    """Ensure a cryptographic CSRF token exists in the current user session."""
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(24)
    return session["csrf_token"]


def verify_csrf():
    """Verify CSRF token on state-changing requests when session token is active."""
    if request.method in ("POST", "PUT", "DELETE"):
        expected = session.get("csrf_token")
        if not expected:
            return True
        provided = (
            request.headers.get("X-CSRF-Token")
            or (request.get_json(silent=True) or {}).get("csrf_token")
            or request.form.get("csrf_token")
        )
        # If request comes from a browser with X-CSRF-Token header, validate strictly
        if provided and not secrets.compare_digest(str(expected), str(provided)):
            return False
    return True


def login_required_api(f):
    """Decorator to protect JSON REST API endpoints."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "error": "Authentication required. Please log in."}), 401
        if not verify_csrf():
            return jsonify({"success": False, "error": "Invalid CSRF token. Please refresh the page."}), 403
        user = UserModel.find_by_id(user_id)
        if not user:
            session.clear()
            return jsonify({"success": False, "error": "User session invalid. Please log in again."}), 401
        return f(*args, **kwargs)
    return decorated


def login_required_page(f):
    """Decorator to protect HTML dashboard routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return redirect(url_for("login_page"))
        user = UserModel.find_by_id(user_id)
        if not user:
            session.clear()
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated


def validate_registration_payload(data, is_update=False):
    """Server-side validation for user registration and profile updates."""
    errors = []
    full_name = str(data.get("full_name", "")).strip()
    if len(full_name) < 2 or len(full_name) > 80:
        errors.append("Full name must be between 2 and 80 characters.")

    if not is_update:
        email = str(data.get("email", "")).strip().lower()
        if not EMAIL_REGEX.match(email):
            errors.append("Please enter a valid email address.")
        password = str(data.get("password", ""))
        if len(password) < 6:
            errors.append("Password must be at least 6 characters long.")

    try:
        age = int(data.get("age", 0))
        if age < 10 or age > 120:
            errors.append("Age must be between 10 and 120 years.")
    except (ValueError, TypeError):
        errors.append("Age must be a valid whole number.")

    gender = str(data.get("gender", "")).strip()
    if gender not in UserModel.VALID_GENDERS:
        errors.append(f"Gender must be one of: {', '.join(UserModel.VALID_GENDERS)}.")

    try:
        height = float(data.get("height", 0))
        if height < 50 or height > 280:
            errors.append("Height must be between 50 cm and 280 cm.")
    except (ValueError, TypeError):
        errors.append("Height must be a valid number in cm.")

    try:
        weight = float(data.get("weight", 0))
        if weight < 20 or weight > 350:
            errors.append("Weight must be between 20 kg and 350 kg.")
    except (ValueError, TypeError):
        errors.append("Weight must be a valid number in kg.")

    fitness_goal = str(data.get("fitness_goal", "")).strip()
    if fitness_goal not in UserModel.VALID_GOALS:
        errors.append(f"Fitness goal must be one of: {', '.join(UserModel.VALID_GOALS)}.")

    return errors


@auth_bp.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    errors = validate_registration_payload(data, is_update=False)
    if errors:
        return jsonify({"success": False, "error": errors[0], "errors": errors}), 400

    email = str(data["email"]).strip().lower()
    if UserModel.find_by_email(email):
        return (
            jsonify(
                {
                    "success": False,
                    "error": "An account with this email already exists. Please log in instead.",
                }
            ),
            409,
        )

    try:
        user_row = UserModel.create_user(
            full_name=data["full_name"],
            email=email,
            password=data["password"],
            age=data["age"],
            gender=data["gender"],
            height=data["height"],
            weight=data["weight"],
            fitness_goal=data["fitness_goal"],
        )
        session.permanent = True
        session["user_id"] = user_row["id"]
        session["user_name"] = user_row["full_name"]
        ensure_csrf_token()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Registration successful! Redirecting to your fitness dashboard...",
                    "user": UserModel.to_safe_dict(user_row),
                }
            ),
            201,
        )
    except Exception as exc:
        return jsonify({"success": False, "error": f"Failed to register user: {str(exc)}"}), 500


@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({"success": False, "error": "Please enter both email and password."}), 400

    user_row = UserModel.find_by_email(email)
    if not user_row or not UserModel.verify_password(user_row, password):
        return jsonify({"success": False, "error": "Invalid email or password. Please try again."}), 401

    session.permanent = True
    session["user_id"] = user_row["id"]
    session["user_name"] = user_row["full_name"]
    ensure_csrf_token()

    return (
        jsonify(
            {
                "success": True,
                "message": f"Welcome back, {user_row['full_name']}!",
                "user": UserModel.to_safe_dict(user_row),
            }
        ),
        200,
    )


@auth_bp.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True, "message": "You have been logged out safely."}), 200


@auth_bp.route("/api/profile", methods=["GET"])
@login_required_api
def api_get_profile():
    user_id = session["user_id"]
    user_row = UserModel.find_by_id(user_id)
    user_dict = UserModel.to_safe_dict(user_row)
    goals_dict = GoalsModel.get_user_goals(user_id)
    bmi_details = UserModel.calculate_bmi_details(user_dict["weight"], user_dict["height"])
    bmr_details = UserModel.calculate_bmr_details(
        user_dict["weight"], user_dict["height"], user_dict["age"], user_dict["gender"]
    )
    return (
        jsonify(
            {
                "success": True,
                "user": user_dict,
                "goals": goals_dict,
                "bmi_details": bmi_details,
                "bmr_details": bmr_details,
            }
        ),
        200,
    )


@auth_bp.route("/api/profile", methods=["PUT"])
@login_required_api
def api_update_profile():
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    errors = validate_registration_payload(data, is_update=True)
    if errors:
        return jsonify({"success": False, "error": errors[0], "errors": errors}), 400

    updated_row = UserModel.update_user(
        user_id=user_id,
        full_name=data["full_name"],
        age=data["age"],
        gender=data["gender"],
        height=data["height"],
        weight=data["weight"],
        fitness_goal=data["fitness_goal"],
    )
    session["user_name"] = updated_row["full_name"]
    return (
        jsonify(
            {
                "success": True,
                "message": "Profile updated successfully!",
                "user": UserModel.to_safe_dict(updated_row),
            }
        ),
        200,
    )
