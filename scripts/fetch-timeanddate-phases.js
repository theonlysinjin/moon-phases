#!/usr/bin/env node

/**
 * Fetch or parse timeanddate.com moon phase lunation tables.
 *
 * Usage:
 *   node scripts/fetch-timeanddate-phases.js --city "Cape Town" --year 2025
 *   node scripts/fetch-timeanddate-phases.js --city "Cape Town" --year 2025 --html saved.html
 *   node scripts/fetch-timeanddate-phases.js --all --year 2025
 *
 * Live fetch uses Playwright when installed (bypasses Cloudflare):
 *   npm install -D playwright && npx playwright install chromium
 *
 * Fixtures are written to test/fixtures/timeanddate/<city>-<year>.tsv
 */

const fs = require("fs");
const path = require("path");
const {
	TIMEANDDATE_CITIES,
	buildPhaseUrl,
	fixtureBasename,
} = require("./lib/timeanddate-cities");
const {
	parsePhaseTableHtml,
	parsePhaseTableTsv,
	serializePhaseTableTsv,
} = require("./lib/timeanddate-phases");

const FIXTURE_DIR = path.join(__dirname, "../test/fixtures/timeanddate");

function parseArgs(argv) {
	let year = new Date().getUTCFullYear();
	let city = "Cape Town";
	let htmlPath = null;
	let all = false;
	let outDir = FIXTURE_DIR;

	for (let i = 2; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--year" || a === "-y") year = Number(argv[++i]);
		else if (a.startsWith("--year=")) year = Number(a.split("=")[1]);
		else if (a === "--city" || a === "-c") city = argv[++i];
		else if (a.startsWith("--city=")) city = a.split("=")[1];
		else if (a === "--html") htmlPath = argv[++i];
		else if (a === "--out") outDir = argv[++i];
		else if (a === "--all") all = true;
		else if (a === "--help" || a === "-h") {
			console.log(`Usage: fetch-timeanddate-phases.js [--city "Cape Town"] [--year 2025] [--html file] [--all]`);
			process.exit(0);
		}
	}

	if (!Number.isFinite(year) || year < 1) throw new Error(`Invalid year: ${year}`);
	return { year, city, htmlPath, all, outDir };
}

async function fetchHtmlWithPlaywright(url) {
	const { chromium } = await import("playwright");
	const browser = await chromium.launch({ headless: true });
	try {
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
		await page.waitForSelector("main article table", { timeout: 30000 });
		return await page.content();
	} finally {
		await browser.close();
	}
}

async function fetchHtml(url) {
	try {
		return await fetchHtmlWithPlaywright(url);
	} catch (err) {
		if (err.code === "ERR_MODULE_NOT_FOUND" || /Cannot find module 'playwright'/.test(String(err))) {
			throw new Error(
				"Live fetch requires Playwright. Install with:\n" +
					"  npm install -D playwright && npx playwright install chromium\n" +
					"Or pass saved HTML: --html path/to/page.html"
			);
		}
		throw err;
	}
}

async function pullCity(cityLabel, year, htmlPath, outDir) {
	const cfg = TIMEANDDATE_CITIES[cityLabel];
	if (!cfg) {
		throw new Error(
			`Unknown city "${cityLabel}". Use one of: ${Object.keys(TIMEANDDATE_CITIES).join(", ")}`
		);
	}

	let html;
	let source = htmlPath || buildPhaseUrl(cfg.path, year);
	if (htmlPath) {
		html = fs.readFileSync(htmlPath, "utf-8");
	} else {
		console.error(`Fetching ${source} ...`);
		html = await fetchHtml(source);
	}

	const events =
		htmlPath && htmlPath.endsWith(".tsv")
			? parsePhaseTableTsv(html, year)
			: parsePhaseTableHtml(html, year);

	if (events.length === 0) {
		throw new Error(`No phase events parsed for ${cityLabel} ${year}`);
	}

	fs.mkdirSync(outDir, { recursive: true });
	const outFile = path.join(outDir, fixtureBasename(cityLabel, year));
	const tsv = serializePhaseTableTsv(events, year, cityLabel);
	fs.writeFileSync(outFile, tsv, "utf-8");
	console.error(`Wrote ${events.length} phase events → ${outFile}`);
	return { cityLabel, year, events, outFile, timeZone: cfg.tz };
}

async function main() {
	const { year, city, htmlPath, all, outDir } = parseArgs(process.argv);
	const cities = all ? Object.keys(TIMEANDDATE_CITIES) : [city];

	for (const cityLabel of cities) {
		await pullCity(cityLabel, year, all ? null : htmlPath, outDir);
	}
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
