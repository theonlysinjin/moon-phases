#!/usr/bin/env node

// Generate a markdown table for the poster grid (months=1..12 as columns, days=1..30 as rows).
// Samples at 9pm local (DEFAULT_VIEW_HOUR) per city TZ — matches UI daily resolution.
// Canonical city list: src/config/cities.ts

const { MoonPhase } = require('astronomy-engine');
const { DateTime } = require('luxon');

const MEAN_SYNODIC_MONTH = 29.530588;
const DEFAULT_VIEW_HOUR = 21;

const CITY_MAP = {
	'Cape Town': { tz: 'Africa/Johannesburg' },
	'New York': { tz: 'America/New_York' },
	London: { tz: 'Europe/London' },
	'Hong Kong': { tz: 'Asia/Hong_Kong' },
	Melbourne: { tz: 'Australia/Melbourne' },
};

function parseArgs(argv) {
	let year = new Date().getUTCFullYear();
	let city = 'London';
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--year' || a === '-y') {
			year = Number(argv[++i]);
		} else if (a.startsWith('--year=')) {
			year = Number(a.split('=')[1]);
		} else if (a === '--city' || a === '-c') {
			city = argv[++i];
		} else if (a.startsWith('--city=')) {
			city = a.split('=')[1];
		}
	}
	if (!Number.isFinite(year) || year < 1) throw new Error(`Invalid year: ${year}`);
	const cfg = CITY_MAP[city];
	if (!cfg) {
		throw new Error(`Unknown city "${city}". Use one of: ${Object.keys(CITY_MAP).join(', ')}`);
	}
	return { year, city, tz: cfg.tz };
}

function isValidDateLocal(year, month1, day) {
	const dt = DateTime.fromObject({ year, month: month1, day }, { zone: 'utc' });
	return dt.isValid && dt.month === month1 && dt.day === day;
}

function computeFrameForLocalDate(year, month1, day, tz) {
	const dt = DateTime.fromObject(
		{ year, month: month1, day, hour: DEFAULT_VIEW_HOUR, minute: 0, second: 0 },
		{ zone: tz }
	);
	const tUtc = dt.toUTC().toJSDate();
	const phaseAngle = MoonPhase(tUtc);
	const ageDays = (phaseAngle / 360) * MEAN_SYNODIC_MONTH;
	const dayIndex = Math.max(0, Math.min(29, Math.round(Math.max(0, ageDays))));
	return 1 + dayIndex * 8;
}

function buildMarkdown(year, tz) {
	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	const days = Array.from({ length: 30 }, (_, i) => i + 1);

	let md = '';
	md += `| Day \\\nMonth | ${months.join(' | ')} |\n`;
	md += `|---|${months.map(() => '---').join('|')}|\n`;

	for (const day of days) {
		const row = months.map((m) =>
			isValidDateLocal(year, m, day) ? String(computeFrameForLocalDate(year, m, day, tz)) : ''
		);
		md += `| ${day} | ${row.join(' | ')} |\n`;
	}
	return md;
}

function main() {
	const { year, city, tz } = parseArgs(process.argv);
	const md = buildMarkdown(year, tz);
	process.stdout.write(`### Poster frame numbers for ${year} (${city}, ${DEFAULT_VIEW_HOUR}:00 local)\n\n`);
	process.stdout.write(md);
}

main();
