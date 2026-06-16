import { DateTime } from "luxon";

export const VALID_THEMES = [
  "calendar",
  "lunar-cycle",
  "hourly-timeline",
  "poster",
  "single-day",
] as const;

export type ValidTheme = (typeof VALID_THEMES)[number];

export const VIEW_TYPES = ['display', 'image-only'] as const;
export type ViewType = (typeof VIEW_TYPES)[number];

export const OUTPUT_FORMATS = ['html', 'png'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type ParsedUrlParams = {
  theme?: ValidTheme;
  date?: string;
  hour?: number;
  lat?: number;
  lon?: number;
  citySlug?: string;
  viewType?: ViewType;
  format?: OutputFormat;
};

function parseFiniteCoord(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const dt = DateTime.fromISO(value, { zone: "utc" });
  if (!dt.isValid) return undefined;
  return dt.toISODate() ?? undefined;
}

function parseHour(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 23) return undefined;
  return n;
}

function parseTheme(value: string | null): ValidTheme | undefined {
  if (!value) return undefined;
  return (VALID_THEMES as readonly string[]).includes(value)
    ? (value as ValidTheme)
    : undefined;
}

function parseViewType(value: string | null): ViewType | undefined {
  if (!value) return undefined;
  return (VIEW_TYPES as readonly string[]).includes(value)
    ? (value as ViewType)
    : undefined;
}

function parseFormat(value: string | null): OutputFormat | undefined {
  if (!value) return undefined;
  return (OUTPUT_FORMATS as readonly string[]).includes(value)
    ? (value as OutputFormat)
    : undefined;
}

/** Parse supported deep-link query params from URLSearchParams. */
export function parseUrlParams(params: URLSearchParams): ParsedUrlParams {
  const result: ParsedUrlParams = {};

  const theme = parseTheme(params.get("theme"));
  if (theme) result.theme = theme;

  const date = parseDate(params.get("date"));
  if (date) result.date = date;

  const hour = parseHour(params.get("hour"));
  if (hour != null) result.hour = hour;

  const lat = parseFiniteCoord(params.get("lat"));
  const lon = parseFiniteCoord(params.get("lon"));
  if (lat != null && lon != null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    result.lat = lat;
    result.lon = lon;
  }

  const citySlug = params.get("city")?.trim();
  if (citySlug) result.citySlug = citySlug;

  const viewType = parseViewType(params.get("type"));
  if (viewType) result.viewType = viewType;

  const format = parseFormat(params.get("format"));
  if (format) result.format = format;

  return result;
}

export function hasDeepLinkParams(params: URLSearchParams): boolean {
  return (
    params.has("theme") ||
    params.has("date") ||
    params.has("hour") ||
    params.has("lat") ||
    params.has("lon") ||
    params.has("city") ||
    params.has("type") ||
    params.has("format")
  );
}

/** Drop hydrated params from the URL; keeps embed-friendly params like type and location. */
export function cleanHydratedUrlParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.search) return;

  url.searchParams.delete("date");
  url.searchParams.delete("hour");

  const qs = url.searchParams.toString();
  window.history.replaceState(null, "", qs ? `${url.pathname}?${qs}` : url.pathname);
}
