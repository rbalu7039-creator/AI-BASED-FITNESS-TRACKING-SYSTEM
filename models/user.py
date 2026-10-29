from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db


class UserModel:
    """Data access and domain logic for the Users table."""

    VALID_GOALS = [
        "Weight Loss",
        "Muscle Gain",
        "General Fitness",
        "Improve Endurance",
        "Maintain Weight",
    ]
    VALID_GENDERS = ["Male", "Female", "Other"]

    @staticmethod
    def to_safe_dict(row):
        """Serialize a user row without exposing password_hash."""
        if not row:
            return None
        height_m = float(row["height"]) / 100.0
        bmi = round(float(row["weight"]) / (height_m * height_m), 1) if height_m > 0 else 0.0
        return {
            "id": row["id"],
            "full_name": row["full_name"],
            "email": row["email"],
            "age": int(row["age"]),
            "gender": row["gender"],
            "height": round(float(row["height"]), 1),
            "weight": round(float(row["weight"]), 1),
            "bmi": bmi,
            "bmi_category": UserModel.get_bmi_category(bmi),
            "fitness_goal": row["fitness_goal"],
            "created_at": row["created_at"],
        }

    @staticmethod
    def get_bmi_category(bmi):
        """Return standard adult BMI category."""
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25.0:
            return "Normal"
        elif bmi < 30.0:
            return "Overweight"
        return "Obese"

    @staticmethod
    def calculate_bmi_details(weight_kg, height_cm):
        """Calculate BMI value, category, ideal weight range, and guidance."""
        height_m = float(height_kg_or_cm := height_cm) / 100.0
        if height_m <= 0:
            raise ValueError("Height must be greater than 0 cm.")
        bmi = round(float(weight_kg) / (height_m * height_m), 2)
        category = UserModel.get_bmi_category(bmi)

        min_normal_weight = round(18.5 * (height_m ** 2), 1)
        max_normal_weight = round(24.9 * (height_m ** 2), 1)

        guidance_map = {
            "Underweight": (
                "Your BMI is below the standard adult range (18.5 - 24.9). Focus on nutrient-dense "
                "whole foods, a moderate caloric surplus (+300 to +400 kcal/day), and progressive "
                "resistance training to build lean muscle mass safely."
            ),
            "Normal": (
                "Your BMI falls within the healthy adult range (18.5 - 24.9). Maintain balanced "
                "macronutrients, consistent cardiovascular activity (150+ mins/week), and strength "
                "training 2-3 times per week to preserve metabolic health."
            ),
            "Overweight": (
                "Your BMI is slightly above the standard range (25.0 - 29.9). Aim for a sustainable, "
                "moderate caloric deficit (300 - 500 kcal/day), 8,000 - 10,000 daily steps, and a mix "
                "of low-impact cardio and strength training."
            ),
            "Obese": (
                "Your BMI is in the 30.0+ range. Prioritize gradual, sustainable habits: low-impact "
                "movement (walking, cycling, swimming) to protect joints, high protein and fiber intake, "
                "adequate sleep, and consulting a qualified healthcare provider for personalized care."
            ),
        }

        # Scale position percentage (clamped between BMI 12 and 40 for visual gauge)
        scale_percent = max(2.0, min(98.0, round(((bmi - 12.0) / (40.0 - 12.0)) * 100.0, 1)))

        return {
            "bmi": bmi,
            "category": category,
            "healthy_weight_range": f"{min_normal_weight} kg - {max_normal_weight} kg",
            "scale_percent": scale_percent,
            "guidance": guidance_map[category],
            "disclaimer": "These calculations are general estimates based on standard adult formulas and are not medical advice.",
        }

    @staticmethod
    def calculate_bmr_details(weight_kg, height_cm, age, gender, activity_level="Moderately Active"):
        """Calculate BMR using the Mifflin-St Jeor equation and TDEE across activity multipliers."""
        w = float(weight_kg)
        h = float(height_cm)
        a = int(age)
        g_norm = str(gender).strip().lower()

        if g_norm == "male":
            bmr = (10.0 * w) + (6.25 * h) - (5.0 * a) + 5.0
            formula_used = "10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5"
        elif g_norm == "female":
            bmr = (10.0 * w) + (6.25 * h) - (5.0 * a) - 161.0
            formula_used = "10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161"
        else:
            # Neutral midpoint for 'Other'
            bmr = (10.0 * w) + (6.25 * h) - (5.0 * a) - 78.0
            formula_used = "10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 78"

        multipliers = {
            "Sedentary": (1.2, "Little or no formal exercise, desk job"),
            "Lightly Active": (1.375, "Light exercise or sports 1-3 days/week"),
            "Moderately Active": (1.55, "Moderate exercise or sports 3-5 days/week"),
            "Very Active": (1.725, "Hard exercise or sports 6-7 days/week"),
        }

        if activity_level not in multipliers:
            activity_level = "Moderately Active"

        multiplier, level_desc = multipliers[activity_level]
        tdee = round(bmr * multiplier)
        bmr_rounded = round(bmr)

        all_levels = {
            lvl: {
                "multiplier": mult,
                "tdee": round(bmr * mult),
                "description": desc,
            }
            for lvl, (mult, desc) in multipliers.items()
        }

        return {
            "bmr": bmr_rounded,
            "activity_level": activity_level,
            "activity_multiplier": multiplier,
            "activity_description": level_desc,
            "tdee": tdee,
            "formula_used": formula_used,
            "calorie_targets": {
                "weight_loss": max(1200, tdee - 450),
                "maintenance": tdee,
                "muscle_gain": tdee + 300,
            },
            "all_activity_levels": all_levels,
            "explanation": (
                f"Your Basal Metabolic Rate (BMR) is {bmr_rounded} kcal/day — the energy your body "
                f"needs at complete rest. Factoring in a '{activity_level}' lifestyle (×{multiplier}), "
                f"your Total Daily Energy Expenditure (TDEE) is estimated at {tdee} kcal/day."
            ),
            "disclaimer": "BMR and TDEE values are mathematical estimates using the Mifflin-St Jeor equation and do not constitute medical or clinical nutrition advice.",
        }

    @staticmethod
    def find_by_email(email):
        db = get_db()
        return db.execute(
            "SELECT * FROM Users WHERE LOWER(email) = LOWER(?)", (email.strip(),)
        ).fetchone()

    @staticmethod
    def find_by_id(user_id):
        db = get_db()
        return db.execute("SELECT * FROM Users WHERE id = ?", (user_id,)).fetchone()

    @staticmethod
    def create_user(full_name, email, password, age, gender, height, weight, fitness_goal):
        db = get_db()
        password_hash = generate_password_hash(password)
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO Users (full_name, email, password_hash, age, gender, height, weight, fitness_goal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                full_name.strip(),
                email.strip().lower(),
                password_hash,
                int(age),
                gender,
                float(height),
                float(weight),
                fitness_goal,
            ),
        )
        user_id = cursor.lastrowid

        # Set default personalized goals based on user's fitness goal
        goal_presets = {
            "Weight Loss": (10500, 550, 45),
            "Muscle Gain": (8500, 450, 55),
            "General Fitness": (9000, 450, 40),
            "Improve Endurance": (11500, 600, 55),
            "Maintain Weight": (9000, 420, 40),
        }
        step_g, cal_g, work_g = goal_presets.get(fitness_goal, (10000, 500, 45))
        cursor.execute(
            """
            INSERT INTO Fitness_Goals (user_id, daily_step_goal, daily_calorie_goal, daily_workout_goal)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, step_g, cal_g, work_g),
        )
        db.commit()
        return UserModel.find_by_id(user_id)

    @staticmethod
    def update_user(user_id, full_name, age, gender, height, weight, fitness_goal):
        db = get_db()
        db.execute(
            """
            UPDATE Users
            SET full_name = ?, age = ?, gender = ?, height = ?, weight = ?, fitness_goal = ?
            WHERE id = ?
            """,
            (
                full_name.strip(),
                int(age),
                gender,
                float(height),
                float(weight),
                fitness_goal,
                user_id,
            ),
        )
        db.commit()
        return UserModel.find_by_id(user_id)

    @staticmethod
    def verify_password(user_row, password):
        if not user_row:
            return False
        return check_password_hash(user_row["password_hash"], password)
