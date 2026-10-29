from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from routes.auth import login_required_api
from models.activity import ActivityModel
from models.goals import GoalsModel

analytics_bp = Blueprint("analytics", __name__)


def _build_analytics_payload(user_id, default_days=7):
    goals = GoalsModel.get_user_goals(user_id)

    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    period_mode = request.args.get("mode", "").strip().lower()

    today = datetime.now().date()
    if not end_date:
        end_date = today.strftime("%Y-%m-%d")

    if not start_date:
        if period_mode == "daily":
            days_back = 7
        elif period_mode == "monthly":
            days_back = 30
        else:
            days_back = default_days
        start_dt = today - timedelta(days=days_back - 1)
        start_date = start_dt.strftime("%Y-%m-%d")

    # Fetch records in date range ordered ascending for time-series charts
    rows = ActivityModel.list_activities(
        user_id=user_id, start_date=start_date, end_date=end_date
    )
    all_rows = ActivityModel.list_activities(user_id=user_id)
    records = list(reversed([ActivityModel.to_dict(r, goals) for r in rows]))
    all_records = list(reversed([ActivityModel.to_dict(r, goals) for r in all_rows]))

    if not records:
        return {
            "success": True,
            "has_data": len(all_records) > 0,
            "has_range_data": False,
            "start_date": start_date,
            "end_date": end_date,
            "goals": goals,
            "records": [],
            "summary": {
                "total_days_logged": 0,
                "total_steps": 0,
                "avg_steps": 0,
                "total_calories": 0,
                "avg_calories": 0,
                "total_workout_mins": 0,
                "avg_workout_mins": 0,
                "avg_fitness_score": 0,
                "weight_change": 0.0,
                "start_weight": 0.0,
                "end_weight": 0.0,
                "goal_completion_percent": 0,
            },
            "comparison": {
                "steps_change_pct": 0.0,
                "calories_change_pct": 0.0,
                "workout_change_pct": 0.0,
            },
            "workout_distribution": {},
        }

    total_days = len(records)
    total_steps = sum(r["steps"] for r in records)
    avg_steps = int(round(total_steps / total_days))
    total_calories = round(sum(r["calories_burned"] for r in records), 1)
    avg_calories = round(total_calories / total_days, 1)
    total_workout = sum(r["workout_duration"] for r in records)
    avg_workout = int(round(total_workout / total_days))
    avg_score = int(round(sum(r["fitness_score"] for r in records) / total_days))

    start_weight = records[0]["weight"]
    end_weight = records[-1]["weight"]
    weight_change = round(end_weight - start_weight, 1)

    # Goal completion percentage across the selected period
    step_goal = max(1, goals["daily_step_goal"])
    cal_goal = max(1.0, goals["daily_calorie_goal"])
    work_goal = max(1, goals["daily_workout_goal"])

    step_hit = min(100.0, (avg_steps / step_goal) * 100.0)
    cal_hit = min(100.0, (avg_calories / cal_goal) * 100.0)
    work_hit = min(100.0, (avg_workout / work_goal) * 100.0)
    goal_completion_pct = int(round((step_hit + cal_hit + work_hit) / 3.0))

    # Progress comparison: second half vs first half of period
    mid = max(1, total_days // 2)
    first_half = records[:mid]
    second_half = records[mid:] if total_days > 1 else records

    def pct_diff(curr_list, prev_list, key):
        p_avg = sum(x[key] for x in prev_list) / max(1, len(prev_list))
        c_avg = sum(x[key] for x in curr_list) / max(1, len(curr_list))
        if p_avg <= 0:
            return 0.0
        return round(((c_avg - p_avg) / p_avg) * 100.0, 1)

    comparison = {
        "steps_change_pct": pct_diff(second_half, first_half, "steps"),
        "calories_change_pct": pct_diff(second_half, first_half, "calories_burned"),
        "workout_change_pct": pct_diff(second_half, first_half, "workout_duration"),
    }

    workout_dist = {}
    for r in records:
        wt = r["workout_type"]
        workout_dist[wt] = workout_dist.get(wt, 0) + 1

    return {
        "success": True,
        "has_data": True,
        "has_range_data": True,
        "start_date": start_date,
        "end_date": end_date,
        "goals": goals,
        "records": records,
        "summary": {
            "total_days_logged": total_days,
            "total_steps": total_steps,
            "avg_steps": avg_steps,
            "total_calories": total_calories,
            "avg_calories": avg_calories,
            "total_workout_mins": total_workout,
            "avg_workout_mins": avg_workout,
            "avg_fitness_score": avg_score,
            "weight_change": weight_change,
            "start_weight": start_weight,
            "end_weight": end_weight,
            "goal_completion_percent": goal_completion_pct,
        },
        "comparison": comparison,
        "workout_distribution": workout_dist,
    }


@analytics_bp.route("/api/analytics/weekly", methods=["GET"])
@login_required_api
def api_analytics_weekly():
    user_id = session["user_id"]
    payload = _build_analytics_payload(user_id, default_days=7)
    payload["period"] = "weekly"
    return jsonify(payload), 200


@analytics_bp.route("/api/analytics/monthly", methods=["GET"])
@login_required_api
def api_analytics_monthly():
    user_id = session["user_id"]
    payload = _build_analytics_payload(user_id, default_days=30)
    payload["period"] = "monthly"
    return jsonify(payload), 200
