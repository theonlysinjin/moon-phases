"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { MOON_VIDEO_DATA_URI } from "../assets/phases.inline";

export function HourlyTimeline({ moonPhases }: { moonPhases: MoonPhaseEntry[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('New Moon');
  const [rotationAngle, setRotationAngle] = useState(0);

  // Get current phase based on video progress
  const getCurrentPhase = (progress: number) => {
    if (progress < 0.125) return 'New Moon';
    if (progress < 0.375) return 'First Quarter';
    if (progress < 0.625) return 'Full Moon';
    if (progress < 0.875) return 'Last Quarter';
    return 'New Moon';
  };

  // Handle video load
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setIsVideoLoaded(true);
    }
  }, []);

  // Calculate rotation angle based on video progress
  const calculateRotationAngle = useCallback((progress: number) => {
    if (moonPhases.length === 0) return 0;
    
    // Map video progress (0-1) to moon age (0-29.53 days)
    const MEAN_SYNODIC_MONTH = 29.530588;
    const moonAge = progress * MEAN_SYNODIC_MONTH;
    
    // Find the closest moon phase entry based on moon age
    let closestEntry = moonPhases[0];
    let minDiff = Math.abs(closestEntry.moon_age_days - moonAge);
    
    for (const entry of moonPhases) {
      const diff = Math.abs(entry.moon_age_days - moonAge);
      if (diff < minDiff) {
        minDiff = diff;
        closestEntry = entry;
      }
    }
    
    return closestEntry.rotation_angle;
  }, [moonPhases]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && isVideoLoaded) {
      const progress = videoRef.current.currentTime / videoRef.current.duration;
      const phase = getCurrentPhase(progress);
      setCurrentPhase(phase);
      const angle = calculateRotationAngle(progress);
      setRotationAngle(angle);
    }
  }, [isVideoLoaded, calculateRotationAngle]);

  // Handle video end - loop
  const handleVideoEnd = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, []);

  // Load video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  if (!moonPhases.length) return (
    <div className="w-full mt-8 flex flex-col items-center">
      <div className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] bg-gray-800 rounded flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400 text-sm">No moon phase data available</div>
      </div>
    </div>
  );

  return (
    <div className="w-full mt-8 flex flex-col items-center">
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px]">
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-800 rounded z-10">
            <div className="text-gray-400 text-sm">Loading lunar cycle...</div>
          </div>
        )}
        
        {/* Video with dynamic rotation based on actual moon orientation */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          style={{
            transform: `rotate(${rotationAngle}deg)`
          }}
          autoPlay
          muted
          loop
          preload="metadata"
          playsInline
          onLoadedMetadata={handleVideoLoad}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
        >
          {MOON_VIDEO_DATA_URI ? (
            <source src={MOON_VIDEO_DATA_URI} type="video/webm" />
          ) : null}
          Your browser does not support the video tag.
        </video>
        
        {/* Current phase overlay */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 text-white text-xs font-semibold rounded">
          {currentPhase}
        </div>
      </div>
      
      {/* Simple phase display */}
      <div className="mt-4 text-center">
        <div className="text-lg font-semibold text-blue-300 mb-2">
          {currentPhase}
        </div>
        <div className="text-sm text-gray-400">
          Lunar Cycle Animation
        </div>
      </div>
    </div>
  );
}


