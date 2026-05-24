#!/usr/bin/env node

// One row per local calendar day at 9pm (matches UI daily resolution).
// Columns: date,year,month,day,frame,city,timezone,hemisphere
// Frame mapping matches generate-poster-markdown.js:
//   index = clamp(round(moon_age_days), 0..29)
//   frame = (index * 8) + 1
// City must match labels in src/config/cities.ts (default: London).

const { MoonPhase } = require("astronomy-engine");
const { DateTime } = require("luxon");

const DEFAULT_VIEW_HOUR = 21;

const MEAN_SYNODIC_MONTH = 29.530588; // days

/** @type {Record<string, { lat: number; tz: string }>} */
const CITY_MAP = {
	"Cape Town": { lat: -33.9249, tz: "Africa/Johannesburg" },
	"New York": { lat: 40.7128, tz: "America/New_York" },
	London: { lat: 51.5074, tz: "Europe/London" },
	"Hong Kong": { lat: 22.3193, tz: "Asia/Hong_Kong" },
	Melbourne: { lat: -37.8136, tz: "Australia/Melbourne" },
	"San Francisco": { lat: 37.7749, tz: "America/Los_Angeles" },
	Tokyo: { lat: 35.6895, tz: "Asia/Tokyo" },
};

const CSV_HEADER = ["date", "year", "month", "day", "frame", "city", "timezone", "hemisphere"];

function parseArgs(argv) {
	let year = new Date().getUTCFullYear();
	let city = "London";
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--year" || a === "-y") {
			year = Number(argv[++i]);
		} else if (a.startsWith("--year=")) {
			year = Number(a.split("=")[1]);
		} else if (a === "--city" || a === "-c") {
			city = argv[++i];
		} else if (a.startsWith("--city=")) {
			city = a.split("=")[1];
		}
	}
	if (!Number.isFinite(year) || year < 1) throw new Error(`Invalid year: ${year}`);
	if (!city || typeof city !== "string") throw new Error("Invalid city label");
	const cfg = CITY_MAP[city];
	if (!cfg) {
		const allowed = Object.keys(CITY_MAP).join(", ");
		throw new Error(`Unknown city "${city}". Use one of: ${allowed}`);
	}
	return { year, city, cfg };
}

function pad2(n) {
	return String(n).padStart(2, "0");
}

function isValidDateLocal(year, month1, day) {
	const dt = DateTime.fromObject({ year, month: month1, day });
	return dt.isValid && dt.month === month1 && dt.day === day;
}

function computeFrameForLocalDate(year, month1, day, tz) {
	const dt = DateTime.fromObject(
		{ year, month: month1, day, hour: DEFAULT_VIEW_HOUR, minute: 0, second: 0 },
		{ zone: tz }
	);
	const tUtc = dt.toUTC().toJSDate();
	const phaseAngle = MoonPhase(tUtc); // degrees [0, 360)
	const ageDays = (phaseAngle / 360) * MEAN_SYNODIC_MONTH;
	const dayIndex = Math.max(0, Math.min(29, Math.round(Math.max(0, ageDays))));
	return 1 + dayIndex * 8; // 1..236
}

function escapeCsvCell(value) {
	if (value === "" || value === null || value === undefined) return "";
	const s = String(value);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function csvRow(cells) {
	return cells.map(escapeCsvCell).join(",") + "\n";
}

function hemisphereForLat(lat) {
	return lat >= 0 ? "Northern" : "Southern";
}

function buildCsv(year, city, cfg) {
	let out = csvRow(CSV_HEADER);
	for (let month = 1; month <= 12; month++) {
		for (let day = 1; day <= 31; day++) {
			if (!isValidDateLocal(year, month, day)) continue;
			const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
			const frame = computeFrameForLocalDate(year, month, day, cfg.tz);
			out += csvRow([
				dateStr,
				year,
				month,
				day,
				frame,
				city,
				cfg.tz,
				hemisphereForLat(cfg.lat),
			]);
		}
	}
	return out;
}

function main() {
	const { year, city, cfg } = parseArgs(process.argv);
	process.stdout.write(buildCsv(year, city, cfg));
}

main();
