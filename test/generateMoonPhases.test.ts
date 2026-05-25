import { describe, it, expect } from 'vitest';
import { generateMoonPhases } from '../src/utils/generateMoonPhases';
import { DEFAULT_VIEW_HOUR } from '../src/types/api';
import { presetByLabel } from '../src/config/cities';

describe('generateMoonPhases', () => {
  it('samples daily at 9pm local with date_local and UTC instant', async () => {
    const entries = await generateMoonPhases(presetByLabel('New York'), '20250701', '20250701', {
      viewHour: DEFAULT_VIEW_HOUR,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].date_local).toBe('2025-07-01');
    expect(entries[0].date_utc).toBe('2025-07-02T01:00:00.000Z');
    expect(entries[0].rotation_angle).toBeGreaterThanOrEqual(0);
    expect(entries[0].rotation_angle).toBeLessThan(360);
    expect(entries[0].bright_limb_angle).toBeGreaterThanOrEqual(0);
    expect(entries[0].bright_limb_angle).toBeLessThan(360);
  });

  it('different viewHour changes UTC instant and rotation', async () => {
    const at9pm = await generateMoonPhases(presetByLabel('New York'), '20250701', '20250701', {
      viewHour: 21,
    });
    const atNoon = await generateMoonPhases(presetByLabel('New York'), '20250701', '20250701', {
      viewHour: 12,
    });
    expect(at9pm[0].date_utc).not.toBe(atNoon[0].date_utc);
    expect(at9pm[0].date_local).toBe(atNoon[0].date_local);
  });

  it('assigns major_phase on local calendar day', async () => {
    const entries = await generateMoonPhases(presetByLabel('Cape Town'), '20250101', '20251231');
    const withMajor = entries.filter((e) => e.major_phase !== null);
    expect(withMajor.length).toBeGreaterThan(0);
    for (const e of withMajor) {
      expect(e.date_local).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
