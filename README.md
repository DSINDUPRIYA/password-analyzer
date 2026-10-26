# Password Strength Analyzer with Breach Check

A cybersecurity awareness app that evaluates password length, character variety, and predictable patterns, then offers practical improvement tips. It can also check Have I Been Pwned's Pwned Passwords database using the SHA-1 range API.

## Run locally

1. Install Python 3.7 or later.
2. Install dependencies with `python -m pip install -r requirements.txt`.
3. Start the app with `python app.py`.
4. Open `http://localhost:5000`.

## Privacy

Strength analysis runs in the browser. For breach checks, the browser computes a SHA-1 hash and sends only its first five characters to this app. The server relays the matching hash range from Have I Been Pwned, and the browser compares the remaining hash locally. The full password is never sent to the app or breach service.

SHA-1 is used only because the breach lookup API requires it; it is not a password storage method. A no-match result only means the password was not found in the data checked. Strength labels are educational estimates, not a guarantee of safety. Use long, unique passwords and a password manager.

## Deploy on Render

The included `render.yaml` configures a Python web service. Connect this repository in Render to deploy it. Render builds with `pip install -r requirements.txt` and starts the app with Gunicorn. The public service should use HTTPS for browser cryptography and should have ordinary rate limits for abuse protection.

## Main files

- `index.html` — page content and controls.
- `static/style.css` — responsive dashboard styles.
- `static/app.js` — local strength analysis and client-side hash comparison.
- `app.py` — Flask page server and five-character hash-prefix relay.
- `requirements.txt` — Python dependencies.
