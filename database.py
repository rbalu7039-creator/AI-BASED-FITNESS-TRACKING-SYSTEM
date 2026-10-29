import sqlite3
import json
from datetime import datetime, timedelta
from flask import g
from werkzeug.security import generate_password_hash
from config import Config


def get_db():
    """Return a SQLite database connection for the current Flask request context."""
    if "db" not in g:
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
    return g.db


def get_standalone_db():
    """Return a standalone SQLite connection outside of request context."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def close_db(e=None):
    """Close the request-scoped SQLite connection."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Initialize SQLite database tables and seed demo account if empty."""
    conn = get_standalone_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            age INTEGER NOT NULL CHECK(age >= 10 AND age <= 120),
            gender TEXT NOT NULL,
            height REAL NOT NULL CHECK(height >= 50 AND height <= 280),
            weight REAL NOT NULL CHECK(weight >= 20 AND weight <= 350),
            fitness_goal TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # 2. Fitness_Activities Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Fitness_Activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            activity_date TEXT NOT NULL,
            weight REAL NOT NULL,
            steps INTEGER NOT NULL DEFAULT 0,
            calories_burned REAL NOT NULL DEFAULT 0,
            workout_duration INTEGER NOT NULL DEFAULT 0,
            workout_type TEXT NOT NULL,
            water_intake REAL NOT NULL DEFAULT 0,
            sleep_duration REAL NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        )
        """
    )

    # 3. Fitness_Goals Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Fitness_Goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            daily_step_goal INTEGER NOT NULL DEFAULT 10000,
            daily_calorie_goal REAL NOT NULL DEFAULT 500,
            daily_workout_goal INTEGER NOT NULL DEFAULT 45,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        )
        """
    )

    # 4. AI_Recommendations Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS AI_Recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recommendation TEXT NOT NULL,
            recommendation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            recommendation_type TEXT NOT NULL DEFAULT 'Comprehensive AI Plan',
            FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        )
        """
    )

    # Helpful indexes for fast analytics and lookup
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_activities_user_date ON Fitness_Activities(user_id, activity_date)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_recommendations_user ON AI_Recommendations(user_id)"
    )

    conn.commit()
    _seed_demo_account(conn)
    conn.close()


def _seed_demo_account(conn):
    """Create a pre-populated demo user account for instant viva demonstration."""
    cursor = conn.cursor()
    demo_email = "demo@fitai.com"
    today = datetime.now().date()
    existing = cursor.execute(
        "SELECT id FROM Users WHERE email = ?", (demo_email,)
    ).fetchone()
    if existing:
        demo_user_id = existing["id"]
        latest_row = cursor.execute(
            "SELECT MAX(activity_date) AS max_date FROM Fitness_Activities WHERE user_id = ?",
            (demo_user_id,),
        ).fetchone()
        if latest_row and latest_row["max_date"]:
            try:
                latest_dt = datetime.strptime(latest_row["max_date"], "%Y-%m-%d").date()
                delta_days = (today - latest_dt).days
                if delta_days > 0:
                    rows = cursor.execute(
                        "SELECT id, activity_date FROM Fitness_Activities WHERE user_id = ?",
                        (demo_user_id,),
                    ).fetchall()
                    for r in rows:
                        old_dt = datetime.strptime(r["activity_date"], "%Y-%m-%d").date()
                        new_dt_str = (old_dt + timedelta(days=delta_days)).strftime("%Y-%m-%d")
                        cursor.execute(
                            "UPDATE Fitness_Activities SET activity_date = ? WHERE id = ?",
                            (new_dt_str, r["id"]),
                        )
                    conn.commit()
            except ValueError:
                pass
        return

    password_hash = generate_password_hash("Demo@1234")
    cursor.execute(
        """
        INSERT INTO Users (full_name, email, password_hash, age, gender, height, weight, fitness_goal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "Aarav Sharma",
            demo_email,
            password_hash,
            22,
            "Male",
            176.0,
            74.2,
            "Weight Loss",
        ),
    )
    user_id = cursor.lastrowid

    # Default goals for demo user
    cursor.execute(
        """
        INSERT INTO Fitness_Goals (user_id, daily_step_goal, daily_calorie_goal, daily_workout_goal)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, 10000, 550, 50),
    )

    # Seed 30 days of realistic progressive fitness logs
    today = datetime.now().date()
    workout_cycle = [
        ("Running", 9600, 540, 48, 2.8, 7.5),
        ("Strength Training", 7800, 460, 55, 3.0, 7.8),
        ("Cycling", 10400, 590, 50, 3.1, 7.2),
        ("Gym", 8500, 510, 60, 2.9, 8.0),
        ("Yoga", 6900, 320, 40, 2.6, 8.2),
        ("Cardio", 11200, 630, 52, 3.3, 7.6),
        ("Walking", 9100, 410, 45, 2.7, 7.9),
    ]

    base_weight = 76.4
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        day_str = day.strftime("%Y-%m-%d")
        w_type, steps_base, cal_base, dur_base, water, sleep = workout_cycle[
            (29 - offset) % len(workout_cycle)
        ]

        # Progressive improvement over the 30 days
        progress_factor = (29 - offset) / 29.0
        weight = round(base_weight - (progress_factor * 2.2), 1)
        steps = int(steps_base + (progress_factor * 1100) + ((offset % 3 - 1) * 250))
        calories = round(cal_base + (progress_factor * 65) + ((offset % 4 - 1.5) * 18), 0)
        duration = int(dur_base + (progress_factor * 8))

        cursor.execute(
            """
            INSERT INTO Fitness_Activities
            (user_id, activity_date, weight, steps, calories_burned, workout_duration, workout_type, water_intake, sleep_duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                day_str,
                weight,
                steps,
                calories,
                duration,
                w_type,
                water,
                sleep,
            ),
        )

    # Update user's current weight to latest activity weight
    cursor.execute("UPDATE Users SET weight = ? WHERE id = ?", (74.2, user_id))
    conn.commit()
