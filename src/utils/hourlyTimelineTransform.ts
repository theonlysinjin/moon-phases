/** Video playback rate when parallactic rotation is enabled (much slower than real-time). */
export const PARALLACTIC_PLAYBACK_RATE = 0.12;

/** CSS transform for Hourly Timeline video (none vs parallactic rotate). */
export function videoTransform(
  parallacticEnabled: boolean,
  rotationAngleDeg: number
): string {
  if (!parallacticEnabled) return "none";
  return `rotate(${rotationAngleDeg}deg)`;
}
