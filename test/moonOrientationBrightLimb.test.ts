import { describe, it, expect } from 'vitest';
import {
  calculateMoonOrientationAngles,
  calculateMoonRotationAngle,
} from '../src/utils/moonOrientation';
import { localDateTimeToUtc } from '../src/utils/time';

describe('calculateMoonOrientationAngles', () => {
  it('parallactic_angle matches legacy calculateMoonRotationAngle', () => {
    const lat = -33.9249;
    const lon = 18.4241;
    const utc = localDateTimeToUtc('2026-01-01', 21, 0, 'Africa/Johannesburg');
    const o = calculateMoonOrientationAngles(lat, lon, utc);
    const q = calculateMoonRotationAngle(lat, lon, utc);
    expect(o.parallactic_angle).toBeCloseTo(q, 5);
  });

  it('Cape Town 2026-01-01 21:00: bright limb differs from parallactic q', () => {
    const utc = localDateTimeToUtc('2026-01-01', 21, 0, 'Africa/Johannesburg');
    const o = calculateMoonOrientationAngles(-33.9249, 18.4241, utc);
    expect(o.parallactic_angle).toBeCloseTo(208.27, 0);
    // Ephem reference for same instant ≈ 70.44°; astronomy-engine within ~1°
    expect(o.bright_limb_angle).toBeGreaterThan(68);
    expect(o.bright_limb_angle).toBeLessThan(73);
    expect(Math.abs(o.bright_limb_angle - o.parallactic_angle)).toBeGreaterThan(90);
  });

  it('returns angles in 0–360 range', () => {
    const utc = localDateTimeToUtc('2026-06-15', 21, 0, 'Europe/London');
    const o = calculateMoonOrientationAngles(51.5074, -0.1278, utc);
    expect(o.parallactic_angle).toBeGreaterThanOrEqual(0);
    expect(o.parallactic_angle).toBeLessThan(360);
    expect(o.bright_limb_angle).toBeGreaterThanOrEqual(0);
    expect(o.bright_limb_angle).toBeLessThan(360);
  });
});
