import { Body, Equator, SiderealTime, Observer } from 'astronomy-engine';

const DEG = Math.PI / 180;

export type MoonOrientationAngles = {
	/** Parallactic angle q (degrees, 0–360). Disk / axis tilt in the sky. */
	parallactic_angle: number;
	/** Bright-limb angle θ = pa − q (degrees, 0–360). Sun direction clockwise from zenith at the Moon. */
	bright_limb_angle: number;
};

function normalizeDegrees0To360(deg: number): number {
	let d = deg % 360;
	if (d < 0) d += 360;
	return d;
}

/** Position angle of the Sun at the Moon (bright limb), radians. RA/Dec in radians. */
function positionAngleSunAtMoonRad(
	moonRa: number,
	moonDec: number,
	sunRa: number,
	sunDec: number
): number {
	const dra = sunRa - moonRa;
	return Math.atan2(
		Math.sin(dra),
		Math.cos(moonDec) * Math.tan(sunDec) - Math.sin(moonDec) * Math.cos(dra)
	);
}

/** Parallactic angle q at the Moon, radians. Moon RA in hours, Dec in degrees. */
function parallacticAngleRad(
	latitude: number,
	moonRaHours: number,
	moonDecDeg: number,
	date: Date,
	longitude: number
): number {
	const raDegrees = moonRaHours * 15;
	const gmst = SiderealTime(date);
	let lstDegrees = (gmst + longitude / 15) * 15;
	lstDegrees = normalizeDegrees0To360(lstDegrees);

	let hourAngle = lstDegrees - raDegrees;
	while (hourAngle > 180) hourAngle -= 360;
	while (hourAngle < -180) hourAngle += 360;

	const latRad = latitude * DEG;
	const decRad = moonDecDeg * DEG;
	const hRad = hourAngle * DEG;

	return Math.atan2(
		Math.sin(hRad),
		Math.tan(latRad) * Math.cos(decRad) - Math.sin(decRad) * Math.cos(hRad)
	);
}

/**
 * Observer-centric moon orientation at a UTC instant.
 *
 * - `parallactic_angle` (q): how the lunar disc is tilted in the local sky frame.
 * - `bright_limb_angle` (θ = pa − q): direction to the Sun, clockwise from zenith at the Moon
 *   (what a viewer sees when looking up). Use this for print posters.
 */
export function calculateMoonOrientationAngles(
	latitude: number,
	longitude: number,
	date: Date
): MoonOrientationAngles {
	const observer = new Observer(latitude, longitude, 0);
	const moonEqu = Equator(Body.Moon, date, observer, false, true);
	const sunEqu = Equator(Body.Sun, date, observer, false, true);

	const moonRa = moonEqu.ra * 15 * DEG;
	const moonDec = moonEqu.dec * DEG;
	const sunRa = sunEqu.ra * 15 * DEG;
	const sunDec = sunEqu.dec * DEG;

	const pa = positionAngleSunAtMoonRad(moonRa, moonDec, sunRa, sunDec);
	const q = parallacticAngleRad(latitude, moonEqu.ra, moonEqu.dec, date, longitude);
	const theta = pa - q;

	return {
		parallactic_angle: normalizeDegrees0To360((q * 180) / Math.PI),
		bright_limb_angle: normalizeDegrees0To360((theta * 180) / Math.PI),
	};
}

/**
 * Parallactic angle q (degrees, 0–360). Used for UI/CSS rotation on age-based assets.
 */
export function calculateMoonRotationAngle(
	latitude: number,
	longitude: number,
	date: Date
): number {
	return calculateMoonOrientationAngles(latitude, longitude, date).parallactic_angle;
}
