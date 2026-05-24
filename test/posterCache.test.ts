import { describe, it, expect } from 'vitest';
import { generateMoonPhases } from '../src/utils/generateMoonPhases';

describe('poster city + viewHour independence', () => {
  it('different cities produce different rotation_angle for same local day', async () => {
    const dateFrom = '20250615';
    const dateTo = '20250615';
    const hour = 22;

    const hk = await generateMoonPhases('Hong Kong', dateFrom, dateTo, { viewHour: hour });
    const ct = await generateMoonPhases('Cape Town', dateFrom, dateTo, { viewHour: hour });

    expect(hk).toHaveLength(1);
    expect(ct).toHaveLength(1);
    expect(hk[0].rotation_angle).not.toBe(ct[0].rotation_angle);
  });
});
