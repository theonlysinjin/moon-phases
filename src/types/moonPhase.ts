export type MoonPhaseEntry = {
  city: string;
  date_utc: string;
  illuminated_fraction: number;
  is_waxing: boolean;
  latitude: number;
  longitude: number;
  major_phase: string | null;
  moon_age_days: number;
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
}; 