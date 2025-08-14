"use client";

import React from "react";
import Image from "next/image";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { getMoonPhaseImageByAge } from "./moonPhaseImageLoader";

export function getMoonPhaseVisual(
  entry: MoonPhaseEntry,
  size: string = "2rem",
  className?: string,
  theme?: string
): React.ReactNode {
  function parseSizeToPixels(sizeStr: string): number {
    const trimmed = sizeStr.trim();
    if (trimmed.endsWith("px")) {
      const n = Number(trimmed.slice(0, -2));
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 64;
    }
    if (trimmed.endsWith("rem")) {
      const n = Number(trimmed.slice(0, -3));
      return Number.isFinite(n) && n > 0 ? Math.round(n * 16) : 64;
    }
    // Fallback
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 64;
  }
  const pixelSize = parseSizeToPixels(size);
  // Get the moon phase image URL using the optimized loader
  const imgSrc = getMoonPhaseImageByAge(entry.moon_age_days);

  // Southern hemisphere should view with lunar south up (rotate 180deg)
  const isSouthernHemisphere = entry.latitude < 0;
  const rotationStyle = isSouthernHemisphere ? "rotate(180deg)" : "none";

  // Only add background for traditional theme
  if (theme === "traditional") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          borderRadius: "50%",
          width: size,
          height: size,
          padding: 0,
        }}
        className={className}
      >
        <Image
          src={imgSrc}
          alt="Moon phase"
          width={Math.max(1, Math.round(pixelSize * 0.92))}
          height={Math.max(1, Math.round(pixelSize * 0.92))}
          style={{
            width: "92%",
            height: "92%",
            display: "block",
            objectFit: "contain",
            transform: rotationStyle,
          }}
          priority={false}
          loading="lazy"
        />
      </span>
    );
  }
  
  // Default: just the image
  return (
    <Image
      src={imgSrc}
      alt="Moon phase"
      width={pixelSize}
      height={pixelSize}
      style={{ width: size, height: size, transform: rotationStyle, objectFit: "contain" }}
      className={className}
      priority={false}
      loading="lazy"
    />
  );
} 