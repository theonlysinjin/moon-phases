"use client";

import React from "react";

/** e.g. 15h00 (Africa/Johannesburg) */
export function formatViewingTimeDisplay(hour: number, tz: string): string {
  const h = hour % 24;
  return `${String(h).padStart(2, "0")}h00 (${tz})`;
}

type TimeOfDaySliderProps = {
  value: number;
  onChange: (hour: number) => void;
  tz: string;
  cityLabel?: string;
  className?: string;
};

export function TimeOfDaySlider({
  value,
  onChange,
  tz,
  cityLabel,
  className,
}: TimeOfDaySliderProps) {
  const display = formatViewingTimeDisplay(value, tz);
  const title = cityLabel ? `Viewing time in ${cityLabel}` : undefined;

  return (
    <div className={className}>
      <label htmlFor="view-hour" className="block mb-1 font-medium" title={title}>
        Viewing time:{" "}
        <span className="font-normal text-gray-400">{display}</span>
      </label>
      <input
        id="view-hour"
        type="range"
        min={0}
        max={23}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
