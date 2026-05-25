import { describe, it, expect } from 'vitest';
import { generateMoonPhases } from '../src/utils/generateMoonPhases';
import { DEFAULT_VIEW_HOUR } from '../src/types/api';
import { dailyFrameIndex, fullSetFrame } from '../src/utils/moonFrameMapping';
import { presetByLabel } from '../src/config/cities';
import {
  VALIDATION_CITIES,
  loadTimeAndDateFixture,
  toLocalDateTime,
  getGeneratedMajorPhases,
  closestPhaseMinutes,
  type PhaseName,
} from './lib/timeanddateFixtures';

const PHASE_TOLERANCE_MINUTES = 2;

describe.each(VALIDATION_CITIES)(
  'poster CSV / generateMoonPhases vs timeanddate: $label $year',
  ({ label, slug, timeZone, year }) => {
    const fixture = loadTimeAndDateFixture(slug, year);

    it('major phase local times match timeanddate (<= 2 min)', async () => {
      const generated = await getGeneratedMajorPhases(year, timeZone);
      for (const event of fixture) {
        const expected = toLocalDateTime(event, timeZone);
        const min = closestPhaseMinutes(expected, generated, event.phase);
        expect(min).toBeLessThanOrEqual(PHASE_TOLERANCE_MINUTES);
      }
    });

    it('major_phase is set on the same local calendar day as timeanddate', async () => {
      const entries = await generateMoonPhases(
        presetByLabel(label),
        `${year}0101`,
        `${year}1231`,
        { viewHour: DEFAULT_VIEW_HOUR }
      );
      const byDate = new Map(entries.map((e) => [e.date_local, e]));

      for (const event of fixture) {
        const row = byDate.get(event.dateLocal);
        expect(row, `missing row for ${event.dateLocal}`).toBeDefined();
        expect(row!.major_phase).toBe(event.phase);
      }
    });

    it('daily_frame_index and full_set_frame match moon_age_days', async () => {
      const entries = await generateMoonPhases(
        presetByLabel(label),
        `${year}0101`,
        `${year}1231`,
        { viewHour: DEFAULT_VIEW_HOUR }
      );
      for (const e of entries) {
        expect(dailyFrameIndex(e.moon_age_days)).toBe(
          Math.min(29, Math.max(0, Math.round(Math.max(0, e.moon_age_days))))
        );
        expect(fullSetFrame(e.moon_age_days)).toBe(1 + dailyFrameIndex(e.moon_age_days) * 8);
      }
    });

    it('major phase days have sensible illumination for phase type', async () => {
      const entries = await generateMoonPhases(
        presetByLabel(label),
        `${year}0101`,
        `${year}1231`,
        { viewHour: DEFAULT_VIEW_HOUR }
      );
      const byDate = new Map(entries.map((e) => [e.date_local, e]));

      const checks: Record<PhaseName, (illum: number) => boolean> = {
        'New Moon': (i) => i < 0.1,
        'First Quarter': (i) => i > 0.4 && i < 0.6,
        'Full Moon': (i) => i > 0.9,
        'Last Quarter': (i) => i > 0.4 && i < 0.6,
      };

      for (const event of fixture) {
        const row = byDate.get(event.dateLocal);
        if (!row?.major_phase) continue;
        // Sample at 9pm may differ slightly from exact phase instant
        expect(checks[event.phase](row.illuminated_fraction)).toBe(true);
      }
    });
  }
);

describe('generateMoonPhases daily sample (Cape Town spot check)', () => {
  it('2025-01-07 first quarter day matches timeanddate and poster CSV frame mapping', async () => {
    const entries = await generateMoonPhases(presetByLabel('Cape Town'), '20250107', '20250107');
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e.date_local).toBe('2025-01-07');
    // Lunation 1262: First Quarter 7 Jan 01:56 local (timeanddate + astronomy-engine)
    expect(e.major_phase).toBe('First Quarter');
    expect(e.moon_age_days).toBeGreaterThan(7);
    expect(e.moon_age_days).toBeLessThan(9);
    expect(dailyFrameIndex(e.moon_age_days)).toBe(8);
    expect(fullSetFrame(e.moon_age_days)).toBe(65);
  });
});
