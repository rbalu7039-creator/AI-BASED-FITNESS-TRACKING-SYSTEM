from datetime import datetime
from flask import Blueprint, request, jsonify, session
from routes.auth import login_required_api
from models.activity import ActivityModel
from models.goals import GoalsModel
from models.user import UserModel

activities_bp = Blueprint("activities", __name__)


def validate_activity_payload(data):
    errors = []
    activity_date = str(data.get("activity_date", "")).strip()
    try:
        datetime.strptime(activity_date, "%Y-%m-%d")
    except ValueError:
        errors.append("Please provide a valid date in YYYY-MM-DD format.")

    try:
        weight = float(data.get("weight", 0))
        if weight < 20 or weight > 350:
            errors.append("Weight must be between 20 kg and 350 kg.")
    except (ValueError, TypeError):
        errors.append("Weight must be a valid number.")

    try:
        steps = int(data.get("steps", 0))
        if steps < 0 or steps > 100000:
            errors.append("Steps must be between 0 and 100,000.")
    except (ValueError, TypeError):
        errors.append("Steps must be a valid integer.")

    try:
        calories_burned = float(data.get("calories_burned", 0))
        if calories_burned < 0 or calories_burned > 10000:
            errors.append("Calories burned must be between 0 and 10,000 kcal.")
    except (ValueError, TypeError):
        errors.append("Calories burned must be a valid number.")

    try:
        workout_duration = int(data.get("workout_duration", 0))
        if workout_duration < 0 or workout_duration > 600:
            errors.append("Workout duration must be between 0 and 600 minutes.")
    except (ValueError, TypeError):
        errors.append("Workout duration must be a valid integer in minutes.")

    workout_type = str(data.get("workout_type", "")).strip()
    if workout_type not in ActivityModel.VALID_WORKOUT_TYPES:
        errors.append(
            f"Workout type must be one of: {', '.join(ActivityModel.VALID_WORKOUT_TYPES)}."
        )

    try:
        water_intake = float(data.get("water_intake", 0))
        if water_intake < 0 or water_intake > 15:
            errors.append("Water intake must be between 0 and 15 liters.")
    except (ValueError, TypeError):
        errors.append("Water intake must be a valid number in liters.")

    try:
        sleep_duration = float(data.get("sleep_duration", 0))
        if sleep_duration < 0 or sleep_duration > 24:
            errors.append("Sleep duration must be between 0 and 24 hours.")
    except (ValueError, TypeError):
        errors.append("Sleep duration must be a valid number in hours.")

    return errors


@activities_bp.route("/api/activities", methods=["GET"])
@login_required_api
def api_get_activities():
    user_id = session["user_id"]
    search_date = request.args.get("date", "").strip() or None
    workout_type = request.args.get("workout_type", "").strip() or None
    start_date = request.args.get("start_date", "").strip() or None
    end_date = request.args.get("end_date", "").strip() or None

    goals = GoalsModel.get_user_goals(user_id)
    rows = ActivityModel.list_activities(
        user_id=user_id,
        search_date=search_date,
        workout_type=workout_type,
        start_date=start_date,
        end_date=end_date,
    )
    items = [ActivityModel.to_dict(r, goals) for r in rows]

    return (
        jsonify(
            {
                "success": True,
                "count": len(items),
                "activities": items,
                "workout_types": ActivityModel.VALID_WORKOUT_TYPES,
            }
        ),
        200,
    )


@activities_bp.route("/api/activities", methods=["POST"])
@login_required_api
def api_create_activity():
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}

    # Auto-fill weight from user profile if not provided
    if "weight" not in data or not data.get("weight"):
        user_row = UserModel.find_by_id(user_id)
        data["weight"] = float(user_row["weight"]) if user_row else 70.0

    # Auto-normalize workout_type to match valid database enum values
    wtype = str(data.get("workout_type", "")).strip()
    if wtype not in ActivityModel.VALID_WORKOUT_TYPES:
        wtype_lower = wtype.lower()
        if "hiit" in wtype_lower:
            data["workout_type"] = "Cardio"
        elif any(k in wtype_lower for k in ("strength", "squat", "curl", "push", "chest", "arm")):
            data["workout_type"] = "Strength Training"
        elif "yoga" in wtype_lower or "mobility" in wtype_lower:
            data["workout_type"] = "Yoga"
        elif "core" in wtype_lower or "abs" in wtype_lower:
            data["workout_type"] = "Gym"
        else:
            data["workout_type"] = "Other"

    errors = validate_activity_payload(data)
    if errors:
        return jsonify({"success": False, "error": errors[0], "errors": errors}), 400

    goals = GoalsModel.get_user_goals(user_id)
    new_row = ActivityModel.create_activity(
        user_id=user_id,
        activity_date=str(data["activity_date"]).strip(),
        weight=data["weight"],
        steps=data["steps"],
        calories_burned=data["calories_burned"],
        workout_duration=data["workout_duration"],
        workout_type=str(data["workout_type"]).strip(),
        water_intake=data["water_intake"],
        sleep_duration=data["sleep_duration"],
    )

    return (
        jsonify(
            {
                "success": True,
                "message": "Daily fitness activity logged successfully!",
                "activity": ActivityModel.to_dict(new_row, goals),
            }
        ),
        201,
    )


@activities_bp.route("/api/activities/<int:activity_id>", methods=["PUT"])
@login_required_api
def api_update_activity(activity_id):
    user_id = session["user_id"]
    data = request.get_json(silent=True) or {}
    errors = validate_activity_payload(data)
    if errors:
        return jsonify({"success": False, "error": errors[0], "errors": errors}), 400

    goals = GoalsModel.get_user_goals(user_id)
    updated_row = ActivityModel.update_activity(
        activity_id=activity_id,
        user_id=user_id,
        activity_date=str(data["activity_date"]).strip(),
        weight=data["weight"],
        steps=data["steps"],
        calories_burned=data["calories_burned"],
        workout_duration=data["workout_duration"],
        workout_type=str(data["workout_type"]).strip(),
        water_intake=data["water_intake"],
        sleep_duration=data["sleep_duration"],
    )
    if not updated_row:
        return jsonify({"success": False, "error": "Activity record not found or unauthorized."}), 404

    return (
        jsonify(
            {
                "success": True,
                "message": "Activity record updated successfully!",
                "activity": ActivityModel.to_dict(updated_row, goals),
            }
        ),
        200,
    )


@activities_bp.route("/api/activities/<int:activity_id>", methods=["DELETE"])
@login_required_api
def api_delete_activity(activity_id):
    user_id = session["user_id"]
    deleted = ActivityModel.delete_activity(activity_id, user_id)
    if not deleted:
        return jsonify({"success": False, "error": "Activity record not found or unauthorized."}), 404

    return (
        jsonify(
            {
                "success": True,
                "message": "Activity record deleted successfully.",
            }
        ),
        200,
    )
