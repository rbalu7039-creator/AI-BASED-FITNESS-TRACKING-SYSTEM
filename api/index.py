import os
import sys
import urllib.parse
from werkzeug.middleware.proxy_fix import ProxyFix

# Add project root directory to Python module search path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app


class VercelPathFixMiddleware:
    """
    WSGI Middleware to fix PATH_INFO on Vercel Serverless Functions.
    Vercel rewrites invoke /api/index with PATH_INFO='/api/index' while storing
    the real client-requested URI in HTTP_X_FORWARDED_URI, HTTP_X_MATCHED_PATH,
    or the __path query parameter.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        real_path = None

        # A. Check HTTP headers for original client request path
        for h in [
            "HTTP_X_FORWARDED_URI",
            "HTTP_X_ORIGINAL_URI",
            "HTTP_X_FORWARDED_PATH",
            "HTTP_X_REWRITE_URL",
        ]:
            val = environ.get(h)
            if val and not val.startswith("/api/index"):
                real_path = val.split("?")[0]
                break

        # B. Check __path parameter anywhere in query string or headers
        if not real_path:
            search_blob = "&".join(
                [
                    environ.get("QUERY_STRING", ""),
                    environ.get("HTTP_X_MATCHED_PATH", ""),
                    str(environ.get("HTTP_X_FORWARDED_URI", "")),
                ]
            )
            if "__path=" in search_blob:
                parts = search_blob.split("__path=")
                if len(parts) > 1:
                    raw_val = parts[1].split("&")[0]
                    real_path = "/" + urllib.parse.unquote(raw_val).lstrip("/")

        # C. Check HTTP_X_NOW_ROUTE_MATCHES (Vercel rewrite regex capture, e.g. 1=login)
        if not real_path:
            route_matches = environ.get("HTTP_X_NOW_ROUTE_MATCHES", "")
            if "1=" in route_matches:
                m_parts = route_matches.split("1=")
                if len(m_parts) > 1:
                    raw_m = m_parts[1].split("&")[0]
                    real_path = "/" + urllib.parse.unquote(raw_m).lstrip("/")

        # D. Clean up __path from QUERY_STRING if present
        qs = environ.get("QUERY_STRING", "")
        if "__path=" in qs:
            params = urllib.parse.parse_qs(qs)
            remaining_params = {k: v for k, v in params.items() if k != "__path"}
            environ["QUERY_STRING"] = urllib.parse.urlencode(remaining_params, doseq=True)

        # Set PATH_INFO
        if real_path and real_path != "/":
            environ["PATH_INFO"] = "/" + real_path.lstrip("/")
        else:
            path_info = environ.get("PATH_INFO", "")
            if path_info.startswith("/api/index"):
                remainder = path_info[len("/api/index") :]
                environ["PATH_INFO"] = "/" + remainder.lstrip("/") if remainder else "/"
            elif not path_info:
                environ["PATH_INFO"] = "/"

        return self.wsgi_app(environ, start_response)


# Apply Werkzeug ProxyFix and VercelPathFixMiddleware
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)

# Expose both app and handler for Vercel Serverless Functions
handler = app

if __name__ == "__main__":
    app.run()

