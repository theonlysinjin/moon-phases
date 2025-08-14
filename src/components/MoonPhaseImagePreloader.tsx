"use client";

import { useEffect } from "react";
import { preloadAllMoonPhaseImages, getMoonPhaseImageCount } from "../utils/moonPhaseImageLoader";

/**
 * Component that preloads all moon phase images during app initialization
 * This ensures all images are available immediately when needed
 */
export function MoonPhaseImagePreloader() {
  useEffect(() => {
    // Preload all moon phase images on component mount
    preloadAllMoonPhaseImages();
    
    // Log the number of preloaded images for debugging
    const imageCount = getMoonPhaseImageCount();
    console.log(`Moon Phase Image Preloader: ${imageCount} images ready`);
  }, []);

  // This component doesn't render anything visible
  return null;
}
