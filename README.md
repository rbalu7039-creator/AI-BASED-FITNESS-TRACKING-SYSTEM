# AI BASED FITNESS TRACKING SYSTEM (FitAI Pulse)

A complete, production-ready, AI-powered full-stack fitness tracking web application designed for a **VTU Final-Year Engineering Major Project** demonstration and viva.

---

## 1. Project Introduction

**AI Based Fitness Tracking System (FitAI Pulse)** is an end-to-end health, biometric, and workout intelligence platform built with **Python Flask**, **SQLite3**, **Scikit-learn**, **Bootstrap 5**, and **Chart.js**. It empowers users to track daily workouts, step counts, calorie expenditure, hydration, sleep, and body weight while receiving personalized workout regimens and recovery plans synthesized by a hybrid **Scikit-learn Random Forest Machine Learning & Exercise Physiology Rule Engine**.

---

## 2. Project Objectives

1. **Biometric & Activity Tracking**: Enable users to log, edit, filter, and monitor daily physical activities (steps, calories burned, workout duration, workout type, water intake, sleep duration, and body weight).
2. **Metabolic Calculators**: Provide accurate **BMI (Body Mass Index)** classification with a visual scale and **BMR (Basal Metabolic Rate) / TDEE** estimation using the **Mifflin-St Jeor equation**.
3. **Composite Fitness Scoring**: Compute a transparent daily **Fitness Score out of 100** categorizing users into *Beginner*, *Active*, or *Highly Active* tiers.
4. **AI-Powered Personalization**: Train and deploy a **Scikit-learn Random Forest Classifier & Multi-Output Regressor** on physiological and activity features to recommend customized 7-day workout schedules, daily step targets, workout durations, safe calorie targets, and recovery strategies.
5. **Interactive Visual Analytics**: Render 6 real-time **Chart.js** time-series charts with daily, weekly, monthly, and custom date-range filters.

---

## 3. Key Features

- **Premium Glassmorphism UI/UX**: Inspired by Apple Fitness+ and Fitbit dashboards with one-click **Dark Mode / Light Mode** persistence, responsive sidebar navigation, and smooth animations.
- **Secure Authentication & Session Management**: Password hashing via `Werkzeug` (`scrypt`/`pbkdf2`), session-based route protection, unique email validation, password visibility toggle, and CSRF token verification.
- **Dynamic Main Dashboard**:
  - Personalized welcome header with current date and fitness goal badge.
  - 6 live summary cards (Weight, Daily Steps, Calories Burned, Workout Duration, BMI, and Fitness Score).
  - Animated progress bars for Steps, Calories, Workout Duration, and Overall Goal Completion %.
  - Circular SVG Fitness Score ring indicator with transparent point breakdown (Steps: 35 pts, Calories: 25 pts, Workout: 25 pts, Recovery: 15 pts).
- **Full CRUD Activity Tracker**: Add, edit, delete, search by date, and filter by workout type (`Running`, `Walking`, `Gym`, `Cycling`, `Yoga`, `Cardio`, `Strength Training`, `Other`).
- **BMI & BMR / TDEE Calculator**: Standard adult BMI thresholds with an interactive pointer gauge and Mifflin-St Jeor BMR calculation across 4 activity multipliers (`Sedentary`, `Lightly Active`, `Moderately Active`, `Very Active`).
- **Hybrid AI Fitness Recommendation System**: Analyzes user age, gender, height, weight, BMI, fitness goal, 14-day average steps, workout duration, calories burned, sleep, hydration, and logging consistency.
- **6 Interactive Chart.js Analytics Charts**: Weekly steps, 30-day monthly step trajectory, weight progression, active calories burned, workout duration trends, and Fitness Score trends.

---

## 4. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Glassmorphism + Dark/Light Theme), JavaScript (ES6+), Bootstrap 5.3, Chart.js 4.4, Font Awesome 6.5 |
| **Backend** | Python 3, Flask, Flask-CORS, RESTful JSON API Architecture |
| **Database** | SQLite3 (`instance/fitness.db`) with Foreign Key constraints and indexed queries |
| **AI / Machine Learning** | Scikit-learn (`RandomForestClassifier`, `RandomForestRegressor`, `LabelEncoder`), NumPy, Pandas, Joblib |
| **Security** | Werkzeug Password Hashing, Flask HTTPOnly Sessions, CSRF Token Validation, Parameterized SQL Queries |

---

## 5. System Architecture

```
+-------------------------------------------------------------------+
|                        FRONTEND PRESENTATION                      |
|  HTML5 Templates + CSS3 Glassmorphism + Bootstrap 5 + Chart.js    |
|  (index, login, register, dashboard, activities, analytics, AI)   |
+---------------------------------+---------------------------------+
                                  |
                     Fetch REST API (JSON + CSRF)
                                  |
                                  v
+-------------------------------------------------------------------+
|                       PYTHON FLASK BACKEND                        |
|  Blueprints: auth_bp | dashboard_bp | activities_bp |             |
|              analytics_bp | recommendations_bp                    |
+-----------------+-------------------------------+-----------------+
                  |                               |
                  v                               v
+-----------------------------------+   +---------------------------+
|      SQLITE3 DATABASE LAYER       |   |   AI / ML ENGINE MODULE   |
|  instance/fitness.db              |   |  ai/recommendation_engine |
|  - Users                          |   |  ai/train_model.py        |
|  - Fitness_Activities             |   |  ai/dataset.csv           |
|  - Fitness_Goals                  |   |  Scikit-learn Random      |
|  - AI_Recommendations             |   |  Forest + Physiology Rules|
+-----------------------------------+   +---------------------------+
```

---

## 6. Database Design

The SQLite database (`instance/fitness.db`) is automatically initialized on startup with 4 normalized tables:

1. **`Users`**: `id` (PK), `full_name`, `email` (UNIQUE), `password_hash`, `age`, `gender`, `height`, `weight`, `fitness_goal`, `created_at`
2. **`Fitness_Activities`**: `id` (PK), `user_id` (FK -> `Users.id`), `activity_date`, `weight`, `steps`, `calories_burned`, `workout_duration`, `workout_type`, `water_intake`, `sleep_duration`, `created_at`
3. **`Fitness_Goals`**: `id` (PK), `user_id` (FK -> `Users.id`), `daily_step_goal`, `daily_calorie_goal`, `daily_workout_goal`, `created_at`
4. **`AI_Recommendations`**: `id` (PK), `user_id` (FK -> `Users.id`), `recommendation` (JSON), `recommendation_date`, `recommendation_type`

---

## 7. Installation & Setup Instructions (Windows PowerShell / VS Code)

Open the `AI-Fitness-Tracker` folder in **VS Code**, open a **Windows PowerShell** terminal, and run the following commands:

```powershell
# 1. Create a Python virtual environment
python -m venv venv

# 2. Activate the virtual environment
venv\Scripts\activate

# 3. Install all required Python dependencies
pip install -r requirements.txt

# 4. (Optional) Re-train the Scikit-learn AI model and regenerate dataset.csv
python ai/train_model.py

# 5. Start the Flask application server
python app.py
```

### How to Access the Website
Open your browser and navigate to:
**http://127.0.0.1:5000**

> **Pre-Populated Demo Account for Viva Demonstration:**
> - **Email**: `demo@fitai.com`
> - **Password**: `Demo@1234`
> *(Includes 30 days of pre-populated workout logs for immediate analytics & AI demonstration, or you can register a brand-new user account on `/register`!)*

---

## 8. REST API Endpoint Documentation

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/register` | Register a new user account and initialize default goals |
| **Auth** | `POST` | `/api/login` | Authenticate user and establish session |
| **Auth** | `POST` | `/api/logout` | Clear session and log out user |
| **Auth** | `GET` | `/api/profile` | Retrieve user profile, goals, BMI, and BMR details |
| **Auth** | `PUT` | `/api/profile` | Update user biometric profile and primary fitness goal |
| **Dashboard** | `GET` | `/api/dashboard` | Get summary cards, progress %, fitness score, and 7-day trend |
| **Activities** | `GET` | `/api/activities` | List user activities (supports `?date=` and `?workout_type=`) |
| **Activities** | `POST` | `/api/activities` | Log a new daily workout and biometric entry |
| **Activities** | `PUT` | `/api/activities/<id>` | Edit an existing fitness activity record |
| **Activities** | `DELETE` | `/api/activities/<id>` | Delete a specific fitness activity record |
| **Calculators** | `POST` | `/api/calculate-bmi` | Calculate BMI, adult category, visual scale %, and guidance |
| **Calculators** | `POST` | `/api/calculate-bmr` | Calculate Mifflin-St Jeor BMR and TDEE across activity levels |
| **AI Coach** | `GET` | `/api/ai/recommendations` | Fetch latest AI fitness recommendation plan & SQLite history |
| **AI Coach** | `POST` | `/api/ai/recommendations` | Run Scikit-learn + rule engine on user telemetry & save plan |
| **Analytics** | `GET` | `/api/analytics/weekly` | Get 7-day / custom range analytics, summary stats & comparisons |
| **Analytics** | `GET` | `/api/analytics/monthly` | Get 30-day monthly analytics and workout type distribution |
| **Goals** | `GET` | `/api/goals` | Retrieve user's daily step, calorie, and workout duration goals |
| **Goals** | `POST/PUT` | `/api/goals` | Create or update user's daily fitness goals |

---

## 9. AI Recommendation Engine Explanation

Located in `ai/train_model.py` and `ai/recommendation_engine.py`, the AI engine operates in two stages:
1. **Supervised Machine Learning Inference**:
   - Trained on `ai/dataset.csv` (450 physiological & workout feature profiles).
   - Uses a `RandomForestClassifier` (94.4% test accuracy) to classify the user into the optimal training regimen archetype (e.g., *HIIT & Resistance Conditioning*, *Progressive Split Strength & Hypertrophy*, *Aerobic Zone-2 & Tempo Stamina Plan*, etc.).
   - Uses a multi-output `RandomForestRegressor` ($R^2 = 0.78$) to predict personalized numerical targets for **Daily Workout Duration (mins)**, **Daily Step Target**, and **Active Calorie Expenditure (kcal)**.
2. **Exercise Physiology & Safety Rule Layer**:
   - Enforces safe physiological bounds by age and BMI, computes Mifflin-St Jeor BMR/TDEE calorie intake guidance without extreme caloric restriction, and analyzes 14-day sleep, water intake, and logging consistency to generate actionable recovery and weekly progression recommendations.

---

## 10. Troubleshooting Guide

- **Port 5000 already in use**: Close any existing terminal running `python app.py`, or change the port in `app.py` (`app.run(port=5001)`).
- **PowerShell script execution policy error on `venv\Scripts\activate`**: Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell before activating the virtual environment.
- **Resetting the Database**: Delete `instance/fitness.db` and restart `python app.py` — the application will automatically recreate all tables and re-seed the demo account.
