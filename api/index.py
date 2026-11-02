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
        # 1. Check HTTP headers provided by Vercel edge proxy
        forwarded_uri = (
            environ.get("HTTP_X_FORWARDED_URI")
            or environ.get("HTTP_X_MATCHED_PATH")
            or environ.get("HTTP_X_ORIGINAL_URI")
            or environ.get("HTTP_X_NOW_ROUTE_MATCHES")
        )

        real_path = None

        if forwarded_uri and not forwarded_uri.startswith("/api/index"):
            real_path = forwarded_uri.split("?")[0]
        else:
            # 2. Check query string for __path parameter
            qs = environ.get("QUERY_STRING", "")
            if "__path=" in qs:
                params = urllib.parse.parse_qs(qs)
                captured = params.get("__path", [""])[0]
                real_path = "/" + captured.lstrip("/")
                # Clean up __path from QUERY_STRING so application routes don't see it
                remaining_params = {k: v for k, v in params.items() if k != "__path"}
                environ["QUERY_STRING"] = urllib.parse.urlencode(remaining_params, doseq=True)

        if real_path:
            if not real_path.startswith("/"):
                real_path = "/" + real_path
            environ["PATH_INFO"] = real_path
        else:
            # 3. Fallback: If PATH_INFO starts with /api/index, map to root or remainder
            path_info = environ.get("PATH_INFO", "")
            if path_info.startswith("/api/index"):
                remainder = path_info[len("/api/index"):]
                if not remainder or remainder == "/":
                    environ["PATH_INFO"] = "/"
                else:
                    if not remainder.startswith("/"):
                        remainder = "/" + remainder
                    environ["PATH_INFO"] = remainder
            elif not path_info:
                environ["PATH_INFO"] = "/"

        return self.wsgi_app(environ, start_response)


# Apply Werkzeug ProxyFix and VercelPathFixMiddleware
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)

if __name__ == "__main__":
    app.run()
