export type LocationConfig = {
  label: string;
  slug: string;
  lat: number;
  lon: number;
  tz: string;
};

/** @deprecated Use LocationConfig */
export type CityConfig = LocationConfig;

/** Preset cities for tests, CLI scripts, and quick-picks */
export const PRESET_LOCATIONS: LocationConfig[] = [
  { label: 'Cape Town', slug: 'cape-town', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  { label: 'New York', slug: 'new-york', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { label: 'London', slug: 'london', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { label: 'Hong Kong', slug: 'hong-kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { label: 'Melbourne', slug: 'melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
];

export const CITIES = PRESET_LOCATIONS;

export const CITY_BY_LABEL: Record<string, LocationConfig> = Object.fromEntries(
  CITIES.map((c) => [c.label, c])
);

export const CITY_BY_SLUG: Record<string, LocationConfig> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c])
);

export const CITY_OPTIONS = CITIES.map((c) => ({ label: c.label, value: c.slug }));

export function presetByLabel(label: string): LocationConfig {
  const cfg = CITY_BY_LABEL[label];
  if (!cfg) {
    throw new Error(
      `Unknown preset city "${label}". Use one of: ${CITIES.map((c) => c.label).join(', ')}`
    );
  }
  return cfg;
}
