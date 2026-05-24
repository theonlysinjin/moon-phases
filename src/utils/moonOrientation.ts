import { Body, Equator, SiderealTime, Observer } from 'astronomy-engine';

/**
 * Calculate the parallactic angle (rotation angle) for the moon at a given location and time.
 * This angle represents how the moon should be rotated to match its actual orientation in the sky.
 * 
 * @param latitude Observer's latitude in degrees (positive = north, negative = south)
 * @param longitude Observer's longitude in degrees (positive = east, negative = west)
 * @param date Date and time (UTC) for which to calculate the rotation angle
 * @returns Rotation angle in degrees (0-360)
 */
export function calculateMoonRotationAngle(
  latitude: number,
  longitude: number,
  date: Date
): number {
  // Create observer object (height = 0 for sea level)
  const observer = new Observer(latitude, longitude, 0);

  // Get moon's equatorial coordinates (RA and Dec)
  // Equator(body, date, observer, ofdate, aberration)
  // ofdate=false means use J2000 coordinates, aberration=true means correct for light travel time
  const equ = Equator(Body.Moon, date, observer, false, true);
  const ra = equ.ra; // Right ascension in hours
  const dec = equ.dec; // Declination in degrees

  // Convert RA from hours to degrees
  const raDegrees = ra * 15; // 1 hour = 15 degrees

  // Calculate local sidereal time (LST) in degrees
  // SiderealTime returns Greenwich Mean Sidereal Time (GMST) in hours
  const gmst = SiderealTime(date); // Returns GMST in hours
  // Convert to local sidereal time: LST = GMST + longitude/15
  const lstHours = gmst + longitude / 15;
  let lstDegrees = (lstHours * 15) % 360; // Convert to degrees
  if (lstDegrees < 0) lstDegrees += 360;

  // Calculate hour angle (H) in degrees
  // Hour angle = LST - RA
  let hourAngle = lstDegrees - raDegrees;
  // Normalize to -180 to 180 range
  while (hourAngle > 180) hourAngle -= 360;
  while (hourAngle < -180) hourAngle += 360;

  // Convert to radians for calculations
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const hRad = (hourAngle * Math.PI) / 180;

  // Calculate parallactic angle using the formula:
  // q = atan2(sin(H), tan(φ) * cos(δ) - sin(δ) * cos(H))
  // where:
  //   H = hour angle
  //   φ = observer's latitude
  //   δ = moon's declination
  const numerator = Math.sin(hRad);
  const denominator = Math.tan(latRad) * Math.cos(decRad) - Math.sin(decRad) * Math.cos(hRad);
  const parallacticAngleRad = Math.atan2(numerator, denominator);

  // Convert to degrees and normalize to 0-360 range
  let parallacticAngleDeg = (parallacticAngleRad * 180) / Math.PI;
  if (parallacticAngleDeg < 0) parallacticAngleDeg += 360;

  return parallacticAngleDeg;
}

