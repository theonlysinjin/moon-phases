import { DateTime } from 'luxon';

/** Parse YYYYMMDD to YYYY-MM-DD */
export function ymdToIsoDate(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** Format YYYY-MM-DD to YYYYMMDD */
export function isoDateToYmd(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/** Observer local date + time → UTC instant */
export function localDateTimeToUtc(
  localDate: string,
  hour: number,
  minute: number,
  tz: string
): Date {
  const dt = DateTime.fromObject(
    {
      year: Number(localDate.slice(0, 4)),
      month: Number(localDate.slice(5, 7)),
      day: Number(localDate.slice(8, 10)),
      hour,
      minute,
      second: 0,
      millisecond: 0,
    },
    { zone: tz }
  );
  if (!dt.isValid) {
    // DST gap: try next valid hour
    const shifted = DateTime.fromObject(
      {
        year: Number(localDate.slice(0, 4)),
        month: Number(localDate.slice(5, 7)),
        day: Number(localDate.slice(8, 10)),
        hour: hour + 1,
        minute: 0,
        second: 0,
        millisecond: 0,
      },
      { zone: tz }
    );
    return shifted.toUTC().toJSDate();
  }
  return dt.toUTC().toJSDate();
}

/** UTC ISO string → local YYYY-MM-DD in city TZ */
export function utcToLocalDate(isoUtc: string, tz: string): string {
  return DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(tz).toISODate()!;
}

/** UTC ISO string → local HH:mm in city TZ */
export function utcToLocalTime(isoUtc: string, tz: string): string {
  return DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(tz).toFormat('HH:mm');
}

export function todayLocalDate(tz: string): string {
  return DateTime.now().setZone(tz).toISODate()!;
}

export type LocalSample = { localDate: string; utc: Date };

/** Yield one sample per local calendar day at viewHour (default 21) */
export function* eachLocalDay(
  fromYmd: string,
  toYmd: string,
  tz: string,
  viewHour: number = 21
): Generator<LocalSample> {
  let current = DateTime.fromISO(ymdToIsoDate(fromYmd), { zone: tz }).startOf('day');
  const end = DateTime.fromISO(ymdToIsoDate(toYmd), { zone: tz }).startOf('day');
  while (current <= end) {
    const localDate = current.toISODate()!;
    const utc = localDateTimeToUtc(localDate, viewHour, 0, tz);
    yield { localDate, utc };
    current = current.plus({ days: 1 });
  }
}

/** Yield 3-hour steps from local midnight through local end date */
export function* eachLocal3Hours(
  fromYmd: string,
  toYmd: string,
  tz: string
): Generator<LocalSample> {
  let current = DateTime.fromISO(ymdToIsoDate(fromYmd), { zone: tz }).startOf('day');
  const end = DateTime.fromISO(ymdToIsoDate(toYmd), { zone: tz }).endOf('day');
  while (current <= end) {
    const localDate = current.toISODate()!;
    yield { localDate, utc: current.toUTC().toJSDate() };
    current = current.plus({ hours: 3 });
  }
}

/** Add months to a local YYYY-MM-DD, return YYYYMMDD */
export function addLocalMonths(isoDate: string, months: number, tz: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: tz }).plus({ months });
  return isoDateToYmd(dt.toISODate()!);
}

/** First day of current month in city TZ as YYYYMMDD */
export function startOfCurrentLocalMonthYmd(tz: string): string {
  const dt = DateTime.now().setZone(tz).startOf('month');
  return isoDateToYmd(dt.toISODate()!);
}

/** Last day of month N months ahead in city TZ as YYYYMMDD */
export function endOfLocalMonthPlusMonthsYmd(tz: string, monthsAhead: number): string {
  const dt = DateTime.now()
    .setZone(tz)
    .startOf('month')
    .plus({ months: monthsAhead })
    .endOf('month');
  return isoDateToYmd(dt.toISODate()!);
}

/** Today in city TZ as YYYYMMDD */
export function todayLocalYmd(tz: string): string {
  return isoDateToYmd(todayLocalDate(tz));
}

/** Add days to YYYYMMDD in city TZ */
export function addLocalDaysYmd(ymd: string, days: number, tz: string): string {
  const dt = DateTime.fromISO(ymdToIsoDate(ymd), { zone: tz }).plus({ days });
  return isoDateToYmd(dt.toISODate()!);
}

/** First day of month containing ymd, in city TZ */
export function startOfLocalMonthYmd(ymd: string, tz: string): string {
  const dt = DateTime.fromISO(ymdToIsoDate(ymd), { zone: tz }).startOf('month');
  return isoDateToYmd(dt.toISODate()!);
}

/** Year from YYYYMMDD interpreted in city TZ */
export function localYearFromYmd(ymd: string, tz: string): number {
  return DateTime.fromISO(ymdToIsoDate(ymd), { zone: tz }).year;
}

/** Interpolate rotation angle between two values, handling 360° wrap */
export function interpolateRotation(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = a + diff * t;
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;
  return result;
}
