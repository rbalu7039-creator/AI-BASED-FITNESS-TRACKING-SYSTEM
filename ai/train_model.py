import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score

AI_DIR = os.path.abspath(os.path.dirname(__file__))
DATASET_PATH = os.path.join(AI_DIR, "dataset.csv")
MODEL_PATH = os.path.join(AI_DIR, "fitness_model.pkl")


def generate_training_dataset(csv_path=DATASET_PATH, n_samples=450):
    """
    Generate a structured, physiological domain-aligned fitness dataset for training
    the Scikit-learn Random Forest recommendation models.
    """
    rng = np.random.default_rng(42)

    goals = [
        "Weight Loss",
        "Muscle Gain",
        "General Fitness",
        "Improve Endurance",
        "Maintain Weight",
    ]
    genders = ["Male", "Female"]

    rows = []
    for _ in range(n_samples):
        age = int(rng.integers(18, 65))
        gender = rng.choice(genders)
        height = round(float(rng.normal(172 if gender == "Male" else 162, 8)), 1)
        height = max(148.0, min(202.0, height))

        bmi = round(float(rng.uniform(17.0, 34.5)), 1)
        weight = round(bmi * ((height / 100.0) ** 2), 1)

        # Assign fitness goal with realistic correlation to BMI
        if bmi >= 27.0:
            goal = rng.choice(["Weight Loss", "General Fitness", "Improve Endurance"], p=[0.65, 0.20, 0.15])
        elif bmi < 19.5:
            goal = rng.choice(["Muscle Gain", "General Fitness", "Maintain Weight"], p=[0.65, 0.20, 0.15])
        else:
            goal = rng.choice(goals)

        avg_steps = int(rng.integers(3200, 14500))
        avg_workout_mins = int(rng.integers(15, 85))
        avg_calories = int(avg_workout_mins * rng.uniform(6.5, 11.0) + (avg_steps * 0.025))
        consistency_ratio = round(float(rng.uniform(0.2, 1.0)), 2)
        sleep_hours = round(float(rng.uniform(5.5, 8.8)), 1)
        water_liters = round(float(rng.uniform(1.5, 3.8)), 1)

        # Determine target archetype label & numerical targets
        if goal == "Weight Loss":
            if consistency_ratio < 0.5 or avg_steps < 6500:
                regimen_class = "Metabolic Fat-Burn Foundation"
                rec_duration = max(35, min(55, int(avg_workout_mins * 1.15 + 10)))
                rec_steps = max(8500, min(11500, int(avg_steps + 2200)))
            else:
                regimen_class = "HIIT & Resistance Conditioning"
                rec_duration = max(45, min(65, int(avg_workout_mins * 1.1 + 8)))
                rec_steps = max(10000, min(13000, int(avg_steps + 1500)))
            rec_active_cal = int(rec_duration * 9.5 + (rec_steps * 0.02))

        elif goal == "Muscle Gain":
            if consistency_ratio < 0.55:
                regimen_class = "Full-Body Hypertrophy Builder"
                rec_duration = max(45, min(60, int(avg_workout_mins + 12)))
            else:
                regimen_class = "Progressive Split Strength & Hypertrophy"
                rec_duration = max(50, min(75, int(avg_workout_mins + 10)))
            rec_steps = max(7500, min(10000, int(avg_steps * 0.95 + 800)))
            rec_active_cal = int(rec_duration * 8.2 + (rec_steps * 0.018))

        elif goal == "Improve Endurance":
            regimen_class = "Aerobic Zone-2 & Tempo Stamina Plan"
            rec_duration = max(45, min(75, int(avg_workout_mins * 1.15 + 10)))
            rec_steps = max(10500, min(14000, int(avg_steps + 1800)))
            rec_active_cal = int(rec_duration * 10.2 + (rec_steps * 0.022))

        elif goal == "Maintain Weight":
            regimen_class = "Balanced Functional & Mobility Routine"
            rec_duration = max(35, min(55, int(avg_workout_mins * 1.05 + 5)))
            rec_steps = max(8500, min(10500, int(avg_steps + 900)))
            rec_active_cal = int(rec_duration * 8.0 + (rec_steps * 0.02))

        else:  # General Fitness
            regimen_class = "Hybrid Cardio-Strength Wellness Plan"
            rec_duration = max(40, min(60, int(avg_workout_mins * 1.1 + 7)))
            rec_steps = max(9000, min(11500, int(avg_steps + 1300)))
            rec_active_cal = int(rec_duration * 8.6 + (rec_steps * 0.02))

        # Adjust for age safety
        if age >= 50:
            rec_duration = min(rec_duration, 50)
            rec_steps = min(rec_steps, 10500)

        rows.append(
            {
                "age": age,
                "gender": gender,
                "height_cm": height,
                "weight_kg": weight,
                "bmi": bmi,
                "fitness_goal": goal,
                "avg_daily_steps": avg_steps,
                "avg_workout_duration": avg_workout_mins,
                "avg_calories_burned": avg_calories,
                "consistency_ratio": consistency_ratio,
                "avg_sleep_hours": sleep_hours,
                "avg_water_liters": water_liters,
                "target_regimen_class": regimen_class,
                "recommended_duration_min": rec_duration,
                "recommended_daily_steps": rec_steps,
                "recommended_active_calories": rec_active_cal,
            }
        )

    df = pd.DataFrame(rows)
    df.to_csv(csv_path, index=False)
    return df


def train_and_save_model():
    """Train Random Forest Classifier and Regressor models and persist artifacts."""
    if not os.path.exists(DATASET_PATH):
        df = generate_training_dataset(DATASET_PATH)
    else:
        df = pd.read_csv(DATASET_PATH)
        if len(df) < 50:
            df = generate_training_dataset(DATASET_PATH)

    gender_encoder = LabelEncoder()
    goal_encoder = LabelEncoder()
    regimen_encoder = LabelEncoder()

    df["gender_enc"] = gender_encoder.fit_transform(df["gender"])
    df["goal_enc"] = goal_encoder.fit_transform(df["fitness_goal"])
    y_class = regimen_encoder.fit_transform(df["target_regimen_class"])

    feature_cols = [
        "age",
        "gender_enc",
        "height_cm",
        "weight_kg",
        "bmi",
        "goal_enc",
        "avg_daily_steps",
        "avg_workout_duration",
        "avg_calories_burned",
        "consistency_ratio",
        "avg_sleep_hours",
        "avg_water_liters",
    ]

    X = df[feature_cols].values
    y_reg = df[
        [
            "recommended_duration_min",
            "recommended_daily_steps",
            "recommended_active_calories",
        ]
    ].values

    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42
    )

    clf = RandomForestClassifier(
        n_estimators=120, max_depth=10, random_state=42
    )
    clf.fit(X_train, yc_train)
    acc = accuracy_score(yc_test, clf.predict(X_test))

    reg = RandomForestRegressor(
        n_estimators=120, max_depth=10, random_state=42
    )
    reg.fit(X_train, yr_train)
    r2 = r2_score(yr_test, reg.predict(X_test))

    artifact = {
        "classifier": clf,
        "regressor": reg,
        "gender_encoder": gender_encoder,
        "goal_encoder": goal_encoder,
        "regimen_encoder": regimen_encoder,
        "feature_cols": feature_cols,
        "metrics": {
            "classification_accuracy": round(float(acc) * 100, 2),
            "regression_r2_score": round(float(r2), 4),
            "dataset_samples": len(df),
        },
    }

    joblib.dump(artifact, MODEL_PATH)
    return artifact


if __name__ == "__main__":
    print("Generating dataset and training Scikit-learn Random Forest models...")
    generate_training_dataset(DATASET_PATH)
    bundle = train_and_save_model()
    print(f"Dataset saved to: {DATASET_PATH}")
    print(f"Trained model saved to: {MODEL_PATH}")
    print("Training Metrics:", bundle["metrics"])
