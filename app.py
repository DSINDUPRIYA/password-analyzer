"""Flask app for the Securely password health check."""

import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, Response, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.get("/")
def home():
    return send_from_directory(app.root_path, "index.html")


@app.post("/api/pwned")
def pwned_range():
    """Relay a five-character SHA-1 prefix; never accept a password here."""
    data = request.get_json(silent=True) or {}
    prefix = str(data.get("prefix", "")).upper()
    if len(prefix) != 5 or any(char not in "0123456789ABCDEF" for char in prefix):
        return jsonify({"error": "A five-character hexadecimal hash prefix is required."}), 400

    upstream_request = Request(
        "https://api.pwnedpasswords.com/range/{}".format(prefix),
        headers={"User-Agent": "Securely-Password-Health-Check", "Add-Padding": "true"},
    )
    try:
        with urlopen(upstream_request, timeout=10) as upstream:
            body = upstream.read().decode("ascii")
        return Response(body, content_type="text/plain; charset=us-ascii", headers={"Cache-Control": "no-store"})
    except (HTTPError, URLError, OSError, UnicodeError):
        return jsonify({"error": "The breach lookup service is temporarily unavailable."}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
