// TypeScript module declarations for astronomia submodules
declare module 'astronomia/moonphase';
declare module 'astronomia/moonillum';
declare module 'astronomia/julian';

// Ported from Python moon phase calculation
export function calculateMoonPhase(latitude: number, longitude: number, date: Date): string {
  // Convert date to Julian date
  const toJulian = (date: Date): number => {
    // Julian date for 2000-01-01 00:00:00 UTC is 2451545.0
    const msPerDay = 86400000;
    const jan12000 = Date.UTC(2000, 0, 1, 0, 0, 0, 0);
    const days = (date.getTime() - jan12000) / msPerDay;
    return 2451545.0 + days;
  };

  const jd = toJulian(date);

  // Calculate the moon's mean longitude
  const L = (218.316 + 13.176396 * (jd - 2451545.0)) % 360;

  // Calculate the moon's mean anomaly
  const M = (134.963 + 13.064993 * (jd - 2451545.0)) % 360;

  // Calculate the moon's argument of latitude (unused after simplification)

  // Calculate the moon's ecliptic latitude and longitude
  const l = L + 6.289 * Math.sin((M * Math.PI) / 180);
  const r = 385001 - 20905 * Math.cos((M * Math.PI) / 180);

  // Calculate the moon's equatorial coordinates
  const obl = 23.439 - 0.0000004 * (jd - 2451545.0);
  const x = r * Math.cos((l * Math.PI) / 180);
  const y = r * Math.cos((obl * Math.PI) / 180) * Math.sin((l * Math.PI) / 180);
  const z = r * Math.sin((obl * Math.PI) / 180) * Math.sin((l * Math.PI) / 180);

  // Calculate the moon's right ascension and declination
  const ra = Math.atan2(y, x); // radians
  const dec = Math.asin(z / r); // radians

  // Calculate the moon's phase angle
  const lst = (100.46 + 0.985647352 * (jd - 2451545.0) + longitude) % 360;
  const ha = ((lst - (ra * 180) / Math.PI) + 360) % 360; // convert ra to degrees
  const phase_angle = Math.acos(
    Math.sin((latitude * Math.PI) / 180) * Math.sin(dec) +
    Math.cos((latitude * Math.PI) / 180) * Math.cos(dec) * Math.cos((ha * Math.PI) / 180)
  );
  const phase_angle_deg = (phase_angle * 180) / Math.PI;

  // Determine the phase of the moon (all four major phases)
  if (phase_angle_deg < 22.5 || phase_angle_deg >= 337.5) {
    return "New Moon";
  } else if (phase_angle_deg < 67.5) {
    return "Waxing Crescent";
  } else if (phase_angle_deg < 112.5) {
    return "First Quarter";
  } else if (phase_angle_deg < 157.5) {
    return "Waxing Gibbous";
  } else if (phase_angle_deg < 202.5) {
    return "Full Moon";
  } else if (phase_angle_deg < 247.5) {
    return "Waning Gibbous";
  } else if (phase_angle_deg < 292.5) {
    return "Last Quarter";
  } else {
    return "Waning Crescent";
  }
}

// Utility: Find major phase days for a year
export function getMajorMoonPhasesForYear(latitude: number, longitude: number, year: number) {
  const majorPhases = [
    { name: "New Moon", angle: 0 },
    { name: "First Quarter", angle: 90 },
    { name: "Full Moon", angle: 180 },
    { name: "Last Quarter", angle: 270 },
  ];
  const threshold = 7; // degrees, for closest approach
  const minDaysBetweenSamePhase = 10; // days, to avoid duplicate same-phase events
  const results: Array<{ city: string; latitude: number; longitude: number; date: string; phase: string; phase_angle: number }> = [];
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day));
      // Calculate phase angle
      const toJulian = (date: Date): number => {
        const msPerDay = 86400000;
        const jan12000 = Date.UTC(2000, 0, 1, 0, 0, 0, 0);
        const days = (date.getTime() - jan12000) / msPerDay;
        return 2451545.0 + days;
      };
      const jd = toJulian(date);
      const L = (218.316 + 13.176396 * (jd - 2451545.0)) % 360;
      const M = (134.963 + 13.064993 * (jd - 2451545.0)) % 360;
      // const F = (93.272 + 13.229350 * (jd - 2451545.0)) % 360; // not used
      const l = L + 6.289 * Math.sin((M * Math.PI) / 180);
      const r = 385001 - 20905 * Math.cos((M * Math.PI) / 180);
      const obl = 23.439 - 0.0000004 * (jd - 2451545.0);
      const x = r * Math.cos((l * Math.PI) / 180);
      const y = r * Math.cos((obl * Math.PI) / 180) * Math.sin((l * Math.PI) / 180);
      const z = r * Math.sin((obl * Math.PI) / 180) * Math.sin((l * Math.PI) / 180);
      const ra = Math.atan2(y, x); // radians
      const dec = Math.asin(z / r); // radians
      const lst = (100.46 + 0.985647352 * (jd - 2451545.0) + longitude) % 360;
      const ha = ((lst - (ra * 180) / Math.PI) + 360) % 360; // convert ra to degrees
      const phase_angle = Math.acos(
        Math.sin((latitude * Math.PI) / 180) * Math.sin(dec) +
        Math.cos((latitude * Math.PI) / 180) * Math.cos(dec) * Math.cos((ha * Math.PI) / 180)
      );
      const phase_angle_deg = (phase_angle * 180) / Math.PI;
      // Find closest phase and its diff
      let closestPhase = majorPhases[0];
      let minDiff = Math.abs(((phase_angle_deg - closestPhase.angle + 540) % 360) - 180);
      for (const phase of majorPhases) {
        const diff = Math.abs(((phase_angle_deg - phase.angle + 540) % 360) - 180);
        if (diff < minDiff) {
          closestPhase = phase;
          minDiff = diff;
        }
      }
      console.log(`${date.toISOString().slice(0,10)}: phase_angle_deg=${phase_angle_deg.toFixed(2)}, closestPhase=${closestPhase.name}, diff=${minDiff.toFixed(2)}`);
      for (const phase of majorPhases) {
        const diff = Math.abs(((phase_angle_deg - phase.angle + 540) % 360) - 180); // shortest distance
        if (diff < threshold) {
          // Only add if not already added for this phase in the last X days (avoid duplicates for same phase)
          const lastSamePhase = results.slice().reverse().find(r => r.phase === phase.name);
          if (!lastSamePhase || (new Date(date).getTime() - new Date(lastSamePhase.date).getTime()) > minDaysBetweenSamePhase * 86400000) {
            results.push({
              city: "Cape Town",
              latitude,
              longitude,
              date: date.toISOString(),
              phase: phase.name,
              phase_angle: phase_angle_deg
            });
          }
        }
      }
    }
  }
  return results;
}

// --- astronomy-engine implementation ---
import { SearchMoonQuarter, NextMoonQuarter, Illumination, Body } from 'astronomy-engine';
import { DateTime } from 'luxon';

export async function getMajorMoonPhasesAstronomyEngine(
  year: number,
  options?: { timeZone?: string }
) {
  const results: Array<{
    phase: string;
    date_utc: string;
    time_utc: string;
    date_local: string;
    time_local: string;
    illumination: number;
  }> = [];
  const timeZone = options?.timeZone ?? 'Africa/Johannesburg';
  // Start at the beginning of the year
  const date = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  let mq = SearchMoonQuarter(date);
  const phaseNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
  while (mq.time.date.getUTCFullYear() === year) {
    const phase = phaseNames[mq.quarter];
    const illum = Illumination(Body.Moon, mq.time.date);
    // UTC
    const utc = DateTime.fromJSDate(mq.time.date, { zone: 'utc' });
    // Local (Africa/Johannesburg)
    const local = utc.setZone(timeZone);
    results.push({
      phase,
      date_utc: utc.toISODate()!,
      time_utc: utc.toFormat('HH:mm'),
      date_local: local.toISODate()!,
      time_local: local.toFormat('HH:mm'),
      illumination: illum.phase_fraction
    });
    mq = NextMoonQuarter(mq);
  }
  return results;
} 