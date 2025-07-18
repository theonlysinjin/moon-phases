import json
import requests
from datetime import datetime
import os

# Constants
API_URL = "http://localhost:5000/moon-phases?city=Cape+Town&date_from=20250101&date_to=20251231"
EXPECTED_FILE = os.path.join(os.path.dirname(__file__), "moon_phases_cape_town_2025.json")
MAJOR_PHASES = {"New Moon", "First Quarter", "Full Moon", "Third Quarter"}

# Load expected data
with open(EXPECTED_FILE, "r") as f:
    expected = json.load(f)

# Fetch API data
resp = requests.get(API_URL)
resp.raise_for_status()
api_data = resp.json()

# Build lookup: phase -> list of (date, time)
expected_phases = []
for entry in expected:
    if entry["phase"] in MAJOR_PHASES:
        expected_phases.append({
            "phase": entry["phase"],
            "date": entry["date"],
            "time": entry["time"]
        })

# Build API lookup: phase -> list of (date, time)
api_phases = []
for entry in api_data:
    phase = entry.get("major_phase")
    if phase in MAJOR_PHASES:
        # Use local date/time if available, else UTC
        date_str = entry.get("date_local") or entry.get("date_utc")
        if date_str:
            dt = datetime.fromisoformat(date_str)
            api_phases.append({
                "phase": phase,
                "date": dt.date().isoformat(),
                "time": dt.time().strftime("%H:%M")
            })

# For each expected phase, find the closest API phase of the same type
results = []
for exp in expected_phases:
    exp_date = datetime.strptime(exp["date"], "%Y-%m-%d").date()
    candidates = [a for a in api_phases if a["phase"] == exp["phase"]]
    if not candidates:
        results.append({"phase": exp["phase"], "expected_date": exp["date"], "actual_date": None, "days_off": None})
        continue
    # Find closest date
    min_days = None
    closest = None
    for cand in candidates:
        cand_date = datetime.strptime(cand["date"], "%Y-%m-%d").date()
        days = abs((cand_date - exp_date).days)
        if min_days is None or days < min_days:
            min_days = days
            closest = cand
    if min_days == 0:
        continue  # Exact match, no need to report
    results.append({
        "phase": exp["phase"],
        "expected_date": exp["date"],
        "actual_date": closest["date"],
        "days_off": min_days
    })

# Print summary
if not results:
    print("All major phases matched exactly!")
else:
    print("Mismatches:")
    for r in results:
        print(f"{r['phase']}: expected {r['expected_date']}, got {r['actual_date']} (off by {r['days_off']} days)") 