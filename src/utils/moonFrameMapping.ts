/** Matches getMoonPhaseImageByAge: round age → index 0..29 */
export function dailyFrameIndex(moonAgeDays: number): number {
  const days = Math.max(0, moonAgeDays);
  return Math.min(29, Math.max(0, Math.round(days)));
}

/** Poster grid subset in the 236-frame NASA set (every 8th frame). */
export function fullSetFrame(moonAgeDays: number): number {
  return 1 + dailyFrameIndex(moonAgeDays) * 8;
}
