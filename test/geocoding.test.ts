import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatLocationLabel,
  openMeteoResultToLocation,
  getBrowserTimezone,
  searchCities,
  reverseGeocodeLabel,
} from '../src/utils/geocoding';

describe('geocoding', () => {
  describe('formatLocationLabel', () => {
    it('joins name, admin1, and country', () => {
      expect(
        formatLocationLabel({ name: 'Berlin', admin1: 'Berlin', country: 'Germany' })
      ).toBe('Berlin, Berlin, Germany');
    });

    it('omits empty admin fields', () => {
      expect(formatLocationLabel({ name: 'London', country: 'United Kingdom' })).toBe(
        'London, United Kingdom'
      );
    });
  });

  describe('openMeteoResultToLocation', () => {
    it('maps API fields to LocationConfig', () => {
      const loc = openMeteoResultToLocation({
        id: 2950159,
        name: 'Berlin',
        latitude: 52.52,
        longitude: 13.41,
        timezone: 'Europe/Berlin',
        admin1: 'Berlin',
        country: 'Germany',
      });
      expect(loc.slug).toBe('2950159');
      expect(loc.lat).toBe(52.52);
      expect(loc.tz).toBe('Europe/Berlin');
      expect(loc.label).toContain('Berlin');
    });
  });

  describe('getBrowserTimezone', () => {
    it('returns a non-empty timezone string', () => {
      const tz = getBrowserTimezone();
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe('searchCities', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns empty array for short queries without fetching', async () => {
      const results = await searchCities('a');
      expect(results).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maps Open-Meteo search results', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 1,
              name: 'Paris',
              latitude: 48.85,
              longitude: 2.35,
              timezone: 'Europe/Paris',
              country: 'France',
            },
          ],
        }),
      });

      const results = await searchCities('Paris');
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('1');
      expect(results[0].tz).toBe('Europe/Paris');
    });

    it('throws when search HTTP fails', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(searchCities('Berlin')).rejects.toThrow(/failed/i);
    });
  });

  describe('reverseGeocodeLabel', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('formats city and country from Nominatim address', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          address: {
            city: 'Cape Town',
            state: 'Western Cape',
            country: 'South Africa',
          },
        }),
      });

      const label = await reverseGeocodeLabel(-33.92, 18.42);
      expect(label).toBe('Cape Town, Western Cape, South Africa');
    });

    it('falls back to My location on HTTP error', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      const label = await reverseGeocodeLabel(0, 0);
      expect(label).toBe('My location');
    });
  });
});
