#!/usr/bin/env node

// Wrapper — delegates to the TypeScript implementation.
const { spawnSync } = require("child_process");
const path = require("path");

const tsScript = path.join(__dirname, "generate-poster-csv.ts");
const result = spawnSync("npx", ["tsx", tsScript, ...process.argv.slice(2)], {
	stdio: "inherit",
});
process.exit(result.status ?? 1);
