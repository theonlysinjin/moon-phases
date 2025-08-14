// Moon Phase Image Loader
// Inline data-URI approach to avoid HTTP fetches for frames
import { MOON_PHASE_DATA_URIS } from "../assets/phases.inline";

/**
 * Get the URL for a specific moon phase frame
 * @param frameNumber - Frame number (1-236)
 * @returns Image URL for the frame
 */
export function getMoonPhaseImageUrl(frameNumber: number): string {
  // Ensure frame is within 1..236, wrap if needed
  const wrapped = ((frameNumber - 1) % 236 + 236) % 236 + 1;
  // frames array is 0-indexed; our frames are 1..236
  const index = wrapped - 1;
  return MOON_PHASE_DATA_URIS[index];
}

/**
 * Get moon phase image URL based on moon age in days
 * @param moonAgeDays - Days since last new moon
 * @returns Image URL for the corresponding moon phase
 */
export function getMoonPhaseImageByAge(moonAgeDays: number): string {
  // Select one per day using 30 daily frames generated: index = clamp(round(days), 0..29)
  const days = Math.max(0, moonAgeDays);
  const index = Math.min(29, Math.max(0, Math.round(days)));
  // Map day to its corresponding frame data URI
  return MOON_PHASE_DATA_URIS[index];
}

/**
 * Preload all moon phase images for better performance
 * This can be called during app initialization
 */
export function preloadAllMoonPhaseImages(): void {
  // No-op for static hosting approach
}

/**
 * Get the total number of available moon phase images
 */
export function getMoonPhaseImageCount(): number {
  // 30 daily frames
  return MOON_PHASE_DATA_URIS.length || 30;
}

/**
 * Check if a specific moon phase image is available
 */
export function hasMoonPhaseImage(frameNumber: number): boolean {
  // In daily mode, index range is 1..30
  const n = Number(frameNumber);
  return n >= 1 && n <= MOON_PHASE_DATA_URIS.length;
}
