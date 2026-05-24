#!/usr/bin/env node
/**
 * Daily moon phase CSV — one row per local calendar day at viewHour (default 9pm).
 * Uses the same generateMoonPhases() path as the UI.
 *
 * Usage:
 *   npx tsx scripts/generate-poster-csv.ts --year 2025 --city "Cape Town"
 *   npx tsx scripts/generate-poster-csv.ts --year 2025 --city "Cape Town" --view-hour 21 > out.csv
 */

import { generateMoonPhases } from '../src/utils/generateMoonPhases';
import { dailyFrameIndex, fullSetFrame } from '../src/utils/moonFrameMapping';
import { DEFAULT_VIEW_HOUR } from '../src/types/api';
import { CITIES } from '../src/config/cities';

const CSV_HEADER = [
  'date_local',
  'date_utc',
  'city',
  'timezone',
  'view_hour',
  'moon_age_days',
  'illuminated_fraction',
  'is_waxing',
  'daily_frame_index',
  'full_set_frame',
  'major_phase',
  'rotation_angle',
  'latitude',
  'longitude',
];

function parseArgs(argv: string[]) {
  let year = new Date().getUTCFullYear();
  let city = 'London';
  let viewHour = DEFAULT_VIEW_HOUR;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--year' || a === '-y') year = Number(argv[++i]);
    else if (a.startsWith('--year=')) year = Number(a.split('=')[1]);
    else if (a === '--city' || a === '-c') city = argv[++i];
    else if (a.startsWith('--city=')) city = a.split('=')[1];
    else if (a === '--view-hour') viewHour = Number(argv[++i]);
    else if (a.startsWith('--view-hour=')) viewHour = Number(a.split('=')[1]);
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: generate-poster-csv.ts [--year YYYY] [--city "Cape Town"] [--view-hour 21]'
      );
      process.exit(0);
    }
  }

  if (!Number.isFinite(year) || year < 1) throw new Error(`Invalid year: ${year}`);
  if (!Number.isFinite(viewHour) || viewHour < 0 || viewHour > 23) {
    throw new Error(`Invalid view-hour: ${viewHour}`);
  }

  const cfg = CITIES.find((c) => c.label === city);
  if (!cfg) {
    throw new Error(
      `Unknown city "${city}". Use one of: ${CITIES.map((c) => c.label).join(', ')}`
    );
  }

  return { year, city, viewHour, cfg };
}

function escapeCsvCell(value: unknown): string {
  if (value === '' || value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(escapeCsvCell).join(',') + '\n';
}

async function buildCsv(year: number, city: string, viewHour: number) {
  const dateFrom = `${year}0101`;
  const dateTo = `${year}1231`;
  const entries = await generateMoonPhases(city, dateFrom, dateTo, { viewHour });

  let out = csvRow(CSV_HEADER);
  for (const e of entries) {
    const frameIdx = dailyFrameIndex(e.moon_age_days);
    out += csvRow([
      e.date_local,
      e.date_utc,
      e.city,
      CITIES.find((c) => c.label === city)!.tz,
      viewHour,
      e.moon_age_days.toFixed(4),
      e.illuminated_fraction.toFixed(6),
      e.is_waxing,
      frameIdx,
      fullSetFrame(e.moon_age_days),
      e.major_phase ?? '',
      e.rotation_angle.toFixed(2),
      e.latitude,
      e.longitude,
    ]);
  }
  return out;
}

async function main() {
  const { year, city, viewHour } = parseArgs(process.argv);
  process.stdout.write(await buildCsv(year, city, viewHour));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
