import json
from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.auth import login_required_api
from models.user import UserModel
from models.activity import ActivityModel
from models.goals import GoalsModel
from ai.recommendation_engine import FitnessRecommendationEngine

recommendations_bp = Blueprint("recommendations", __name__)


@recommendations_bp.route("/api/ai/recommendations", methods=["GET"])
@login_required_api
def api_get_recommendations():
    """Retrieve the latest AI recommendation or auto-generate one from stored user data."""
    user_id = session["user_id"]
    db = get_db()

    history_rows = db.execute(
        """
        SELECT id, user_id, recommendation, recommendation_date, recommendation_type
        FROM AI_Recommendations
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 10
        """,
        (user_id,),
    ).fetchall()

    user_row = UserModel.find_by_id(user_id)
    user_dict = UserModel.to_safe_dict(user_row)
    goals_dict = GoalsModel.get_user_goals(user_id)
    activity_rows = ActivityModel.list_activities(user_id, limit=30)
    activities_list = [ActivityModel.to_dict(r, goals_dict) for r in activity_rows]

    if history_rows:
        try:
            latest_plan = json.loads(history_rows[0]["recommendation"])
        except Exception:
            latest_plan = FitnessRecommendationEngine.generate_recommendations(
                user_dict, activities_list, goals_dict
            )
    else:
        latest_plan = FitnessRecommendationEngine.generate_recommendations(
            user_dict, activities_list, goals_dict
        )
        # Store initial AI recommendation in database
        db.execute(
            """
            INSERT INTO AI_Recommendations (user_id, recommendation, recommendation_type)
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                json.dumps(latest_plan),
                latest_plan["model_info"]["regimen_archetype"],
            ),
        )
        db.commit()
        history_rows = db.execute(
            """
            SELECT id, user_id, recommendation, recommendation_date, recommendation_type
            FROM AI_Recommendations
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 10
            """,
            (user_id,),
        ).fetchall()

    history = []
    for r in history_rows:
        try:
            parsed = json.loads(r["recommendation"])
            summary_archetype = parsed.get("model_info", {}).get("regimen_archetype", r["recommendation_type"])
            step_t = parsed.get("recommendations", {}).get("daily_step_target", {}).get("steps", 10000)
            dur_t = parsed.get("recommendations", {}).get("suggested_workout_duration", {}).get("minutes_per_day", 45)
        except Exception:
            summary_archetype = r["recommendation_type"]
            step_t = 10000
            dur_t = 45

        history.append(
            {
                "id": r["id"],
                "recommendation_date": r["recommendation_date"],
                "recommendation_type": summary_archetype,
                "daily_steps_target": step_t,
                "workout_duration_target": dur_t,
            }
        )

    return (
        jsonify(
            {
                "success": True,
                "current_plan": latest_plan,
                "history": history,
            }
        ),
        200,
    )


@recommendations_bp.route("/api/ai/recommendations", methods=["POST"])
@login_required_api
def api_generate_recommendations():
    """Run the Scikit-learn & Rule-Based AI engine on user's stored data (with optional overrides) and save to DB."""
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}

    user_row = UserModel.find_by_id(user_id)
    user_dict = UserModel.to_safe_dict(user_row)
    goals_dict = GoalsModel.get_user_goals(user_id)
    activity_rows = ActivityModel.list_activities(user_id, limit=30)
    activities_list = [ActivityModel.to_dict(r, goals_dict) for r in activity_rows]

    custom_override = {}
    if "fitness_goal" in data and data["fitness_goal"] in UserModel.VALID_GOALS:
        custom_override["fitness_goal"] = data["fitness_goal"]
    if "weight" in data and data["weight"]:
        try:
            w = float(data["weight"])
            if 20 <= w <= 350:
                custom_override["weight"] = w
        except (ValueError, TypeError):
            pass
    if "daily_steps" in data and data["daily_steps"] != "":
        try:
            s = int(data["daily_steps"])
            if 0 <= s <= 100000:
                custom_override["daily_steps"] = s
        except (ValueError, TypeError):
            pass
    if "workout_duration" in data and data["workout_duration"] != "":
        try:
            d = int(data["workout_duration"])
            if 0 <= d <= 360:
                custom_override["workout_duration"] = d
        except (ValueError, TypeError):
            pass

    plan = FitnessRecommendationEngine.generate_recommendations(
        user_dict=user_dict,
        activities_list=activities_list,
        goals_dict=goals_dict,
        custom_override=custom_override if custom_override else None,
    )

    db = get_db()
    db.execute(
        """
        INSERT INTO AI_Recommendations (user_id, recommendation, recommendation_type)
        VALUES (?, ?, ?)
        """,
        (
            user_id,
            json.dumps(plan),
            plan["model_info"]["regimen_archetype"],
        ),
    )
    db.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "New personalized AI fitness plan generated!",
                "current_plan": plan,
            }
        ),
        200,
    )
