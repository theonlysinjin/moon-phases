import { describe, it, expect } from 'vitest';
import { videoTransform } from '../src/utils/hourlyTimelineTransform';

describe('videoTransform', () => {
  it('uses no transform when parallactic is off', () => {
    expect(videoTransform(false, 42)).toBe('none');
    expect(videoTransform(false, 180)).toBe('none');
  });

  it('uses rotate when parallactic is on', () => {
    expect(videoTransform(true, 42)).toBe('rotate(42deg)');
    expect(videoTransform(true, 0)).toBe('rotate(0deg)');
  });
});
