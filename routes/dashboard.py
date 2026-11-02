from datetime import datetime
from flask import Blueprint, request, jsonify, session
from routes.auth import login_required_api
from models.user import UserModel
from models.activity import ActivityModel
from models.goals import GoalsModel

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@login_required_api
def api_get_dashboard():
    user_id = session["user_id"]
    user_row = UserModel.find_by_id(user_id)
    user_dict = UserModel.to_safe_dict(user_row)
    goals_dict = GoalsModel.get_user_goals(user_id)

    today_str = datetime.now().strftime("%Y-%m-%d")
    rows = ActivityModel.list_activities(user_id, limit=14)
    activities = [ActivityModel.to_dict(r, goals_dict) for r in rows]

    # Find today's activity or most recent logged activity
    today_activities = [a for a in activities if a["activity_date"] == today_str]
    if today_activities:
        # Aggregate if multiple entries logged on the same day
        agg_steps = sum(a["steps"] for a in today_activities)
        agg_calories = round(sum(a["calories_burned"] for a in today_activities), 1)
        agg_duration = sum(a["workout_duration"] for a in today_activities)
        agg_water = round(sum(a["water_intake"] for a in today_activities), 2)
        agg_sleep = round(max(a["sleep_duration"] for a in today_activities), 1)
        latest_weight = today_activities[0]["weight"]
        primary_workout = today_activities[0]["workout_type"]
        active_day_label = "Today"
        active_record = {
            "activity_date": today_str,
            "weight": latest_weight,
            "steps": agg_steps,
            "calories_burned": agg_calories,
            "workout_duration": agg_duration,
            "workout_type": primary_workout,
            "water_intake": agg_water,
            "sleep_duration": agg_sleep,
        }
    elif activities:
        active_record = activities[0]
        active_day_label = f"Latest ({active_record['activity_date']})"
    else:
        active_record = {
            "activity_date": today_str,
            "weight": user_dict["weight"],
            "steps": 0,
            "calories_burned": 0.0,
            "workout_duration": 0,
            "workout_type": "None Logged",
            "water_intake": 0.0,
            "sleep_duration": 0.0,
        }
        active_day_label = "No Activity Yet"

    score_data = ActivityModel.compute_fitness_score(
        active_record if activities else None, goals_dict
    )

    step_goal = max(1, goals_dict["daily_step_goal"])
    cal_goal = max(1.0, goals_dict["daily_calorie_goal"])
    work_goal = max(1, goals_dict["daily_workout_goal"])

    steps_pct = min(100, int(round((active_record["steps"] / step_goal) * 100)))
    cal_pct = min(100, int(round((active_record["calories_burned"] / cal_goal) * 100)))
    work_pct = min(100, int(round((active_record["workout_duration"] / work_goal) * 100)))
    overall_goal_pct = int(round((steps_pct + cal_pct + work_pct) / 3.0))

    bmi_details = UserModel.calculate_bmi_details(
        active_record["weight"], user_dict["height"]
    )
    bmr_details = UserModel.calculate_bmr_details(
        active_record["weight"],
        user_dict["height"],
        user_dict["age"],
        user_dict["gender"],
    )

    # Last 7 days trend for mini dashboard chart
    trend_activities = list(reversed(activities[:7]))

    return (
        jsonify(
            {
                "success": True,
                "current_date": datetime.now().strftime("%A, %B %d, %Y"),
                "current_date_iso": today_str,
                "user": user_dict,
                "goals": goals_dict,
                "active_day_label": active_day_label,
                "summary": {
                    "current_weight": active_record["weight"],
                    "daily_steps": active_record["steps"],
                    "calories_burned": active_record["calories_burned"],
                    "workout_duration": active_record["workout_duration"],
                    "workout_type": active_record["workout_type"],
                    "water_intake": active_record["water_intake"],
                    "sleep_duration": active_record["sleep_duration"],
                    "bmi": bmi_details["bmi"],
                    "bmi_category": bmi_details["category"],
                    "fitness_score": score_data["score"],
                    "fitness_status": score_data["status"],
                    "score_breakdown": score_data["breakdown"],
                },
                "progress": {
                    "steps_percent": steps_pct,
                    "calories_percent": cal_pct,
                    "workout_percent": work_pct,
                    "daily_goal_completion": overall_goal_pct,
                },
                "bmi_details": bmi_details,
                "bmr_details": bmr_details,
                "recent_activities": activities[:5],
                "weekly_trend": trend_activities,
                "total_records": len(activities),
            }
        ),
        200,
    )


@dashboard_bp.route("/api/calculate-bmi", methods=["POST"])
@login_required_api
def api_calculate_bmi():
    data = request.get_json(silent=True) or {}
    try:
        weight = float(data.get("weight", 0))
        height = float(data.get("height", 0))
        if weight < 20 or weight > 350:
            return jsonify({"success": False, "error": "Weight must be between 20 kg and 350 kg."}), 400
        if height < 50 or height > 280:
            return jsonify({"success": False, "error": "Height must be between 50 cm and 280 cm."}), 400

        result = UserModel.calculate_bmi_details(weight, height)
        return jsonify({"success": True, "data": result}), 200
    except (ValueError, TypeError) as exc:
        return jsonify({"success": False, "error": f"Invalid BMI parameters: {str(exc)}"}), 400


@dashboard_bp.route("/api/calculate-bmr", methods=["POST"])
@login_required_api
def api_calculate_bmr():
    data = request.get_json(silent=True) or {}
    try:
        weight = float(data.get("weight", 0))
        height = float(data.get("height", 0))
        age = int(data.get("age", 0))
        gender = str(data.get("gender", "Male")).strip()
        activity_level = str(data.get("activity_level", "Moderately Active")).strip()

        if weight < 20 or weight > 350:
            return jsonify({"success": False, "error": "Weight must be between 20 kg and 350 kg."}), 400
        if height < 50 or height > 280:
            return jsonify({"success": False, "error": "Height must be between 50 cm and 280 cm."}), 400
        if age < 10 or age > 120:
            return jsonify({"success": False, "error": "Age must be between 10 and 120 years."}), 400

        result = UserModel.calculate_bmr_details(
            weight, height, age, gender, activity_level
        )
        return jsonify({"success": True, "data": result}), 200
    except (ValueError, TypeError) as exc:
        return jsonify({"success": False, "error": f"Invalid BMR parameters: {str(exc)}"}), 400


@dashboard_bp.route("/api/goals", methods=["GET"])
@login_required_api
def api_get_goals():
    user_id = session["user_id"]
    goals = GoalsModel.get_user_goals(user_id)
    return jsonify({"success": True, "goals": goals}), 200


@dashboard_bp.route("/api/goals", methods=["POST", "PUT"])
@login_required_api
def api_save_goals():
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    try:
        step_goal = int(data.get("daily_step_goal", 10000))
        cal_goal = float(data.get("daily_calorie_goal", 500))
        work_goal = int(data.get("daily_workout_goal", 45))

        if step_goal < 1000 or step_goal > 50000:
            return jsonify({"success": False, "error": "Daily step goal must be between 1,000 and 50,000."}), 400
        if cal_goal < 100 or cal_goal > 5000:
            return jsonify({"success": False, "error": "Daily active calorie goal must be between 100 and 5,000 kcal."}), 400
        if work_goal < 10 or work_goal > 360:
            return jsonify({"success": False, "error": "Daily workout duration goal must be between 10 and 360 minutes."}), 400

        updated = GoalsModel.upsert_user_goals(user_id, step_goal, cal_goal, work_goal)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Daily fitness goals updated successfully!",
                    "goals": updated,
                }
            ),
            200,
        )
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Please enter valid numeric goal values."}), 400
