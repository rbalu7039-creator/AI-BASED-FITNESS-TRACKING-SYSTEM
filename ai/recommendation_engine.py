import os
from datetime import datetime, timedelta
import joblib
import numpy as np
from ai.train_model import MODEL_PATH, train_and_save_model
from models.user import UserModel


class FitnessRecommendationEngine:
    """
    Hybrid AI Fitness Recommendation Engine combining Scikit-learn Random Forest
    predictions with evidence-based exercise physiology rules.
    """

    _model_bundle = None

    @classmethod
    def get_model_bundle(cls):
        if cls._model_bundle is None:
            if not os.path.exists(MODEL_PATH):
                cls._model_bundle = train_and_save_model()
            else:
                try:
                    cls._model_bundle = joblib.load(MODEL_PATH)
                except Exception:
                    cls._model_bundle = train_and_save_model()
        return cls._model_bundle

    @classmethod
    def generate_recommendations(cls, user_dict, activities_list, goals_dict=None, custom_override=None):
        """
        Analyze user demographics, BMI, fitness goal, recent daily steps,
        workout duration, calories burned, workout history, and consistency
        to produce a comprehensive, safe AI fitness recommendation plan.
        """
        bundle = cls.get_model_bundle()

        age = int((custom_override or {}).get("age", user_dict["age"]))
        gender = str((custom_override or {}).get("gender", user_dict["gender"]))
        height_cm = float((custom_override or {}).get("height", user_dict["height"]))
        weight_kg = float((custom_override or {}).get("weight", user_dict["weight"]))
        fitness_goal = str((custom_override or {}).get("fitness_goal", user_dict["fitness_goal"]))

        height_m = height_cm / 100.0
        bmi = round(weight_kg / (height_m ** 2), 1) if height_m > 0 else 22.0
        bmi_category = UserModel.get_bmi_category(bmi)

        # Analyze recent 14 days of activity logs
        recent_logs = activities_list[:14] if activities_list else []
        if recent_logs:
            avg_steps = int(round(np.mean([float(a["steps"]) for a in recent_logs])))
            avg_duration = int(round(np.mean([float(a["workout_duration"]) for a in recent_logs])))
            avg_calories = int(round(np.mean([float(a["calories_burned"]) for a in recent_logs])))
            avg_sleep = round(float(np.mean([float(a["sleep_duration"]) for a in recent_logs])), 1)
            avg_water = round(float(np.mean([float(a["water_intake"]) for a in recent_logs])), 2)

            # Calculate consistency over last 14 days
            today = datetime.now().date()
            cutoff = (today - timedelta(days=13)).strftime("%Y-%m-%d")
            unique_days = len({a["activity_date"] for a in activities_list if a["activity_date"] >= cutoff})
            consistency_ratio = round(min(1.0, unique_days / 14.0), 2)

            # Dominant workout types
            type_counts = {}
            for a in recent_logs:
                wt = a["workout_type"]
                type_counts[wt] = type_counts.get(wt, 0) + 1
            favorite_workouts = sorted(type_counts.keys(), key=lambda k: type_counts[k], reverse=True)
        else:
            avg_steps = 5500
            avg_duration = 25
            avg_calories = 280
            avg_sleep = 7.0
            avg_water = 2.0
            consistency_ratio = 0.25
            favorite_workouts = ["Walking", "Bodyweight Conditioning"]

        if custom_override:
            avg_steps = int(custom_override.get("daily_steps", avg_steps))
            avg_duration = int(custom_override.get("workout_duration", avg_duration))
            avg_calories = int(custom_override.get("calories_burned", avg_calories))

        # Encode categorical inputs safely for Scikit-learn
        gender_for_enc = gender if gender in ["Male", "Female"] else "Male"
        goal_for_enc = (
            fitness_goal
            if fitness_goal in UserModel.VALID_GOALS
            else "General Fitness"
        )

        gender_enc = int(bundle["gender_encoder"].transform([gender_for_enc])[0])
        goal_enc = int(bundle["goal_encoder"].transform([goal_for_enc])[0])

        features = np.array(
            [
                [
                    age,
                    gender_enc,
                    height_cm,
                    weight_kg,
                    bmi,
                    goal_enc,
                    avg_steps,
                    avg_duration,
                    avg_calories,
                    consistency_ratio,
                    avg_sleep,
                    avg_water,
                ]
            ]
        )

        # ML Model Inference
        clf = bundle["classifier"]
        reg = bundle["regressor"]

        pred_class_idx = int(clf.predict(features)[0])
        proba_arr = clf.predict_proba(features)[0]
        confidence_pct = round(float(np.max(proba_arr)) * 100.0, 1)
        regimen_archetype = str(bundle["regimen_encoder"].inverse_transform([pred_class_idx])[0])

        pred_reg = reg.predict(features)[0]
        rec_duration = int(round(float(pred_reg[0]) / 5.0) * 5)
        rec_steps = int(round(float(pred_reg[1]) / 250.0) * 250)
        rec_active_cal = int(round(float(pred_reg[2]) / 10.0) * 10)

        # Safety clamping
        rec_duration = max(30, min(75, rec_duration))
        rec_steps = max(7000, min(14000, rec_steps))
        rec_active_cal = max(300, min(850, rec_active_cal))

        # BMR & TDEE calculation for nutritional & energy context
        activity_lvl = (
            "Very Active"
            if consistency_ratio >= 0.75 and avg_duration >= 45
            else "Moderately Active"
            if consistency_ratio >= 0.45
            else "Lightly Active"
        )
        bmr_info = UserModel.calculate_bmr_details(weight_kg, height_cm, age, gender, activity_lvl)
        tdee = bmr_info["tdee"]

        # 1. Daily Workout Plan (Structured Weekly/Daily Split)
        workout_plans = {
            "Weight Loss": {
                "focus": "Metabolic Conditioning, Low-Impact Zone-2 Cardio & Lean Mass Preservation",
                "intensity": "Moderate to High (RPE 7/10)",
                "schedule": [
                    {"day": "Monday", "session": "Full-Body Circuit Strength + Brisk Incline Walk", "duration": f"{rec_duration} mins", "details": "3 rounds: Goblet squats (12), Push-ups (12), Dumbbell rows (12/side), Plank (45s) + 15m Zone-2 cardio"},
                    {"day": "Tuesday", "session": "Aerobic Zone-2 Running / Cycling Intervals", "duration": f"{rec_duration} mins", "details": "5m warm-up, 30m steady pace at 65-75% max HR, 10m mobility cool-down"},
                    {"day": "Wednesday", "session": "Core Stability & Active Recovery Mobility", "duration": f"{max(30, rec_duration - 10)} mins", "details": "Yoga flow, hip mobility, dead-bugs, bird-dogs, and brisk outdoor walk"},
                    {"day": "Thursday", "session": "Lower Body & Posterior Chain Conditioning", "duration": f"{rec_duration} mins", "details": "Romanian deadlifts, lunges, step-ups, glute bridges + 12m cycling finisher"},
                    {"day": "Friday", "session": "HIIT Metabolic Burner & Upper Body Tone", "duration": f"{rec_duration} mins", "details": "20m EMOM intervals (kettlebell swings, battle ropes/jumping jacks) + shoulder/chest press"},
                    {"day": "Saturday", "session": "Long Outdoor Endurance Walk or Ride", "duration": f"{rec_duration + 10} mins", "details": "Continuous conversational-pace movement to maximize lipid oxidation"},
                    {"day": "Sunday", "session": "Rest & Stretching Regeneration", "duration": "25 mins", "details": "Gentle foam rolling, hydration focus, and 7,000+ leisure steps"},
                ],
            },
            "Muscle Gain": {
                "focus": "Progressive Overload Hypertrophy & Compound Multi-Joint Strength",
                "intensity": "High Mechanical Tension (RPE 7.5-8.5/10)",
                "schedule": [
                    {"day": "Monday", "session": "Upper Body Push (Chest, Shoulders, Triceps)", "duration": f"{rec_duration} mins", "details": "Bench press (4x8), Overhead press (3x10), Incline DB press (3x10), Lateral raises (3x15), Tricep dips"},
                    {"day": "Tuesday", "session": "Lower Body Quad & Calf Hypertrophy", "duration": f"{rec_duration} mins", "details": "Barbell squats (4x8), Leg press (3x12), Bulgarian split squats (3x10), Standing calf raises (4x15)"},
                    {"day": "Wednesday", "session": "Active Recovery & Core Conditioning", "duration": "30 mins", "details": "Light 20m walk/cycle to boost blood flow + hanging leg raises and thoracic mobility"},
                    {"day": "Thursday", "session": "Upper Body Pull (Back, Traps, Biceps)", "duration": f"{rec_duration} mins", "details": "Pull-ups/Lat pulldowns (4x10), Barbell rows (4x8), Face pulls (3x15), Barbell curls (3x12)"},
                    {"day": "Friday", "session": "Posterior Chain (Hamstrings, Glutes, Lower Back)", "duration": f"{rec_duration} mins", "details": "Romanian deadlifts (4x8), Hip thrusts (4x10), Hamstring curls (3x12), Farmer's carries"},
                    {"day": "Saturday", "session": "Full-Body Weak-Point Accessory & Conditioning", "duration": f"{max(40, rec_duration - 5)} mins", "details": "Arms, deltoids, core stability + 15m moderate incline treadmill walk"},
                    {"day": "Sunday", "session": "Complete Muscular Recovery", "duration": "20 mins", "details": "Deep tissue stretching, protein synthesis recovery, 8+ hours quality sleep"},
                ],
            },
            "Improve Endurance": {
                "focus": "Cardiovascular VO2 Max Expansion, Lactate Threshold & Muscular Stamina",
                "intensity": "Polarized (80% Zone-2 Aerobic / 20% Zone-4 Tempo)",
                "schedule": [
                    {"day": "Monday", "session": "Zone-2 Aerobic Base Run / Cycle", "duration": f"{rec_duration} mins", "details": "Steady nasal-breathing pace at 65-72% Max HR to build mitochondrial density"},
                    {"day": "Tuesday", "session": "Endurance Strength & Core Resilience", "duration": f"{max(40, rec_duration - 5)} mins", "details": "High-rep lunges, single-leg deadlifts, planks, and plyometric calf hops"},
                    {"day": "Wednesday", "session": "VO2 Max Interval Training", "duration": f"{rec_duration} mins", "details": "10m warm-up, 5 x 4-min fast intervals with 2-min jog recovery, 10m cool-down"},
                    {"day": "Thursday", "session": "Low-Impact Cross Training (Cycling / Swimming)", "duration": f"{rec_duration} mins", "details": "Flush lower-body impact stress while maintaining elevated cardiac output"},
                    {"day": "Friday", "session": "Tempo Threshold Session", "duration": f"{rec_duration} mins", "details": "Sustained comfortably-hard effort for 25-30 mins + mobility work"},
                    {"day": "Saturday", "session": "Long Progressive Stamina Session", "duration": f"{rec_duration + 15} mins", "details": "Extended endurance outing; hydrate with electrolytes every 25 minutes"},
                    {"day": "Sunday", "session": "Yoga & Parasympathetic Recovery", "duration": "30 mins", "details": "Hip flexor, hamstring, and ankle mobility flow"},
                ],
            },
            "Maintain Weight": {
                "focus": "Metabolic Equilibrium, Functional Strength & Joint Longevity",
                "intensity": "Moderate Balanced Effort (RPE 6.5-7.5/10)",
                "schedule": [
                    {"day": "Monday", "session": "Full-Body Functional Strength A", "duration": f"{rec_duration} mins", "details": "Squats, push-ups, rows, overhead carries, and core rotational work"},
                    {"day": "Tuesday", "session": "Cardio Mixed Modal (Run / Bike)", "duration": f"{rec_duration} mins", "details": "35 mins steady aerobic work + 10 mins dynamic stretching"},
                    {"day": "Wednesday", "session": "Yoga & Core Postural Alignment", "duration": f"{rec_duration} mins", "details": "Vinyasa flow focusing on spine decompression and shoulder stability"},
                    {"day": "Thursday", "session": "Full-Body Functional Strength B", "duration": f"{rec_duration} mins", "details": "Deadlift variations, lunges, dips, lat pulldowns, and hollow holds"},
                    {"day": "Friday", "session": "Fun Interval Cardio or Sports Activity", "duration": f"{rec_duration} mins", "details": "Moderate intervals or recreational sport to keep engagement high"},
                    {"day": "Saturday", "session": "Outdoor Nature Walk & Mobility", "duration": f"{rec_duration + 5} mins", "details": "Brisk 9,000+ step walk and full-body stretching"},
                    {"day": "Sunday", "session": "Active Rest", "duration": "20 mins", "details": "Light stroll and weekly meal/workout planning"},
                ],
            },
            "General Fitness": {
                "focus": "Holistic Cardiovascular Health, Strength, Flexibility & Daily Energy",
                "intensity": "Moderate Progressive (RPE 7/10)",
                "schedule": [
                    {"day": "Monday", "session": "Total Body Strength & Core Foundation", "duration": f"{rec_duration} mins", "details": "Compound movements: squats, chest press, seated rows, and plank variations"},
                    {"day": "Tuesday", "session": "Brisk Cardio & Step Accelerator", "duration": f"{rec_duration} mins", "details": "Jogging or cycling at moderate pace to boost heart-lung efficiency"},
                    {"day": "Wednesday", "session": "Flexibility, Yoga & Balance Training", "duration": f"{max(35, rec_duration - 5)} mins", "details": "Full-body yoga flow, single-leg balance drills, and deep breathing"},
                    {"day": "Thursday", "session": "Upper & Lower Resistance Circuit", "duration": f"{rec_duration} mins", "details": "Lunges, dumbbell shoulder press, lat pulls, and glute bridges"},
                    {"day": "Friday", "session": "Cardio Intervals & Core Conditioning", "duration": f"{rec_duration} mins", "details": "Alternating 2-min brisk effort with 1-min easy recovery for 30 mins + abs"},
                    {"day": "Saturday", "session": "Active Outdoor Endurance Session", "duration": f"{rec_duration + 10} mins", "details": "Cycling, long brisk walk, or gym cardio mix"},
                    {"day": "Sunday", "session": "Rest & Recovery", "duration": "20 mins", "details": "Gentle stretching and sleep prioritization"},
                ],
            },
        }

        selected_plan = workout_plans.get(goal_for_enc, workout_plans["General Fitness"])

        # 4. General Calorie & Activity Guidance (Safe, non-extreme)
        if goal_for_enc == "Weight Loss":
            target_intake = max(1400 if gender_for_enc == "Female" else 1650, tdee - 400)
            calorie_guidance = (
                f"Estimated TDEE is ~{tdee} kcal/day (BMR: {bmr_info['bmr']} kcal). Aim for a safe, "
                f"sustainable intake around {target_intake} kcal/day (a moderate ~400 kcal deficit) paired "
                f"with {rec_active_cal} kcal of active daily movement. Prioritize 1.6-2.0g protein per kg of "
                f"body weight and high-fiber vegetables to preserve muscle and satiety."
            )
        elif goal_for_enc == "Muscle Gain":
            target_intake = tdee + 300
            calorie_guidance = (
                f"Estimated TDEE is ~{tdee} kcal/day (BMR: {bmr_info['bmr']} kcal). Aim for a controlled "
                f"anabolic surplus around {target_intake} kcal/day (+300 kcal above maintenance) while burning "
                f"~{rec_active_cal} active kcal/day. Distribute 1.8-2.2g/kg of protein across 4-5 meals."
            )
        else:
            target_intake = tdee
            calorie_guidance = (
                f"Estimated TDEE is ~{tdee} kcal/day (BMR: {bmr_info['bmr']} kcal). Maintain energy balance "
                f"around {target_intake} kcal/day with whole grains, lean proteins, and healthy fats while "
                f"targeting ~{rec_active_cal} active calories burned through structured workouts and steps."
            )

        # 5. Recovery and Rest Suggestions (personalized to user's actual water & sleep logs)
        recovery_tips = []
        if avg_sleep < 7.0:
            recovery_tips.append(
                f"Sleep Optimization: Your recent average sleep is {avg_sleep} hrs/night. Increase to 7.5-8.0 hours to lower cortisol and accelerate muscle repair."
            )
        else:
            recovery_tips.append(
                f"Sleep Quality: Great job averaging {avg_sleep} hrs/night! Maintain a consistent sleep/wake window to support circadian hormone balance."
            )

        target_water = round(max(2.5, weight_kg * 0.038), 1)
        if avg_water < target_water:
            recovery_tips.append(
                f"Hydration Target: Your recent intake averages {avg_water} L/day. Gradually increase to {target_water} L/day (+500 ml on heavy sweat days)."
            )
        else:
            recovery_tips.append(
                f"Hydration Status: Excellent hydration at {avg_water} L/day (target: {target_water} L/day). Keep replenishing electrolytes post-workout."
            )

        recovery_tips.append(
            "Deload & Joint Care: Include 5-10 minutes of dynamic warm-up before every session and schedule 1-2 low-impact active recovery days weekly."
        )

        # 6. Weekly Fitness Improvement Suggestions
        step_delta = rec_steps - avg_steps
        dur_delta = rec_duration - avg_duration
        weekly_improvements = [
            f"Progressive Step Pacing: Move from your current average of {avg_steps:,} steps/day toward {rec_steps:,} steps/day ({'+' if step_delta >= 0 else ''}{step_delta:,} steps adjustment) by adding a 15-minute post-meal walk.",
            f"Workout Volume Scaling: Target {rec_duration} mins/session ({'+' if dur_delta >= 0 else ''}{dur_delta} mins vs current {avg_duration} mins average) with progressive overload of 2.5-5% per week.",
            f"Consistency Milestone: Your 14-day logging consistency is {int(consistency_ratio * 100)}%. Aim for at least 5 logged active days per week (75%+ consistency) to unlock compounding metabolic gains.",
            f"Cross-Training Variety: You frequently perform {', '.join(favorite_workouts[:2])}. Complement this with 1 weekly mobility/yoga session and 2 resistance sessions to prevent plateaus.",
        ]

        return {
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "model_info": {
                "algorithm": "Hybrid Scikit-learn Random Forest (Classifier + Multi-Output Regressor) & Exercise Physiology Rule Engine",
                "regimen_archetype": regimen_archetype,
                "model_confidence": confidence_pct,
                "training_metrics": bundle.get("metrics", {}),
            },
            "user_snapshot": {
                "age": age,
                "gender": gender,
                "height_cm": height_cm,
                "weight_kg": weight_kg,
                "bmi": bmi,
                "bmi_category": bmi_category,
                "fitness_goal": goal_for_enc,
                "recent_avg_steps": avg_steps,
                "recent_avg_workout_mins": avg_duration,
                "recent_avg_calories": avg_calories,
                "recent_avg_sleep": avg_sleep,
                "recent_avg_water": avg_water,
                "consistency_percent": int(consistency_ratio * 100),
            },
            "recommendations": {
                "daily_workout_plan": selected_plan,
                "suggested_workout_duration": {
                    "minutes_per_day": rec_duration,
                    "weekly_total_minutes": rec_duration * 5,
                    "rationale": f"Tailored for your '{goal_for_enc}' goal and current {avg_duration} min/day baseline.",
                },
                "daily_step_target": {
                    "steps": rec_steps,
                    "distance_km_approx": round(rec_steps * 0.00076, 1),
                    "rationale": f"Calibrated from your {avg_steps:,} daily step average to optimize NEAT (Non-Exercise Activity Thermogenesis).",
                },
                "calorie_and_activity_guidance": {
                    "bmr_kcal": bmr_info["bmr"],
                    "tdee_kcal": tdee,
                    "recommended_dietary_intake_kcal": target_intake,
                    "recommended_active_burn_kcal": rec_active_cal,
                    "guidance_text": calorie_guidance,
                },
                "recovery_and_rest_suggestions": recovery_tips,
                "weekly_improvement_suggestions": weekly_improvements,
            },
            "disclaimer": (
                "This AI-generated fitness plan is based on statistical models and general exercise science "
                "for educational and wellness tracking purposes. It is not a substitute for professional medical diagnosis or clinical advice."
            ),
        }
