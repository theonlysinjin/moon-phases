import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { getMajorMoonPhasesAstronomyEngine } from '../src/app/moonPhaseMath';

function parseLine(line: string) {
  const parts = line.split('\t').map(s => s.trim());
  if (!/^\d{4}$/.test(parts[0])) return null;
  const fields = parts.slice(1);
  const map: Record<string, { date?: string; time?: string }> = {
    'New Moon': {},
    'First Quarter': {},
    'Full Moon': {},
    'Last Quarter': {}
  };
  const phaseOrder = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
  let idx = 0;
  for (const phase of phaseOrder) {
    const dateStr = fields[idx++];
    const timeStr = fields[idx++];
    if (dateStr) map[phase].date = dateStr;
    if (timeStr) map[phase].time = timeStr;
  }
  return { phases: map };
}

function parseMonthDay(str: string, year: number) {
  return DateTime.fromFormat(`${str} ${year}`, 'd LLL yyyy', { zone: 'Australia/Melbourne' });
}

type PhaseName = 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter';

const TABLE_FILE = path.resolve(__dirname, './moon_phases_melbourne_2025.txt');

describe('Melbourne 2025 phases match local times (<= 2 minutes tolerance)', async () => {
  const text = fs.readFileSync(TABLE_FILE, 'utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const dataLines = lines.filter(l => /^\d{4}\t/.test(l));
  const expected: Array<{ phase: PhaseName; dt: DateTime }> = [];
  for (const line of dataLines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const { phases } = parsed;
    (Object.keys(phases) as PhaseName[]).forEach((phase: PhaseName) => {
      const p = phases[phase];
      if (p.date && p.time) {
        const dt = parseMonthDay(p.date, 2025).set({
          hour: Number(p.time.split(':')[0]),
          minute: Number(p.time.split(':')[1])
        });
        expected.push({ phase, dt });
      }
    });
  }

  const generated = await getMajorMoonPhasesAstronomyEngine(2025, { timeZone: 'Australia/Melbourne' });
  const genByPhase = generated.map(g => ({
    phase: g.phase as PhaseName,
    dt: DateTime.fromISO(`${g.date_local}T${g.time_local}:00`, { zone: 'Australia/Melbourne' })
  }));

  it('matches each listed phase within 2 minutes', () => {
    for (const exp of expected) {
      const candidates = genByPhase.filter(g => g.phase === exp.phase);
      expect(candidates.length).toBeGreaterThan(0);
      let min = Infinity;
      for (const cand of candidates) {
        const diff = Math.abs(cand.dt.diff(exp.dt, 'minutes').minutes);
        if (diff < min) min = diff;
      }
      expect(min).toBeLessThanOrEqual(2);
    }
  });
});







