import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { getMajorMoonPhasesAstronomyEngine } from '@/app/moonPhaseMath';
import { CITIES } from '@/config/cities';

export type PhaseName = 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter';

export type TimeAndDatePhaseEvent = {
  lunation: number;
  phase: PhaseName;
  dateStr: string;
  timeStr: string;
  dateLocal: string;
  timeLocal: string;
};

const PHASE_ORDER: PhaseName[] = [
  'New Moon',
  'First Quarter',
  'Full Moon',
  'Last Quarter',
];

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/timeanddate');

function parseMonthDayToIso(dateStr: string, year: number): string | null {
  const m = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-z]+)$/);
  if (!m) return null;
  const dt = DateTime.fromFormat(`${m[1]} ${m[2]} ${year}`, 'd LLL yyyy');
  return dt.isValid ? dt.toISODate()! : null;
}

/** Strip trailing duration column and pad to 8 phase cells (4 date/time pairs). */
function normalizePhaseCells(parts: string[]): string[] {
  let cells = parts.slice(1).map((s) => s.trim());
  if (cells.length > 0 && /^\d+d\s+\d+h\s+\d+m$/i.test(cells[cells.length - 1]!)) {
    cells.pop();
  }
  while (cells.length < 8) cells.unshift('');
  return cells.slice(0, 8);
}

/** Parse tab-separated timeanddate lunation table fixture. */
export function parseTimeAndDateFixture(text: string, year: number): TimeAndDatePhaseEvent[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const dataLines = lines.filter((l) => /^\d{4}\t/.test(l));
  const events: TimeAndDatePhaseEvent[] = [];

  for (const line of dataLines) {
    const parts = line.split('\t').map((s) => s.trim());
    const lunation = Number(parts[0]);
    const phaseCells = normalizePhaseCells(parts);
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      const dateStr = phaseCells[i * 2] || '';
      const timeStr = phaseCells[i * 2 + 1] || '';
      if (!dateStr || !timeStr) continue;
      const dateLocal = parseMonthDayToIso(dateStr, year);
      if (!dateLocal) continue;
      events.push({
        lunation,
        phase: PHASE_ORDER[i],
        dateStr,
        timeStr,
        dateLocal,
        timeLocal: timeStr,
      });
    }
  }
  return events;
}

export function loadTimeAndDateFixture(citySlug: string, year: number): TimeAndDatePhaseEvent[] {
  const file = path.join(FIXTURE_DIR, `${citySlug}-${year}.tsv`);
  const text = fs.readFileSync(file, 'utf-8');
  return parseTimeAndDateFixture(text, year);
}

export function toLocalDateTime(event: TimeAndDatePhaseEvent, timeZone: string): DateTime {
  const [hour, minute] = event.timeLocal.split(':').map(Number);
  return DateTime.fromISO(`${event.dateLocal}T00:00:00`, { zone: timeZone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
}

/** All loaded cities validated against timeanddate fixtures (2025). */
export const VALIDATION_CITIES = CITIES.map((c) => ({
  label: c.label,
  slug: c.slug,
  timeZone: c.tz,
  year: 2025,
}));

export async function getGeneratedMajorPhases(year: number, timeZone: string) {
  const generated = await getMajorMoonPhasesAstronomyEngine(year, { timeZone });
  return generated.map((g) => ({
    phase: g.phase as PhaseName,
    dt: DateTime.fromISO(`${g.date_local}T${g.time_local}:00`, { zone: timeZone }),
  }));
}

export function closestPhaseMinutes(
  expected: DateTime,
  candidates: Array<{ phase: PhaseName; dt: DateTime }>,
  phase: PhaseName
): number {
  const samePhase = candidates.filter((g) => g.phase === phase);
  let min = Infinity;
  for (const cand of samePhase) {
    const diff = Math.abs(cand.dt.diff(expected, 'minutes').minutes);
    if (diff < min) min = diff;
  }
  return min;
}
