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
  rotation_angle: number;
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
}; 