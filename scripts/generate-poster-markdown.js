#!/usr/bin/env node

// Generate a markdown table for the poster grid (months=1..12 as columns, days=1..30 as rows)
// Each cell shows the moon image frame number (1..236) using the project's daily mapping:
//   index = clamp(round(moon_age_days), 0..29)
//   frame = (index * 8) + 1
// Moon age is computed from phase angle at UTC midnight for each date, matching frontend logic.

const { MoonPhase } = require('astronomy-engine');

const MEAN_SYNODIC_MONTH = 29.530588; // days

function parseArgs(argv) {
	let year = new Date().getUTCFullYear();
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--year' || a === '-y') {
			year = Number(argv[++i]);
		} else if (a.startsWith('--year=')) {
			year = Number(a.split('=')[1]);
		}
	}
	if (!Number.isFinite(year) || year < 1) throw new Error(`Invalid year: ${year}`);
	return { year };
}

function isValidDateUTC(year, month1, day) {
	const d = new Date(Date.UTC(year, month1 - 1, day));
	return d.getUTCFullYear() === year && d.getUTCMonth() === month1 - 1 && d.getUTCDate() === day;
}

function computeFrameForDateUTC(year, month1, day) {
	const tUtc = new Date(Date.UTC(year, month1 - 1, day, 0, 0, 0));
	const phaseAngle = MoonPhase(tUtc); // degrees [0, 360)
	const ageDays = (phaseAngle / 360) * MEAN_SYNODIC_MONTH;
	const dayIndex = Math.max(0, Math.min(29, Math.round(Math.max(0, ageDays))));
	return 1 + dayIndex * 8; // 1..236
}

function buildMarkdown(year) {
	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	const days = Array.from({ length: 30 }, (_, i) => i + 1);

	let md = '';
	md += `| Day \\\nMonth | ${months.join(' | ')} |\n`;
	md += `|---|${months.map(() => '---').join('|')}|\n`;

	for (const day of days) {
		const row = months.map((m) => (isValidDateUTC(year, m, day) ? String(computeFrameForDateUTC(year, m, day)) : ''));
		md += `| ${day} | ${row.join(' | ')} |\n`;
	}
	return md;
}

function main() {
	const { year } = parseArgs(process.argv);
	const md = buildMarkdown(year);
	process.stdout.write(`### Poster frame numbers for ${year}\n\n`);
	process.stdout.write(md);
}

main();
