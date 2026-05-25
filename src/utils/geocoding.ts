import type { LocationConfig } from '@/config/cities';

const OPEN_METEO_SEARCH = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_USER_AGENT = 'moon-calendar (https://github.com/sinjin/moon-calendar)';

type OpenMeteoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  admin1?: string;
};

type OpenMeteoSearchResponse = {
  results?: OpenMeteoResult[];
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  region?: string;
  country?: string;
};

type NominatimReverseResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

export function formatLocationLabel(result: {
  name: string;
  admin1?: string;
  country?: string;
}): string {
  const parts = [result.name, result.admin1, result.country].filter(
    (p) => p && p.length > 0
  );
  return parts.join(', ');
}

export function openMeteoResultToLocation(result: OpenMeteoResult): LocationConfig {
  return {
    slug: String(result.id),
    label: formatLocationLabel(result),
    lat: result.latitude,
    lon: result.longitude,
    tz: result.timezone,
  };
}

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function searchCities(
  query: string,
  options?: { count?: number; language?: string }
): Promise<LocationConfig[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: String(options?.count ?? 8),
    language: options?.language ?? 'en',
  });

  const res = await fetch(`${OPEN_METEO_SEARCH}?${params}`);
  if (!res.ok) {
    throw new Error(`City search failed (${res.status})`);
  }

  const data = (await res.json()) as OpenMeteoSearchResponse;
  if (!data.results?.length) return [];

  return data.results.map(openMeteoResultToLocation);
}

function formatNominatimLabel(data: NominatimReverseResponse): string {
  if (data.address) {
    const a = data.address;
    const city =
      a.city || a.town || a.village || a.municipality || '';
    const state = a.state || a.region || '';
    const country = a.country || '';
    const parts = [city, state, country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  if (data.display_name) {
    const parts = data.display_name.split(',');
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`;
    }
    return data.display_name;
  }
  return 'My location';
}

export async function reverseGeocodeLabel(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'en',
  });

  const res = await fetch(`${NOMINATIM_REVERSE}?${params}`, {
    headers: { 'User-Agent': NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Location lookup rate limited. Try again shortly.');
    return 'My location';
  }

  const data = (await res.json()) as NominatimReverseResponse;
  return formatNominatimLabel(data);
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  });
}

export async function resolveFromGeolocation(): Promise<LocationConfig> {
  const position = await getCurrentPosition();
  const { latitude: lat, longitude: lon } = position.coords;
  const tz = getBrowserTimezone();
  const label = await reverseGeocodeLabel(lat, lon);
  const slug = `geo-${lat.toFixed(4)}-${lon.toFixed(4)}`;

  return { slug, label, lat, lon, tz };
}
