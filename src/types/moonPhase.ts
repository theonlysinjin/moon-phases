export type MoonPhaseEntry = {
  city: string;
  /** Canonical observer sample instant (ISO UTC) */
  date_utc: string;
  /** Local calendar day in city TZ (YYYY-MM-DD) for display/grouping */
  date_local: string;
  illuminated_fraction: number;
  is_waxing: boolean;
  latitude: number;
  longitude: number;
  major_phase: string | null;
  moon_age_days: number;
  /** Parallactic angle q (degrees). UI disk tilt on age-based assets. */
  rotation_angle: number;
  /** Bright-limb angle θ = pa − q (degrees). Sun clockwise from zenith at the Moon; use for posters. */
  bright_limb_angle: number;
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
}; 