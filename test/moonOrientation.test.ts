import { describe, it, expect } from 'vitest';
import { calculateMoonRotationAngle } from '../src/utils/moonOrientation';

describe('calculateMoonRotationAngle', () => {
  it('returns angle in 0-360 range for New York evening', () => {
    const utc = new Date('2025-07-02T01:00:00.000Z'); // 9pm NY on Jul 1
    const angle = calculateMoonRotationAngle(40.7128, -74.006, utc);
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(360);
  });

  it('differs for same UTC instant at different latitudes', () => {
    const utc = new Date('2025-07-01T20:00:00.000Z');
    const london = calculateMoonRotationAngle(51.5074, -0.1278, utc);
    const capeTown = calculateMoonRotationAngle(-33.9249, 18.4241, utc);
    expect(Math.abs(london - capeTown)).toBeGreaterThan(1);
  });
});
