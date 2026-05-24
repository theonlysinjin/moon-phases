export type FetchOptions = {
  resolution?: 'daily' | '3h';
  /** Local hour 0–23 for daily samples; default 21 (9pm) */
  viewHour?: number;
};

export const DEFAULT_VIEW_HOUR = 21;


