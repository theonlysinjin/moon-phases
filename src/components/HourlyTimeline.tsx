"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MOON_VIDEO_DATA_URI } from "../assets/phases.inline";
import { DEFAULT_VIEW_HOUR } from "../types/api";
import {
  PARALLACTIC_PLAYBACK_RATE,
  videoTransform,
} from "../utils/hourlyTimelineTransform";
import {
  getSynodicAnchorUtc,
  rotationAtSynodicProgress,
  sampleUtcAtSynodicProgress,
} from "../utils/synodicRotation";
import { interpolateRotation, utcToLocalDate, utcToLocalTime } from "../utils/time";

function getCurrentPhase(progress: number): string {
  if (progress < 0.125) return "New Moon";
  if (progress < 0.375) return "First Quarter";
  if (progress < 0.625) return "Full Moon";
  if (progress < 0.875) return "Last Quarter";
  return "New Moon";
}

/** How quickly displayed rotation catches up to the target (0–1 per frame). */
const ROTATION_SMOOTHING = 0.06;

export type HourlyTimelineProps = {
  latitude: number;
  longitude: number;
  tz: string;
  viewHour?: number;
  parallacticRotationEnabled?: boolean;
};

export function HourlyTimeline({
  latitude,
  longitude,
  tz,
  viewHour = DEFAULT_VIEW_HOUR,
  parallacticRotationEnabled = false,
}: HourlyTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("New Moon");
  const [rotationAngle, setRotationAngle] = useState(0);
  const [localTimeLabel, setLocalTimeLabel] = useState("");
  const [localDateLabel, setLocalDateLabel] = useState("");
  const rafRef = useRef<number | null>(null);
  const displayedRotationRef = useRef(0);
  const targetRotationRef = useRef(0);

  const anchorUtc = useMemo(
    () => getSynodicAnchorUtc(tz, viewHour),
    [tz, viewHour]
  );

  const updatePhaseFromProgress = useCallback((progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    setCurrentPhase(getCurrentPhase(clamped));
  }, []);

  const updateParallacticTarget = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      updatePhaseFromProgress(clamped);
      targetRotationRef.current = rotationAtSynodicProgress(
        clamped,
        latitude,
        longitude,
        anchorUtc
      );
      const sampleUtc = sampleUtcAtSynodicProgress(clamped, anchorUtc);
      const iso = sampleUtc.toISOString();
      setLocalTimeLabel(utcToLocalTime(iso, tz));
      setLocalDateLabel(utcToLocalDate(iso, tz));
    },
    [latitude, longitude, anchorUtc, tz, updatePhaseFromProgress]
  );

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (video?.duration && isFinite(video.duration)) {
      updateParallacticTarget(video.currentTime / video.duration);
      const smoothed = interpolateRotation(
        displayedRotationRef.current,
        targetRotationRef.current,
        ROTATION_SMOOTHING
      );
      displayedRotationRef.current = smoothed;
      setRotationAngle(smoothed);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [updateParallacticTarget]);

  const startRafIfPlaying = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused) {
      stopRaf();
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [stopRaf, tick]);

  const handleVideoLoad = useCallback(() => {
    const video = videoRef.current;
    if (video?.duration && isFinite(video.duration)) {
      setIsVideoLoaded(true);
      video.playbackRate = parallacticRotationEnabled
        ? PARALLACTIC_PLAYBACK_RATE
        : 1;
      const progress = video.currentTime / video.duration;
      if (parallacticRotationEnabled) {
        updateParallacticTarget(progress);
        displayedRotationRef.current = targetRotationRef.current;
        setRotationAngle(targetRotationRef.current);
        startRafIfPlaying();
      } else {
        updatePhaseFromProgress(progress);
      }
    }
  }, [
    parallacticRotationEnabled,
    updateParallacticTarget,
    updatePhaseFromProgress,
    startRafIfPlaying,
  ]);

  const handleTimeUpdate = useCallback(() => {
    if (!parallacticRotationEnabled && videoRef.current?.duration) {
      updatePhaseFromProgress(
        videoRef.current.currentTime / videoRef.current.duration
      );
    }
  }, [parallacticRotationEnabled, updatePhaseFromProgress]);

  const handlePlay = useCallback(() => {
    if (parallacticRotationEnabled) {
      startRafIfPlaying();
    }
  }, [parallacticRotationEnabled, startRafIfPlaying]);

  const handlePause = useCallback(() => {
    stopRaf();
  }, [stopRaf]);

  const handleVideoEnd = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, []);

  useEffect(() => {
    videoRef.current?.load();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = parallacticRotationEnabled ? PARALLACTIC_PLAYBACK_RATE : 1;

    if (parallacticRotationEnabled) {
      if (video.duration && isFinite(video.duration)) {
        updateParallacticTarget(video.currentTime / video.duration);
        displayedRotationRef.current = targetRotationRef.current;
        setRotationAngle(targetRotationRef.current);
        startRafIfPlaying();
      }
    } else {
      stopRaf();
      displayedRotationRef.current = 0;
      targetRotationRef.current = 0;
      setRotationAngle(0);
      setLocalTimeLabel("");
      setLocalDateLabel("");
      if (video.duration && isFinite(video.duration)) {
        updatePhaseFromProgress(video.currentTime / video.duration);
      }
    }
  }, [
    parallacticRotationEnabled,
    updateParallacticTarget,
    updatePhaseFromProgress,
    startRafIfPlaying,
    stopRaf,
  ]);

  useEffect(() => {
    return () => stopRaf();
  }, [stopRaf]);

  const transform = videoTransform(parallacticRotationEnabled, rotationAngle);

  return (
    <div className="w-full mt-8 flex flex-col items-center">
      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px]">
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-800 rounded z-10">
            <div className="text-gray-400 text-sm">Loading lunar cycle...</div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          style={{ transform }}
          autoPlay
          muted
          loop
          preload="metadata"
          playsInline
          onLoadedMetadata={handleVideoLoad}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleVideoEnd}
        >
          {MOON_VIDEO_DATA_URI ? (
            <source src={MOON_VIDEO_DATA_URI} type="video/webm" />
          ) : null}
          Your browser does not support the video tag.
        </video>

        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 text-white text-xs font-semibold rounded">
          {currentPhase}
        </div>
        {parallacticRotationEnabled && localTimeLabel && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800/80 text-white text-xs font-mono rounded text-right leading-tight">
            <div>{localTimeLabel}</div>
            {localDateLabel && (
              <div className="text-gray-400 text-[10px]">{localDateLabel}</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <div className="text-lg font-semibold text-blue-300 mb-2">{currentPhase}</div>
        <div className="text-sm text-gray-400">Lunar Cycle Animation</div>
      </div>
    </div>
  );
}
