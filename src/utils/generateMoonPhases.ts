import { Body, Illumination, MoonPhase, NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';
import { DateTime } from 'luxon';
import type { MoonPhaseEntry } from '@/types/moonPhase';

type CityConfig = { lat: number; lon: number; tz: string };

const CITY_MAP: Record<string, CityConfig> = {
  'Cape Town': { lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  'New York': { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  'London': { lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  'Hong Kong': { lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  'Melbourne': { lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  'Tokyo': { lat: 35.6895, lon: 139.6917, tz: 'Asia/Tokyo' }
};

const MEAN_SYNODIC_MONTH = 29.530588; // days

function parseYMD(ymd: string): Date {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6)) - 1;
  const d = Number(ymd.slice(6, 8));
  return new Date(Date.UTC(y, m, d, 0, 0, 0));
}

function* eachDateUtc(startUtc: Date, endUtc: Date): Generator<Date> {
  const d = new Date(startUtc.getTime());
  for (;;) {
    if (d > endUtc) return;
    yield new Date(d.getTime());
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

function buildPhaseName(quarterIndex: number): 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter' {
  const names = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'] as const;
  return names[quarterIndex];
}

function precomputeMajorPhases(tz: string, yearStart: number, yearEnd: number) {
  type PhaseItem = { phase: string; utc: Date; localDate: string };
  const items: PhaseItem[] = [];
  for (let year = yearStart; year <= yearEnd; year++) {
    let mq = SearchMoonQuarter(new Date(Date.UTC(year, 0, 1, 0, 0, 0)));
    while (mq.time.date.getUTCFullYear() === year) {
      const phase = buildPhaseName(mq.quarter);
      const utc = mq.time.date;
      const localDate = DateTime.fromJSDate(utc, { zone: 'utc' }).setZone(tz).toISODate()!;
      items.push({ phase, utc, localDate });
      mq = NextMoonQuarter(mq);
    }
  }
  // Build quick lookups
  const byLocalDate = new Map<string, string>();
  for (const i of items) byLocalDate.set(i.localDate, i.phase);
  const sortedUtc = items.slice().sort((a, b) => a.utc.getTime() - b.utc.getTime());
  return { items: sortedUtc, byLocalDate };
}

export async function generateMoonPhases(city: string, dateFrom: string, dateTo: string): Promise<MoonPhaseEntry[]> {
  const cfg = CITY_MAP[city];
  if (!cfg) throw new Error(`Unsupported city: ${city}`);
  const from = parseYMD(dateFrom);
  const to = parseYMD(dateTo);
  const yearStart = from.getUTCFullYear();
  const yearEnd = to.getUTCFullYear();
  const { items: majorList, byLocalDate } = precomputeMajorPhases(cfg.tz, yearStart, yearEnd);

  const results: MoonPhaseEntry[] = [];
  for (const dayUtc of eachDateUtc(from, to)) {
    const dtUtcIso = dayUtc.toISOString();
    const illum = Illumination(Body.Moon, dayUtc);
    const phaseAngle = MoonPhase(dayUtc); // degrees [0,360)
    const ageDays = (phaseAngle / 360) * MEAN_SYNODIC_MONTH;
    const isWaxing = phaseAngle < 180;

    const localDate = DateTime.fromJSDate(dayUtc, { zone: 'utc' }).setZone(cfg.tz).toISODate()!;
    const majorPhaseToday = byLocalDate.get(localDate) ?? null;

    // Find next major phase strictly after this day start UTC
    const nextMajor = majorList.find(p => p.utc.getTime() > dayUtc.getTime());

    results.push({
      city,
      date_utc: dtUtcIso,
      illuminated_fraction: illum.phase_fraction,
      is_waxing: isWaxing,
      latitude: cfg.lat,
      longitude: cfg.lon,
      major_phase: majorPhaseToday,
      moon_age_days: ageDays,
      next_major_phase: {
        name: nextMajor ? nextMajor.phase : null,
        date_utc: nextMajor ? DateTime.fromJSDate(nextMajor.utc, { zone: 'utc' }).toISO()! : null
      }
    });
  }

  return results;
}


