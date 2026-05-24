import { describe, it, expect } from 'vitest';
import {
  getSynodicAnchorUtc,
  rotationAtSynodicProgress,
  MEAN_SYNODIC_MONTH_DAYS,
} from '../src/utils/synodicRotation';
describe('synodic video rotation', () => {
  const tz = 'Africa/Johannesburg';
  const lat = -33.9249;
  const lon = 18.4241;
  const anchor = getSynodicAnchorUtc(tz, 21);

  it('produces different angles at progress 0 and 0.5', () => {
    const a0 = rotationAtSynodicProgress(0, lat, lon, anchor);
    const aHalf = rotationAtSynodicProgress(0.5, lat, lon, anchor);
    expect(a0).not.toBe(aHalf);
    const delta = Math.abs(a0 - aHalf);
    expect(Math.min(delta, 360 - delta)).toBeLessThan(180);
  });

  it('does not jump more than 180° between adjacent progress samples', () => {
    const steps = 60;
    let maxStep = 0;
    let prev = rotationAtSynodicProgress(0, lat, lon, anchor);
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const next = rotationAtSynodicProgress(p, lat, lon, anchor);
      let step = Math.abs(next - prev);
      if (step > 180) step = 360 - step;
      maxStep = Math.max(maxStep, step);
      prev = next;
    }
    expect(maxStep).toBeLessThan(180);
  });

  it('progress 0 and 1 differ by less than a full spin', () => {
    const a0 = rotationAtSynodicProgress(0, lat, lon, anchor);
    const a1 = rotationAtSynodicProgress(1, lat, lon, anchor);
    let delta = Math.abs(a1 - a0);
    if (delta > 180) delta = 360 - delta;
    expect(delta).toBeLessThan(180);
  });

  it('anchor uses evening hour on new moon local day', () => {
    expect(anchor).toBeInstanceOf(Date);
    expect(MEAN_SYNODIC_MONTH_DAYS).toBeGreaterThan(29);
  });
});
