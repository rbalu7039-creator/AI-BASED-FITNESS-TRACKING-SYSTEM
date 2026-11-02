import os
import shutil
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
IS_VERCEL = bool(os.environ.get("VERCEL"))

if IS_VERCEL:
    INSTANCE_DIR = "/tmp/instance"
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    DEFAULT_DB_PATH = os.path.join(INSTANCE_DIR, "fitness.db")
    # In Vercel serverless environment, copy pre-seeded database to /tmp if it doesn't exist yet
    src_db = os.path.join(BASE_DIR, "instance", "fitness.db")
    if os.path.exists(src_db) and not os.path.exists(DEFAULT_DB_PATH):
        try:
            shutil.copy2(src_db, DEFAULT_DB_PATH)
        except Exception as e:
            print(f"Warning: could not copy pre-seeded database to /tmp: {e}")
else:
    INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    DEFAULT_DB_PATH = os.path.join(INSTANCE_DIR, "fitness.db")


class Config:
    """Application configuration settings with secure defaults."""

    SECRET_KEY = os.environ.get(
        "FITNESS_SECRET_KEY",
        "vtu-ai-fitness-tracker-secure-secret-key-2026-x99a",
    )
    DATABASE_PATH = os.environ.get(
        "FITNESS_DB_PATH",
        DEFAULT_DB_PATH,
    )
    AI_DATASET_PATH = os.path.join(BASE_DIR, "ai", "dataset.csv")
    AI_MODEL_PATH = os.path.join(BASE_DIR, "ai", "fitness_model.pkl")

    # Session and security settings
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("FLASK_ENV") == "production"
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    JSON_SORT_KEYS = False
