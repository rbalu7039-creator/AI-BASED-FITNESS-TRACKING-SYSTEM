from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.activities import activities_bp
from routes.analytics import analytics_bp
from routes.recommendations import recommendations_bp

__all__ = [
    "auth_bp",
    "dashboard_bp",
    "activities_bp",
    "analytics_bp",
    "recommendations_bp",
]
