from database import get_db


class ActivityModel:
    """Data access and fitness score calculation for Fitness_Activities."""

    VALID_WORKOUT_TYPES = [
        "Running",
        "Walking",
        "Gym",
        "Cycling",
        "Yoga",
        "Cardio",
        "Strength Training",
        "Other",
    ]

    @staticmethod
    def compute_fitness_score(activity_dict, goals_dict):
        """
        Compute a transparent Fitness Score out of 100 based on:
        - Steps goal achievement (35 points)
        - Calories burned goal achievement (25 points)
        - Workout duration goal achievement (25 points)
        - Hydration & Sleep recovery quality (15 points)
        """
        if not activity_dict:
            return {
                "score": 0,
                "status": "Beginner",
                "breakdown": {
                    "steps_points": 0,
                    "calories_points": 0,
                    "workout_points": 0,
                    "recovery_points": 0,
                },
            }

        step_goal = max(1000, int(goals_dict.get("daily_step_goal", 10000)))
        cal_goal = max(100.0, float(goals_dict.get("daily_calorie_goal", 500)))
        work_goal = max(10, int(goals_dict.get("daily_workout_goal", 45)))

        steps_ratio = min(1.0, float(activity_dict.get("steps", 0)) / step_goal)
        cal_ratio = min(1.0, float(activity_dict.get("calories_burned", 0)) / cal_goal)
        work_ratio = min(1.0, float(activity_dict.get("workout_duration", 0)) / work_goal)

        water = float(activity_dict.get("water_intake", 0))
        sleep = float(activity_dict.get("sleep_duration", 0))
        water_ratio = min(1.0, water / 2.5)
        # Optimal sleep window around 7-9 hours
        sleep_ratio = min(1.0, sleep / 7.5) if sleep <= 9.5 else max(0.5, 1.0 - ((sleep - 9.5) * 0.15))

        steps_pts = round(steps_ratio * 35.0, 1)
        cal_pts = round(cal_ratio * 25.0, 1)
        work_pts = round(work_ratio * 25.0, 1)
        rec_pts = round(((water_ratio * 0.5) + (sleep_ratio * 0.5)) * 15.0, 1)

        total_score = int(round(min(100.0, steps_pts + cal_pts + work_pts + rec_pts)))

        if total_score >= 75:
            status = "Highly Active"
        elif total_score >= 40:
            status = "Active"
        else:
            status = "Beginner"

        return {
            "score": total_score,
            "status": status,
            "breakdown": {
                "steps_points": steps_pts,
                "calories_points": cal_pts,
                "workout_points": work_pts,
                "recovery_points": rec_pts,
            },
        }

    @staticmethod
    def to_dict(row, goals_dict=None):
        if not row:
            return None
        d = {
            "id": row["id"],
            "user_id": row["user_id"],
            "activity_date": row["activity_date"],
            "weight": round(float(row["weight"]), 1),
            "steps": int(row["steps"]),
            "calories_burned": round(float(row["calories_burned"]), 1),
            "workout_duration": int(row["workout_duration"]),
            "workout_type": row["workout_type"],
            "water_intake": round(float(row["water_intake"]), 2),
            "sleep_duration": round(float(row["sleep_duration"]), 1),
            "created_at": row["created_at"],
        }
        if goals_dict:
            score_info = ActivityModel.compute_fitness_score(d, goals_dict)
            d["fitness_score"] = score_info["score"]
            d["fitness_status"] = score_info["status"]
        return d

    @staticmethod
    def list_activities(user_id, search_date=None, workout_type=None, start_date=None, end_date=None, limit=None):
        db = get_db()
        query = "SELECT * FROM Fitness_Activities WHERE user_id = ?"
        params = [user_id]

        if search_date:
            query += " AND activity_date = ?"
            params.append(search_date.strip())

        if workout_type and workout_type != "All":
            query += " AND workout_type = ?"
            params.append(workout_type.strip())

        if start_date:
            query += " AND activity_date >= ?"
            params.append(start_date.strip())

        if end_date:
            query += " AND activity_date <= ?"
            params.append(end_date.strip())

        query += " ORDER BY activity_date DESC, id DESC"

        if limit:
            query += " LIMIT ?"
            params.append(int(limit))

        rows = db.execute(query, tuple(params)).fetchall()
        return rows

    @staticmethod
    def get_by_id(activity_id, user_id):
        db = get_db()
        return db.execute(
            "SELECT * FROM Fitness_Activities WHERE id = ? AND user_id = ?",
            (activity_id, user_id),
        ).fetchone()

    @staticmethod
    def create_activity(
        user_id,
        activity_date,
        weight,
        steps,
        calories_burned,
        workout_duration,
        workout_type,
        water_intake,
        sleep_duration,
    ):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO Fitness_Activities
            (user_id, activity_date, weight, steps, calories_burned, workout_duration, workout_type, water_intake, sleep_duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                activity_date,
                float(weight),
                int(steps),
                float(calories_burned),
                int(workout_duration),
                workout_type,
                float(water_intake),
                float(sleep_duration),
            ),
        )
        new_id = cursor.lastrowid

        # Keep user's current profile weight synchronized with their latest logged activity date
        latest = db.execute(
            """
            SELECT weight FROM Fitness_Activities
            WHERE user_id = ?
            ORDER BY activity_date DESC, id DESC LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        if latest:
            db.execute(
                "UPDATE Users SET weight = ? WHERE id = ?",
                (float(latest["weight"]), user_id),
            )

        db.commit()
        return ActivityModel.get_by_id(new_id, user_id)

    @staticmethod
    def update_activity(
        activity_id,
        user_id,
        activity_date,
        weight,
        steps,
        calories_burned,
        workout_duration,
        workout_type,
        water_intake,
        sleep_duration,
    ):
        db = get_db()
        existing = ActivityModel.get_by_id(activity_id, user_id)
        if not existing:
            return None

        db.execute(
            """
            UPDATE Fitness_Activities
            SET activity_date = ?, weight = ?, steps = ?, calories_burned = ?,
                workout_duration = ?, workout_type = ?, water_intake = ?, sleep_duration = ?
            WHERE id = ? AND user_id = ?
            """,
            (
                activity_date,
                float(weight),
                int(steps),
                float(calories_burned),
                int(workout_duration),
                workout_type,
                float(water_intake),
                float(sleep_duration),
                activity_id,
                user_id,
            ),
        )

        latest = db.execute(
            """
            SELECT weight FROM Fitness_Activities
            WHERE user_id = ?
            ORDER BY activity_date DESC, id DESC LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        if latest:
            db.execute(
                "UPDATE Users SET weight = ? WHERE id = ?",
                (float(latest["weight"]), user_id),
            )

        db.commit()
        return ActivityModel.get_by_id(activity_id, user_id)

    @staticmethod
    def delete_activity(activity_id, user_id):
        db = get_db()
        existing = ActivityModel.get_by_id(activity_id, user_id)
        if not existing:
            return False

        db.execute(
            "DELETE FROM Fitness_Activities WHERE id = ? AND user_id = ?",
            (activity_id, user_id),
        )
        db.commit()
        return True
