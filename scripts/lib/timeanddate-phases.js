const { JSDOM } = require("jsdom");
const { PHASE_KEYS, HEADER_ALIASES } = require("./timeanddate-cities");

/**
 * @typedef {{ lunation: number; phase: string; dateStr: string; timeStr: string; dateLocal?: string; timeLocal?: string }} PhaseEvent
 */

/**
 * Parse "29 Jan" + year into YYYY-MM-DD using Luxon-like month names.
 * @param {string} dateStr
 * @param {number} year
 */
function parseMonthDayToIso(dateStr, year) {
	const m = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-z]+)$/);
	if (!m) return null;
	const day = Number(m[1]);
	const monthNames = [
		"jan",
		"feb",
		"mar",
		"apr",
		"may",
		"jun",
		"jul",
		"aug",
		"sep",
		"oct",
		"nov",
		"dec",
	];
	const monthIdx = monthNames.findIndex((name) =>
		m[2].toLowerCase().startsWith(name)
	);
	if (monthIdx < 0) return null;
	const month = String(monthIdx + 1).padStart(2, "0");
	const dayPadded = String(day).padStart(2, "0");
	return `${year}-${month}-${dayPadded}`;
}

/**
 * Extract phase events from a parsed lunation row.
 * @param {number} lunation
 * @param {string[]} cells - date/time pairs after lunation column
 * @param {number} year
 * @returns {PhaseEvent[]}
 */
function rowToPhaseEvents(lunation, cells, year) {
	const events = [];
	for (let i = 0; i < PHASE_KEYS.length; i++) {
		const dateStr = (cells[i * 2] || "").trim();
		const timeStr = (cells[i * 2 + 1] || "").trim();
		if (!dateStr || !timeStr) continue;
		const dateLocal = parseMonthDayToIso(dateStr, year);
		events.push({
			lunation,
			phase: PHASE_KEYS[i],
			dateStr,
			timeStr,
			dateLocal: dateLocal || undefined,
			timeLocal: timeStr,
		});
	}
	return events;
}

/**
 * Strip trailing duration column and pad to 8 phase cells (4 date/time pairs).
 * @param {string[]} parts - full row split including lunation at [0]
 */
function normalizePhaseCells(parts) {
	let cells = parts.slice(1).map((s) => s.trim());
	if (cells.length > 0 && /^\d+d\s+\d+h\s+\d+m$/i.test(cells[cells.length - 1])) {
		cells.pop();
	}
	while (cells.length < 8) cells.unshift("");
	return cells.slice(0, 8);
}

/**
 * Parse tab-separated fixture (existing test file format).
 * @param {string} text
 * @param {number} year
 * @returns {PhaseEvent[]}
 */
function parsePhaseTableTsv(text, year) {
	const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
	const dataLines = lines.filter((l) => /^\d{4}\t/.test(l));
	const events = [];
	for (const line of dataLines) {
		const parts = line.split("\t").map((s) => s.trim());
		const lunation = Number(parts[0]);
		events.push(...rowToPhaseEvents(lunation, normalizePhaseCells(parts), year));
	}
	return events;
}

/**
 * Serialize phase events back to TSV fixture format.
 * @param {PhaseEvent[]} events
 * @param {number} year
 * @param {string} cityLabel
 */
function serializePhaseTableTsv(events, year, cityLabel) {
	const byLunation = new Map();
	for (const e of events) {
		if (!byLunation.has(e.lunation)) {
			byLunation.set(e.lunation, {
				lunation: e.lunation,
				phases: Object.fromEntries(PHASE_KEYS.map((p) => [p, {}])),
			});
		}
		const row = byLunation.get(e.lunation);
		row.phases[e.phase] = { date: e.dateStr, time: e.timeStr };
	}

	const lunations = [...byLunation.keys()].sort((a, b) => a - b);
	let out = `Moon Phases for ${cityLabel} in ${year}\n`;
	out += `Lunation\tNew Moon\tFirst Quarter\tFull Moon\tThird Quarter\tDuration\n`;
	for (const lun of lunations) {
		const row = byLunation.get(lun);
		const cells = [String(lun)];
		for (const phase of PHASE_KEYS) {
			const p = row.phases[phase];
			cells.push(p.date || "", p.time || "");
		}
		cells.push("");
		out += `${cells.join("\t")}\n`;
	}
	return out;
}

/**
 * Find the lunation table in timeanddate HTML.
 * Prefers section[2] table per site layout; falls back to header match.
 * @param {Document} document
 */
function findPhaseTable(document) {
	const xpathTable = document.evaluate(
		"/html/body/div[5]/main/article/section[2]/div[2]/div/table",
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null
	).singleNodeValue;
	if (xpathTable) return xpathTable;

	const sections = document.querySelectorAll("main article section");
	for (const section of sections) {
		const table = section.querySelector("table");
		if (!table) continue;
		const headerText = table.textContent.toLowerCase();
		if (headerText.includes("lunation") && headerText.includes("new moon")) {
			return table;
		}
	}

	const tables = document.querySelectorAll("main article table");
	for (const table of tables) {
		const headerText = table.textContent.toLowerCase();
		if (headerText.includes("lunation") && headerText.includes("new moon")) {
			return table;
		}
	}
	return null;
}

/**
 * Parse timeanddate moon phase table from HTML.
 * @param {string} html
 * @param {number} year
 * @returns {PhaseEvent[]}
 */
function parsePhaseTableHtml(html, year) {
	const dom = new JSDOM(html);
	const table = findPhaseTable(dom.window.document);
	if (!table) {
		throw new Error(
			"Could not find lunation table in HTML (expected main/article/section[2]/table)"
		);
	}

	const rows = [...table.querySelectorAll("tr")];
	const events = [];

	for (const row of rows) {
		const cells = [...row.querySelectorAll("th, td")].map((c) =>
			c.textContent.replace(/\s+/g, " ").trim()
		);
		if (cells.length === 0) continue;
		if (!/^\d{4}$/.test(cells[0])) continue;
		const lunation = Number(cells[0]);
		// Drop duration column (last cell) if present
		const dataCells = cells.slice(1);
		const pairs = dataCells.length >= 9 ? dataCells.slice(0, 8) : dataCells.slice(0, 8);
		events.push(...rowToPhaseEvents(lunation, pairs, year));
	}

	return events;
}

module.exports = {
	parseMonthDayToIso,
	parsePhaseTableTsv,
	parsePhaseTableHtml,
	serializePhaseTableTsv,
	rowToPhaseEvents,
	findPhaseTable,
};
