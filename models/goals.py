from database import get_db


class GoalsModel:
    """Data access and domain logic for Fitness_Goals and AI_Recommendations tables."""

    @staticmethod
    def get_user_goals(user_id):
        db = get_db()
        row = db.execute(
            "SELECT * FROM Fitness_Goals WHERE user_id = ?", (user_id,)
        ).fetchone()
        if not row:
            # Auto-initialize default goals if missing
            cursor = db.cursor()
            cursor.execute(
                """
                INSERT INTO Fitness_Goals (user_id, daily_step_goal, daily_calorie_goal, daily_workout_goal)
                VALUES (?, 10000, 500, 45)
                """,
                (user_id,),
            )
            db.commit()
            row = db.execute(
                "SELECT * FROM Fitness_Goals WHERE user_id = ?", (user_id,)
            ).fetchone()

        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "daily_step_goal": int(row["daily_step_goal"]),
            "daily_calorie_goal": round(float(row["daily_calorie_goal"]), 1),
            "daily_workout_goal": int(row["daily_workout_goal"]),
            "created_at": row["created_at"],
        }

    @staticmethod
    def upsert_user_goals(user_id, daily_step_goal, daily_calorie_goal, daily_workout_goal):
        db = get_db()
        existing = db.execute(
            "SELECT id FROM Fitness_Goals WHERE user_id = ?", (user_id,)
        ).fetchone()

        if existing:
            db.execute(
                """
                UPDATE Fitness_Goals
                SET daily_step_goal = ?, daily_calorie_goal = ?, daily_workout_goal = ?
                WHERE user_id = ?
                """,
                (
                    int(daily_step_goal),
                    float(daily_calorie_goal),
                    int(daily_workout_goal),
                    user_id,
                ),
            )
        else:
            db.execute(
                """
                INSERT INTO Fitness_Goals (user_id, daily_step_goal, daily_calorie_goal, daily_workout_goal)
                VALUES (?, ?, ?, ?)
                """,
                (
                    user_id,
                    int(daily_step_goal),
                    float(daily_calorie_goal),
                    int(daily_workout_goal),
                ),
            )
        db.commit()
        return GoalsModel.get_user_goals(user_id)
