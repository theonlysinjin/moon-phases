import { describe, it, expect } from 'vitest';
import {
  VALIDATION_CITIES,
  loadTimeAndDateFixture,
  toLocalDateTime,
  getGeneratedMajorPhases,
  closestPhaseMinutes,
} from './lib/timeanddateFixtures';

const TOLERANCE_MINUTES = 2;

describe.each(VALIDATION_CITIES)(
  'timeanddate major phases: $label $year (<= 2 min)',
  ({ slug, timeZone, year }) => {
    const expected = loadTimeAndDateFixture(slug, year).map((e) => ({
      phase: e.phase,
      dt: toLocalDateTime(e, timeZone),
    }));

    it('matches astronomy-engine local times', async () => {
      const generated = await getGeneratedMajorPhases(year, timeZone);
      expect(generated.length).toBeGreaterThan(0);

      for (const exp of expected) {
        const min = closestPhaseMinutes(exp.dt, generated, exp.phase);
        expect(min).toBeLessThanOrEqual(TOLERANCE_MINUTES);
      }
    });
  }
);
