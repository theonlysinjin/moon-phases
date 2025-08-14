#!/usr/bin/env node

/**
 * Prune non-required moon phase images from src assets.
 * Keeps only the 30 daily frames (1 + d*8 for d=0..29) and moon_720p30.webm.
 *
 * DRY RUN by default. Use --apply to actually delete files.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src/assets/phases');

function main() {
  const apply = process.argv.includes('--apply');
  if (!fs.existsSync(SRC_DIR)) {
    console.error('❌ Source phases directory not found:', SRC_DIR);
    process.exit(1);
  }

  const keepSet = new Set(Array.from({ length: 30 }, (_, d) => (1 + d * 8).toString().padStart(4, '0')));
  const entries = fs.readdirSync(SRC_DIR);
  const deletions = [];

  for (const name of entries) {
    if (name === 'moon_720p30.webm') continue;
    const m = name.match(/^moon\.(\d{4})\.jpg$/);
    if (!m) continue;
    if (!keepSet.has(m[1])) {
      deletions.push(name);
    }
  }

  if (deletions.length === 0) {
    console.log('✅ Nothing to prune.');
    return;
  }

  console.log(`🧹 Will remove ${deletions.length} files:`);
  for (const f of deletions) console.log('  -', f);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to perform deletions.');
    return;
  }

  for (const f of deletions) {
    fs.rmSync(path.join(SRC_DIR, f));
  }
  console.log('✅ Prune completed.');
}

main();


