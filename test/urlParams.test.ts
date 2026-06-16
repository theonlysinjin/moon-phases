import { describe, it, expect } from 'vitest';
import { parseUrlParams } from '../src/utils/urlParams';

describe('parseUrlParams', () => {
  it('parses theme, date, hour, lat, lon, and city', () => {
    const params = new URLSearchParams(
      'theme=single-day&date=2025-06-14&hour=21&lat=40.7128&lon=-74.006&city=new-york'
    );
    expect(parseUrlParams(params)).toEqual({
      theme: 'single-day',
      date: '2025-06-14',
      hour: 21,
      lat: 40.7128,
      lon: -74.006,
      citySlug: 'new-york',
    });
  });

  it('rejects invalid theme and date', () => {
    const params = new URLSearchParams('theme=invalid&date=not-a-date');
    expect(parseUrlParams(params)).toEqual({});
  });

  it('rejects out-of-range coordinates', () => {
    const params = new URLSearchParams('lat=999&lon=0');
    expect(parseUrlParams(params)).toEqual({});
  });

  it('rejects hour outside 0–23', () => {
    const params = new URLSearchParams('hour=24');
    expect(parseUrlParams(params)).toEqual({});
  });

  it('accepts partial params', () => {
    const params = new URLSearchParams('theme=calendar');
    expect(parseUrlParams(params)).toEqual({ theme: 'calendar' });
  });

  it('parses type and format', () => {
    const params = new URLSearchParams(
      'type=image-only&format=png&theme=single-day&city=cape-town'
    );
    expect(parseUrlParams(params)).toEqual({
      viewType: 'image-only',
      format: 'png',
      theme: 'single-day',
      citySlug: 'cape-town',
    });
  });

  it('rejects invalid type and format', () => {
    const params = new URLSearchParams('type=video&format=gif');
    expect(parseUrlParams(params)).toEqual({});
  });
});
