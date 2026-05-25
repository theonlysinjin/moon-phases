import { Body, Illumination, MoonPhase, NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';
import { DateTime } from 'luxon';
import type { MoonPhaseEntry } from '@/types/moonPhase';
import type { FetchOptions } from '@/types/api';
import { DEFAULT_VIEW_HOUR } from '@/types/api';
import type { LocationConfig } from '@/config/cities';
import { calculateMoonRotationAngle } from './moonOrientation';
import {
  eachLocalDay,
  eachLocal3Hours,
  localYearFromYmd,
  utcToLocalDate,
} from './time';

const MEAN_SYNODIC_MONTH = 29.530588; // days

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
      const localDate = utcToLocalDate(utc.toISOString(), tz);
      items.push({ phase, utc, localDate });
      mq = NextMoonQuarter(mq);
    }
  }
  const byLocalDate = new Map<string, string>();
  for (const i of items) byLocalDate.set(i.localDate, i.phase);
  const sortedUtc = items.slice().sort((a, b) => a.utc.getTime() - b.utc.getTime());
  return { items: sortedUtc, byLocalDate };
}

function buildEntry(
  city: string,
  cfg: { lat: number; lon: number; tz: string },
  tUtc: Date,
  localDate: string,
  majorList: { phase: string; utc: Date }[],
  byLocalDate: Map<string, string>,
  majorPhaseOverride?: string | null
): MoonPhaseEntry {
  const illum = Illumination(Body.Moon, tUtc);
  const phaseAngle = MoonPhase(tUtc);
  const ageDays = (phaseAngle / 360) * MEAN_SYNODIC_MONTH;
  const isWaxing = phaseAngle < 180;
  const majorPhaseToday =
    majorPhaseOverride !== undefined
      ? majorPhaseOverride
      : (byLocalDate.get(localDate) ?? null);
  const nextMajor = majorList.find((p) => p.utc.getTime() > tUtc.getTime());
  const rotationAngle = calculateMoonRotationAngle(cfg.lat, cfg.lon, tUtc);

  return {
    city,
    date_utc: tUtc.toISOString(),
    date_local: localDate,
    illuminated_fraction: illum.phase_fraction,
    is_waxing: isWaxing,
    latitude: cfg.lat,
    longitude: cfg.lon,
    major_phase: majorPhaseToday,
    moon_age_days: ageDays,
    rotation_angle: rotationAngle,
    next_major_phase: {
      name: nextMajor ? nextMajor.phase : null,
      date_utc: nextMajor
        ? DateTime.fromJSDate(nextMajor.utc, { zone: 'utc' }).toISO()!
        : null,
    },
  };
}

export async function generateMoonPhases(
  location: LocationConfig,
  dateFrom: string,
  dateTo: string,
  options?: FetchOptions
): Promise<MoonPhaseEntry[]> {
  const { label: city, lat, lon, tz } = location;
  const cfg = { lat, lon, tz };

  const viewHour = options?.viewHour ?? DEFAULT_VIEW_HOUR;
  const yearStart = localYearFromYmd(dateFrom, tz);
  const yearEnd = localYearFromYmd(dateTo, tz);
  const { items: majorList, byLocalDate } = precomputeMajorPhases(tz, yearStart, yearEnd);

  const results: MoonPhaseEntry[] = [];
  const use3h = options?.resolution === '3h';
  const iterator = use3h
    ? eachLocal3Hours(dateFrom, dateTo, tz)
    : eachLocalDay(dateFrom, dateTo, tz, viewHour);

  for (const { localDate, utc: tUtc } of iterator) {
    results.push(
      buildEntry(city, cfg, tUtc, localDate, majorList, byLocalDate)
    );
  }

  if (use3h) {
    for (const item of majorList) {
      const iso = DateTime.fromJSDate(item.utc, { zone: 'utc' }).toISO();
      if (!iso) continue;
      const exists = results.some((r) => r.date_utc === iso);
      if (!exists) {
        const localDate = utcToLocalDate(iso, tz);
        results.push(
          buildEntry(city, cfg, item.utc, localDate, majorList, byLocalDate, item.phase)
        );
      }
    }
    results.sort(
      (a, b) => new Date(a.date_utc).getTime() - new Date(b.date_utc).getTime()
    );
  }

  return results;
}
