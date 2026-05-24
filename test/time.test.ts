import { describe, it, expect } from 'vitest';
import {
  localDateTimeToUtc,
  utcToLocalDate,
  eachLocalDay,
  todayLocalDate,
} from '../src/utils/time';
import { formatViewingTimeDisplay } from '../src/components/TimeOfDaySlider';

describe('time utilities', () => {
  it('converts New York local 9pm to UTC', () => {
    const utc = localDateTimeToUtc('2025-07-01', 21, 0, 'America/New_York');
    expect(utc.toISOString()).toBe('2025-07-02T01:00:00.000Z');
  });

  it('converts London local 9pm to UTC in summer (BST)', () => {
    const utc = localDateTimeToUtc('2025-07-01', 21, 0, 'Europe/London');
    expect(utc.toISOString()).toBe('2025-07-01T20:00:00.000Z');
  });

  it('utcToLocalDate maps UTC instant to local calendar day', () => {
    expect(utcToLocalDate('2025-07-02T01:00:00.000Z', 'America/New_York')).toBe(
      '2025-07-01'
    );
  });

  it('eachLocalDay yields one sample per local day at view hour', () => {
    const samples = [...eachLocalDay('20250101', '20250103', 'America/New_York', 21)];
    expect(samples).toHaveLength(3);
    expect(samples[0].localDate).toBe('2025-01-01');
    expect(samples[0].utc.toISOString()).toBe('2025-01-02T02:00:00.000Z');
  });

  it('todayLocalDate uses city timezone not process TZ', () => {
    const d = todayLocalDate('Asia/Tokyo');
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formatViewingTimeDisplay uses 24h and IANA timezone', () => {
    expect(formatViewingTimeDisplay(15, 'Africa/Johannesburg')).toBe(
      '15h00 (Africa/Johannesburg)'
    );
  });
});
