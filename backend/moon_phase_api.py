import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import ephem
import argparse
from zoneinfo import ZoneInfo  # Python 3.9+

import requests
from flask import Response

# Set static folder to the symlinked Next.js export (e.g., backend/app)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "app")

# Re-initialize Flask with static_folder set to your symlink
CORS_ORIGINS = "*"
proxy_frontend = False  # Will be set by CLI flag
app = None

def create_app():
    global app
    if proxy_frontend:
        app = Flask(__name__, static_folder=None)
    else:
        app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
    CORS(app)  # Allow all origins for CORS
    return app

create_app()

# Example city-to-coordinates mapping
CITY_COORDS = {
    "San Francisco": {"lat": 37.7749, "lon": -122.4194},
    "New York": {"lat": 40.7128, "lon": -74.0060},
    "London": {"lat": 51.5074, "lon": -0.1278},
    "Tokyo": {"lat": 35.6895, "lon": 139.6917},
    "Cape Town": {"lat": -33.9249, "lon": 18.4241},
    "Hong Kong": {"lat": 22.3193, "lon": 114.1694},
    "Melbourne": {"lat": -37.8136, "lon": 144.9631},
}

CITY_TIMEZONES = {
    "San Francisco": "America/Los_Angeles",
    "New York": "America/New_York",
    "London": "Europe/London",
    "Tokyo": "Asia/Tokyo",
    "Cape Town": "Africa/Johannesburg",  # South Africa Standard Time
    "Hong Kong": "Asia/Hong_Kong",
    "Melbourne": "Australia/Melbourne",
}

MAJOR_PHASES = [
    ("New Moon", ephem.previous_new_moon, ephem.next_new_moon),
    ("First Quarter", ephem.previous_first_quarter_moon, ephem.next_first_quarter_moon),
    ("Full Moon", ephem.previous_full_moon, ephem.next_full_moon),
    ("Last Quarter", ephem.previous_last_quarter_moon, ephem.next_last_quarter_moon),
]

SYNODIC_MONTH = 29.53058867  # average length of lunar month in days

NEXTJS_URL = "http://localhost:3000"

# Remove the old proxy_frontend route and replace with static file serving


def proxy_to_nextjs(path):
    # Ensure no double slashes in URL
    print(f"[Proxy] Path: {path}")
    if path.startswith("/"):
        path = path[1:]
        print(f"[Proxy] Path: {path}")
    url = f"{NEXTJS_URL}/{path}" if path else NEXTJS_URL
    print(f"[Proxy] Proxying to: {url}")
    resp = requests.request(
        method=request.method,
        url=url,
        headers={key: value for key, value in request.headers if key.lower() != 'host'},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
        stream=True
    )
    print(f"[Proxy] Response status: {resp.status_code}")
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    response = Response(resp.content, resp.status_code, headers)
    return response


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    print(f"[Proxy] Path: {path}")
    API_PREFIXES = ('moon-phase', 'moon-phases')
    if proxy_frontend:
        # Only handle API routes locally
        if any(path.startswith(prefix) for prefix in API_PREFIXES):
            pass  # Let Flask handle API endpoints
        else:
            print(f"[Proxy] We are proxying to Next.js")
            return proxy_to_nextjs(path)
    # Only serve static files if proxy_frontend is False
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


def get_city_coords(city):
    return CITY_COORDS.get(city)


def to_local(dt_utc, city):
    tz_name = CITY_TIMEZONES.get(city)
    if not tz_name:
        return None
    return dt_utc.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(tz_name))


def get_moon_data(latitude, longitude, date, city=None):
    observer = ephem.Observer()
    observer.lat = str(latitude)
    observer.long = str(longitude)
    observer.date = date.strftime('%Y/%m/%d')
    moon = ephem.Moon()
    moon.compute(observer)
    illuminated_fraction = moon.moon_phase

    # Moon's age in days since last new moon
    last_new_moon = ephem.previous_new_moon(observer.date)
    moon_age = (observer.date.datetime() - last_new_moon.datetime()).days + \
               (observer.date.datetime() - last_new_moon.datetime()).seconds / 86400

    # Determine if today is a major phase (in local time, for the whole day)
    today_utc = observer.date.datetime().date()
    tz_name = CITY_TIMEZONES.get(city) if city else None
    today_local = observer.date.datetime().astimezone(ZoneInfo(tz_name)).date() if tz_name else today_utc
    major_phase_today = None
    for phase_name, prev_func, next_func in MAJOR_PHASES:
        # Find the next occurrence of the phase after yesterday
        phase_time_utc = next_func(observer.date - 1.0).datetime()
        phase_time_local = to_local(phase_time_utc, city) if city else None
        if (phase_time_local and phase_time_local.date() == today_local) or (not phase_time_local and phase_time_utc.date() == today_utc):
            major_phase_today = phase_name
            break

    # Find the next major phase
    next_phases = []
    for phase_name, _, next_func in MAJOR_PHASES:
        next_time_utc = next_func(observer.date).datetime()
        next_time_local = to_local(next_time_utc, city) if city else None
        next_phases.append((phase_name, next_time_utc, next_time_local))
    # Find the soonest next phase
    next_phase_name, next_phase_time_utc, next_phase_time_local = min(next_phases, key=lambda x: x[1])

    is_waxing = moon_age < (SYNODIC_MONTH / 2)

    # Add previous/next new moon local times
    last_new_moon_utc = last_new_moon.datetime()
    last_new_moon_local = to_local(last_new_moon_utc, city) if city else None
    next_new_moon_utc = ephem.next_new_moon(observer.date).datetime()
    next_new_moon_local = to_local(next_new_moon_utc, city) if city else None

    return {
        "illuminated_fraction": illuminated_fraction,
        "major_phase": major_phase_today,
        "moon_age_days": moon_age,
        "is_waxing": is_waxing,
        "next_major_phase": {
            "name": next_phase_name,
            "date_utc": next_phase_time_utc.isoformat(),
            "date_local": next_phase_time_local.isoformat() if next_phase_time_local else None
        },
        "previous_new_moon_utc": last_new_moon_utc.isoformat(),
        "previous_new_moon_local": last_new_moon_local.isoformat() if last_new_moon_local else None,
        "next_new_moon_utc": next_new_moon_utc.isoformat(),
        "next_new_moon_local": next_new_moon_local.isoformat() if next_new_moon_local else None
    }


@app.route('/moon-phase', methods=['GET'])
def moon_phase():
    city = request.args.get('city')
    coords = get_city_coords(city)
    if not city or not coords:
        return jsonify({
            "error": "City not found. Available cities: " + ", ".join(CITY_COORDS.keys())
        }), 400
    now = datetime.utcnow()
    moon_data = get_moon_data(coords['lat'], coords['lon'], now, city=city)
    tz_name = CITY_TIMEZONES.get(city)
    now_local = to_local(now, city) if tz_name else None
    return jsonify({
        "city": city,
        "latitude": coords['lat'],
        "longitude": coords['lon'],
        "date_utc": now.isoformat(),
        "date_local": now_local.isoformat() if now_local else None,
        **moon_data
    })


@app.route('/moon-phases', methods=['GET'])
def moon_phases():
    city = request.args.get('city')
    date_from_str = request.args.get('date_from')
    date_to_str = request.args.get('date_to')
    coords = get_city_coords(city)
    if not city or not coords:
        return jsonify({
            "error": "City not found. Available cities: " + ", ".join(CITY_COORDS.keys())
        }), 400
    if not date_from_str or not date_to_str:
        return jsonify({"error": "date_from and date_to are required in YYYYMMDD format."}), 400
    try:
        date_from = datetime.strptime(date_from_str, "%Y%m%d")
        date_to = datetime.strptime(date_to_str, "%Y%m%d")
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYYMMDD."}), 400
    if date_from > date_to:
        return jsonify({"error": "date_from must be before or equal to date_to."}), 400
    results = []
    current_date = date_from
    while current_date <= date_to:
        moon_data = get_moon_data(coords['lat'], coords['lon'], current_date, city=city)
        tz_name = CITY_TIMEZONES.get(city)
        current_date_local = to_local(current_date, city) if tz_name else None
        results.append({
            "city": city,
            "latitude": coords['lat'],
            "longitude": coords['lon'],
            "date_utc": current_date.isoformat(),
            "date_local": current_date_local.isoformat() if current_date_local else None,
            **moon_data
        })
        current_date += timedelta(days=1)
    return jsonify(results)


def main():
    global proxy_frontend
    parser = argparse.ArgumentParser(description="Calculate the moon phase for a given city.")
    parser.add_argument('--city', type=str, required=False, help='City name (e.g., "London")')
    parser.add_argument('--proxy-frontend', action='store_true', help='Proxy / to Next.js dev server on port 3000 instead of serving static files')
    args = parser.parse_args()
    if args.proxy_frontend:
        proxy_frontend = True
    if args.city:
        coords = get_city_coords(args.city)
        if not coords:
            print(f"City not found. Available cities: {', '.join(CITY_COORDS.keys())}")
            return
        now = datetime.utcnow()
        moon_data = get_moon_data(coords['lat'], coords['lon'], now, city=args.city)
        tz_name = CITY_TIMEZONES.get(args.city)
        now_local = to_local(now, args.city) if tz_name else None
        print(f"City: {args.city}")
        print(f"Latitude: {coords['lat']}")
        print(f"Longitude: {coords['lon']}")
        print(f"Date (UTC): {now.isoformat()}")
        if now_local:
            print(f"Date (Local): {now_local.isoformat()}")
        print(f"Illuminated Fraction: {moon_data['illuminated_fraction']}")
        print(f"Major Phase: {moon_data['major_phase']}")
        print(f"Moon Age (days): {moon_data['moon_age_days']:.2f}")
        print(f"Is Waxing: {moon_data['is_waxing']}")
        print(f"Next Major Phase: {moon_data['next_major_phase']['name']} on {moon_data['next_major_phase']['date_utc']} UTC / {moon_data['next_major_phase']['date_local']} Local")
        print(f"Previous New Moon: {moon_data['previous_new_moon_utc']} UTC / {moon_data['previous_new_moon_local']} Local")
        print(f"Next New Moon: {moon_data['next_new_moon_utc']} UTC / {moon_data['next_new_moon_local']} Local")
    else:
        app.run(host="0.0.0.0", port=5000)


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        main()
    else:
        app.run(host="0.0.0.0", port=5000) 
