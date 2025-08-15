"use client";

// Moon phase images from http://www.madpc.co.uk/~peterl/Moon/Phases.html (Peter Lloyd's Astronomical Images)
import React from "react";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { getMoonPhaseVisual } from "../utils/getMoonPhaseVisual";
import { HourlyTimeline } from "./HourlyTimeline";

function buildCalendarWeeks(entries: MoonPhaseEntry[]): (MoonPhaseEntry | null)[][] {
  if (entries.length === 0) return [];
  const firstDate = new Date(entries[0].date_utc.slice(0, 10));
  const lastDate = new Date(entries[entries.length - 1].date_utc.slice(0, 10));
  // Find the first Monday before or on the first day
  const firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0=Monday, 6=Sunday
  const start = new Date(firstDate);
  start.setDate(firstDate.getDate() - firstDayOfWeek);
  // Find the last Sunday after or on the last day
  const lastDayOfWeek = (lastDate.getDay() + 6) % 7;
  const end = new Date(lastDate);
  end.setDate(lastDate.getDate() + (6 - lastDayOfWeek));
  // Build days
  const days: (MoonPhaseEntry | null)[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().slice(0, 10);
    const found = entries.find(e => e.date_utc.slice(0, 10) === dStr);
    days.push(found || null);
  }
  // Split into weeks
  const weeks: (MoonPhaseEntry | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

interface CalendarGridProps {
  moonPhases: MoonPhaseEntry[];
  theme: string;
  triggerRef?: React.RefObject<HTMLDivElement | null>;
  topTriggerRef?: React.RefObject<HTMLDivElement | null>;
  renderLoadPrevious?: () => React.ReactNode;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ moonPhases, theme, triggerRef, topTriggerRef, renderLoadPrevious }) => {
  if (!moonPhases || moonPhases.length === 0) return null;
  if (theme === "hourly-timeline") {
    return <HourlyTimeline moonPhases={moonPhases} />;
  }
  if (theme === "calendar") {
    // Calendar: endless grid of weeks, no headers, just moon and date, black background, month indicator
    const weeks = buildCalendarWeeks(moonPhases);
    // Find the month for each week (use first non-null entry in week)
    const weekMonths = weeks.map(week => {
      const entry = week.find(e => e);
      if (!entry) return null;
      const date = new Date(entry.date_utc.slice(0, 10));
      return { month: date.getMonth(), year: date.getFullYear() };
    });
    let lastMonth: number | null = null;
    let lastYear: number | null = null;
    const todayIso = new Date().toISOString().slice(0, 10);
    return (
      <div className="w-full max-w-3xl mt-8 flex flex-col gap-0 bg-black py-4 rounded-lg">
        {renderLoadPrevious && renderLoadPrevious()}
        {topTriggerRef && <div id="infinite-scroll-top-trigger" className="h-8" ref={topTriggerRef}></div>}
        {weeks.map((week, weekIdx) => {
          const monthInfo = weekMonths[weekIdx];
          let showMonth = false;
          if (monthInfo && (monthInfo.month !== lastMonth || monthInfo.year !== lastYear)) {
            showMonth = true;
            lastMonth = monthInfo.month;
            lastYear = monthInfo.year;
          }
          return (
            <React.Fragment key={weekIdx}>
              {showMonth && monthInfo && (
                <div className="text-left text-sm font-semibold text-gray-300 mt-4 mb-1 pl-1">
                  {new Date(monthInfo.year, monthInfo.month, 1).toLocaleString("default", { month: "long", year: "numeric" })}
                </div>
              )}
              <div className="grid grid-cols-7 gap-x-2 gap-y-0.5 text-white text-lg" style={{lineHeight: 1.1}}>
                {week.map((entry, dayIdx) =>
                  entry ? (
                    <div
                      key={entry.date_utc}
                      className="flex flex-col items-center justify-center px-0.5"
                      style={{background: "none", gap: '0.1rem', paddingTop: 0, paddingBottom: 0}}
                    >
                      {getMoonPhaseVisual(entry, "2.5rem", "mb-0 w-10 h-10 object-contain p-1", theme)}
                      <span className={entry.date_utc.slice(0,10) === todayIso ? "text-sm font-mono font-bold text-gray-400" : "text-xs font-mono text-gray-400"} style={{marginTop: 0}}>
                        {entry.date_utc.slice(8, 10)}
                      </span>
                    </div>
                  ) : (
                    <div key={"empty-" + weekIdx + "-" + dayIdx} />
                  )
                )}
              </div>
            </React.Fragment>
          );
        })}
        {triggerRef && <div id="infinite-scroll-trigger" className="h-8" ref={triggerRef}></div>}
      </div>
    );
  }
  if (theme === "lunar-cycle") {
    // Lunar Cycle: flat grid, 15 columns (half lunar cycle), all moon phases in order, ultra-compact rows
    // Split into rows of 15
    const rows: MoonPhaseEntry[][] = [];
    for (let i = 0; i < moonPhases.length; i += 15) {
      rows.push(moonPhases.slice(i, i + 15));
    }
    let lastMonth: number | null = null;
    return (
      <>
        {renderLoadPrevious && renderLoadPrevious()}
        <div className="w-full max-w-6xl mt-8 flex flex-col gap-0 bg-black">
          {topTriggerRef && <div id="infinite-scroll-top-trigger" className="col-span-12 h-8" ref={topTriggerRef}></div>}
          {rows.map((row, rowIdx) => {
            const first = row[0];
            let showMonth = false;
            let labelDate: Date | null = null;
            if (first) {
              const date = new Date(first.date_utc.slice(0, 10));
              const month = date.getMonth();
              if (month !== lastMonth) {
                showMonth = true;
                lastMonth = month;
                labelDate = date;
              }
            }
            return (
              <div key={rowIdx} className="flex flex-row items-start">
                {showMonth ? (
                  <div className="w-14 text-xs text-left font-semibold text-gray-300 pr-1 flex-shrink-0 flex items-center" style={{height: '72px'}}>
                    {labelDate && labelDate.toLocaleString("default", { month: "short", year: "2-digit" })}
                  </div>
                ) : (
                  <div className="w-14 flex-shrink-0" />
                )}
                {row.map((entry, idx) => (
                  <div
                    key={entry.date_utc + idx}
                    className="flex flex-col items-center justify-center"
                    style={{ minHeight: '72px', height: '72px', margin: 0, padding: 0, width: '64px' }}
                  >
                    <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}>
                      {getMoonPhaseVisual(entry, "3rem", "w-12 h-12 object-contain", theme)}
                    </div>
                    <span
                      className="text-xs font-mono text-gray-200 text-center leading-tight"
                      style={{ height: '18px', lineHeight: '18px', display: 'block', margin: 0, padding: 0 }}
                    >
                      {entry.date_utc.slice(8, 10)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          {triggerRef && <div id="infinite-scroll-trigger" className="col-span-12 h-8" ref={triggerRef}></div>}
        </div>
      </>
    );
  }
  if (theme === "poster") {
    // Poster: transposed grid, months 1-12 as columns, days 1-31 as rows
    // Build a lookup: { [month]: { [day]: MoonPhaseEntry } }
    const phaseByMonthDay: Record<number, Record<number, MoonPhaseEntry>> = {};
    moonPhases.forEach(entry => {
      const date = new Date(entry.date_utc.slice(0, 10));
      const month = date.getMonth() + 1; // 1-indexed
      const day = date.getDate();
      if (!phaseByMonthDay[month]) phaseByMonthDay[month] = {};
      phaseByMonthDay[month][day] = entry;
    });
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    return (
      <div className="w-full overflow-x-auto mt-8">
        <table className="border-collapse mx-auto">
          <thead>
            <tr>
              <th className="w-8 h-8"></th>
              {months.map(month => (
                <th key={month} className="text-xs font-bold text-gray-200 px-2 py-1 text-center">{month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td className="text-xs font-mono text-gray-400 text-right pr-2 align-middle">{day}</td>
                {months.map(month => {
                  const entry = phaseByMonthDay[month]?.[day];
                  return (
                    <td key={month + '-' + day} className="bg-black p-0 m-0 text-center align-middle" style={{ width: 56, height: 56 }}>
                      {entry ? (
                        <div className="flex flex-col items-center justify-center" style={{ minHeight: 56, minWidth: 56 }}>
                          {getMoonPhaseVisual(entry, "3rem", "w-12 h-12 object-contain", theme)}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  // Traditional theme removed
  return null;
};