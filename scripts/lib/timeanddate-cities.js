/**
 * timeanddate.com URL paths for cities in src/config/cities.ts
 * @type {Record<string, { path: string; tz: string; label: string }>}
 */
const TIMEANDDATE_CITIES = {
	"Cape Town": {
		label: "Cape Town",
		path: "south-africa/cape-town",
		tz: "Africa/Johannesburg",
	},
	"New York": {
		label: "New York",
		path: "usa/new-york",
		tz: "America/New_York",
	},
	London: {
		label: "London",
		path: "uk/london",
		tz: "Europe/London",
	},
	"Hong Kong": {
		label: "Hong Kong",
		path: "china/hong-kong",
		tz: "Asia/Hong_Kong",
	},
	Melbourne: {
		label: "Melbourne",
		path: "australia/melbourne",
		tz: "Australia/Melbourne",
	},
};

const PHASE_KEYS = ["New Moon", "First Quarter", "Full Moon", "Last Quarter"];

/** timeanddate labels "Third Quarter" as Last Quarter */
const HEADER_ALIASES = {
	"third quarter": "Last Quarter",
	"last quarter": "Last Quarter",
};

function buildPhaseUrl(cityPath, year) {
	return `https://www.timeanddate.com/moon/phases/${cityPath}?year=${year}`;
}

function fixtureBasename(cityLabel, year) {
	return `${cityLabel.toLowerCase().replace(/\s+/g, "-")}-${year}.tsv`;
}

module.exports = {
	TIMEANDDATE_CITIES,
	PHASE_KEYS,
	HEADER_ALIASES,
	buildPhaseUrl,
	fixtureBasename,
};
