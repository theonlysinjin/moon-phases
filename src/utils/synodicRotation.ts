import { NextMoonQuarter, SearchMoonQuarter } from 'astronomy-engine';
import { DEFAULT_VIEW_HOUR } from '@/types/api';
import { calculateMoonRotationAngle } from './moonOrientation';
import { localDateTimeToUtc, utcToLocalDate } from './time';

export const MEAN_SYNODIC_MONTH_DAYS = 29.530588;
const MS_PER_DAY = 86400000;

/** Most recent new moon at or before `reference`, then aligned to viewHour local. */
export function getSynodicAnchorUtc(
  tz: string,
  viewHour: number = DEFAULT_VIEW_HOUR,
  reference: Date = new Date()
): Date {
  let mq = SearchMoonQuarter(new Date(reference.getTime() - 45 * MS_PER_DAY));
  let newMoonUtc = mq.time.date;

  for (let i = 0; i < 12; i++) {
    if (mq.quarter === 0) {
      newMoonUtc = mq.time.date;
    }
    if (mq.time.date.getTime() > reference.getTime()) {
      break;
    }
    mq = NextMoonQuarter(mq);
  }

  const localDate = utcToLocalDate(newMoonUtc.toISOString(), tz);
  return localDateTimeToUtc(localDate, viewHour, 0, tz);
}

export function sampleUtcAtSynodicProgress(
  progress: number,
  anchorUtc: Date
): Date {
  const elapsedMs = progress * MEAN_SYNODIC_MONTH_DAYS * MS_PER_DAY;
  return new Date(anchorUtc.getTime() + elapsedMs);
}

export function rotationAtSynodicProgress(
  progress: number,
  latitude: number,
  longitude: number,
  anchorUtc: Date
): number {
  const sampleUtc = sampleUtcAtSynodicProgress(progress, anchorUtc);
  return calculateMoonRotationAngle(latitude, longitude, sampleUtc);
}
