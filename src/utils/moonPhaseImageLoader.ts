// Moon Phase Image Loader
// For static hosting, load images directly from the public folder
// Paths resolve to `/phases/moon.0001.jpg` ... `/phases/moon.0236.jpg`

/**
 * Get the URL for a specific moon phase frame
 * @param frameNumber - Frame number (1-236)
 * @returns Image URL for the frame
 */
export function getMoonPhaseImageUrl(frameNumber: number): string {
  // Ensure frame is within 1..236, wrap if needed
  const wrapped = ((frameNumber - 1) % 236 + 236) % 236 + 1;
  const frameStr = String(wrapped).padStart(4, "0");
  return `/phases/moon.${frameStr}.jpg`;
}

/**
 * Get moon phase image URL based on moon age in days
 * @param moonAgeDays - Days since last new moon
 * @returns Image URL for the corresponding moon phase
 */
export function getMoonPhaseImageByAge(moonAgeDays: number): string {
  // frame number = (days × 8) + 1, rounded to nearest frame
  const days = Math.max(0, moonAgeDays);
  const nearestFrame = Math.round(days * 8) + 1; // 1..236 approximately
  return getMoonPhaseImageUrl(nearestFrame);
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
  // Fixed number of frames available
  return 236;
}

/**
 * Check if a specific moon phase image is available
 */
export function hasMoonPhaseImage(frameNumber: number): boolean {
  const frameStr = String(frameNumber).padStart(4, "0");
  // Existence check is trivial for static public assets
  return Number(frameStr) >= 1 && Number(frameStr) <= 236;
}
