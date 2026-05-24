"use client";

import React from "react";
import { DateTime } from "luxon";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { getMoonPhaseVisual } from "../utils/getMoonPhaseVisual";
import { HourlyTimeline } from "./HourlyTimeline";
import { todayLocalDate } from "../utils/time";

function buildCalendarWeeks(
  entries: MoonPhaseEntry[],
  tz: string
): (MoonPhaseEntry | null)[][] {
  if (entries.length === 0) return [];

  const byLocal = new Map(entries.map((e) => [e.date_local, e]));
  const first = DateTime.fromISO(entries[0].date_local, { zone: tz });
  const last = DateTime.fromISO(entries[entries.length - 1].date_local, { zone: tz });

  const firstDayOfWeek = (first.weekday + 6) % 7; // 0=Monday
  const start = first.minus({ days: firstDayOfWeek });
  const lastDayOfWeek = (last.weekday + 6) % 7;
  const end = last.plus({ days: 6 - lastDayOfWeek });

  const days: (MoonPhaseEntry | null)[] = [];
  for (let d = start; d <= end; d = d.plus({ days: 1 })) {
    const localDate = d.toISODate()!;
    days.push(byLocal.get(localDate) ?? null);
  }

  const weeks: (MoonPhaseEntry | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

interface CalendarGridProps {
  moonPhases: MoonPhaseEntry[];
  theme: string;
  tz: string;
  latitude?: number;
  longitude?: number;
  viewHour?: number;
  parallacticRotationEnabled?: boolean;
  triggerRef?: React.RefObject<HTMLDivElement | null>;
  topTriggerRef?: React.RefObject<HTMLDivElement | null>;
  renderLoadPrevious?: () => React.ReactNode;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  moonPhases,
  theme,
  tz,
  latitude,
  longitude,
  viewHour,
  parallacticRotationEnabled,
  triggerRef,
  topTriggerRef,
  renderLoadPrevious,
}) => {
  if (theme === "hourly-timeline") {
    if (latitude == null || longitude == null) return null;
    return (
      <HourlyTimeline
        latitude={latitude}
        longitude={longitude}
        tz={tz}
        viewHour={viewHour}
        parallacticRotationEnabled={parallacticRotationEnabled}
      />
    );
  }

  if (!moonPhases || moonPhases.length === 0) return null;

  const todayLocal = todayLocalDate(tz);

  if (theme === "calendar") {
    const weeks = buildCalendarWeeks(moonPhases, tz);
    const weekMonths = weeks.map((week) => {
      const entry = week.find((e) => e);
      if (!entry) return null;
      const date = DateTime.fromISO(entry.date_local, { zone: tz });
      return { month: date.month - 1, year: date.year };
    });
    let lastMonth: number | null = null;
    let lastYear: number | null = null;

    return (
      <div className="w-full max-w-3xl mt-8 flex flex-col gap-0 bg-black py-4 rounded-lg">
        {renderLoadPrevious && renderLoadPrevious()}
        {topTriggerRef && (
          <div id="infinite-scroll-top-trigger" className="h-8" ref={topTriggerRef} />
        )}
        {weeks.map((week, weekIdx) => {
          const monthInfo = weekMonths[weekIdx];
          let showMonth = false;
          if (
            monthInfo &&
            (monthInfo.month !== lastMonth || monthInfo.year !== lastYear)
          ) {
            showMonth = true;
            lastMonth = monthInfo.month;
            lastYear = monthInfo.year;
          }
          return (
            <React.Fragment key={weekIdx}>
              {showMonth && monthInfo && (
                <div className="text-left text-sm font-semibold text-gray-300 mt-4 mb-1 pl-1">
                  {DateTime.fromObject(
                    { year: monthInfo.year, month: monthInfo.month + 1, day: 1 },
                    { zone: tz }
                  ).toLocaleString({ month: "long", year: "numeric" })}
                </div>
              )}
              <div
                className="grid grid-cols-7 gap-x-2 gap-y-0.5 text-white text-lg"
                style={{ lineHeight: 1.1 }}
              >
                {week.map((entry, dayIdx) =>
                  entry ? (
                    <div
                      key={entry.date_utc}
                      className="flex flex-col items-center justify-center px-0.5"
                      style={{
                        background: "none",
                        gap: "0.1rem",
                        paddingTop: 0,
                        paddingBottom: 0,
                      }}
                    >
                      {getMoonPhaseVisual(
                        entry,
                        "2.5rem",
                        "mb-0 w-10 h-10 object-contain p-1",
                        theme
                      )}
                      <span
                        className={
                          entry.date_local === todayLocal
                            ? "text-sm font-mono font-bold text-gray-400"
                            : "text-xs font-mono text-gray-400"
                        }
                        style={{ marginTop: 0 }}
                      >
                        {entry.date_local.slice(8, 10)}
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
        {triggerRef && (
          <div id="infinite-scroll-trigger" className="h-8" ref={triggerRef} />
        )}
      </div>
    );
  }

  if (theme === "lunar-cycle") {
    const rows: MoonPhaseEntry[][] = [];
    for (let i = 0; i < moonPhases.length; i += 15) {
      rows.push(moonPhases.slice(i, i + 15));
    }
    let lastMonth: number | null = null;

    return (
      <>
        {renderLoadPrevious && renderLoadPrevious()}
        <div className="w-full max-w-6xl mt-8 flex flex-col gap-0 bg-black">
          {topTriggerRef && (
            <div
              id="infinite-scroll-top-trigger"
              className="col-span-12 h-8"
              ref={topTriggerRef}
            />
          )}
          {rows.map((row, rowIdx) => {
            const first = row[0];
            let showMonth = false;
            let labelDate: DateTime | null = null;
            if (first) {
              const date = DateTime.fromISO(first.date_local, { zone: tz });
              const month = date.month - 1;
              if (month !== lastMonth) {
                showMonth = true;
                lastMonth = month;
                labelDate = date;
              }
            }
            return (
              <div key={rowIdx} className="flex flex-row items-start">
                {showMonth ? (
                  <div
                    className="w-14 text-xs text-left font-semibold text-gray-300 pr-1 flex-shrink-0 flex items-center"
                    style={{ height: "72px" }}
                  >
                    {labelDate?.toLocaleString({ month: "short", year: "2-digit" })}
                  </div>
                ) : (
                  <div className="w-14 flex-shrink-0" />
                )}
                {row.map((entry, idx) => (
                  <div
                    key={entry.date_utc + idx}
                    className="flex flex-col items-center justify-center"
                    style={{
                      minHeight: "72px",
                      height: "72px",
                      margin: 0,
                      padding: 0,
                      width: "64px",
                    }}
                  >
                    <div
                      style={{
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {getMoonPhaseVisual(
                        entry,
                        "3rem",
                        "w-12 h-12 object-contain",
                        theme
                      )}
                    </div>
                    <span
                      className="text-xs font-mono text-gray-200 text-center leading-tight"
                      style={{
                        height: "18px",
                        lineHeight: "18px",
                        display: "block",
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {entry.date_local.slice(8, 10)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
          {triggerRef && (
            <div id="infinite-scroll-trigger" className="col-span-12 h-8" ref={triggerRef} />
          )}
        </div>
      </>
    );
  }

  if (theme === "poster") {
    const phaseByMonthDay: Record<number, Record<number, MoonPhaseEntry>> = {};
    moonPhases.forEach((entry) => {
      const [, monthStr, dayStr] = entry.date_local.split("-");
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (!phaseByMonthDay[month]) phaseByMonthDay[month] = {};
      phaseByMonthDay[month][day] = entry;
    });
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
      <div className="w-fit max-w-none mx-auto mt-8">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-8 h-8" />
              {months.map((month) => (
                <th
                  key={month}
                  className="text-xs font-bold text-gray-200 px-2 py-1 text-center"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="text-xs font-mono text-gray-400 text-right pr-2 align-middle">
                  {day}
                </td>
                {months.map((month) => {
                  const entry = phaseByMonthDay[month]?.[day];
                  return (
                    <td
                      key={month + "-" + day}
                      className="bg-black p-0 m-0 text-center align-middle"
                      style={{ width: 56, height: 56 }}
                    >
                      {entry ? (
                        <div
                          className="flex flex-col items-center justify-center"
                          style={{ minHeight: 56, minWidth: 56 }}
                        >
                          {getMoonPhaseVisual(
                            entry,
                            "3rem",
                            "w-12 h-12 object-contain",
                            theme
                          )}
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

  return null;
};
