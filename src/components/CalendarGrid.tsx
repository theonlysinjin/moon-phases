// Moon phase images from http://www.madpc.co.uk/~peterl/Moon/Phases.html (Peter Lloyd's Astronomical Images)
import React from "react";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { getMoonPhaseVisual } from "../utils/getMoonPhaseVisual";

// Helper: Group entries by year and month, and build calendar weeks
function groupByYearMonth(entries: MoonPhaseEntry[]) {
  const result: Record<string, Record<string, MoonPhaseEntry[]>> = {};
  for (const entry of entries) {
    const date = new Date(entry.date_utc.slice(0, 10));
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    if (!result[year]) result[year] = {};
    if (!result[year][month]) result[year][month] = [];
    result[year][month].push(entry);
  }
  return result;
}

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
  if (theme === "minimal") {
    // Minimal: endless grid of weeks, no headers, just emoji and date, black background, month indicator
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
                      {getMoonPhaseVisual(entry, "2rem", "mb-0 w-8 h-8 object-contain", theme)}
                      <span className="text-xs font-mono text-gray-400" style={{marginTop: 0}}>{entry.date_utc.slice(8, 10)}</span>
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
    // Lunar Cycle: flat grid, 14 columns (half lunar cycle), all moon phases in order, ultra-compact rows
    // Split into rows of 14
    const rows: MoonPhaseEntry[][] = [];
    for (let i = 0; i < moonPhases.length; i += 14) {
      rows.push(moonPhases.slice(i, i + 14));
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
                  <div className="w-12 text-xs text-left font-semibold text-gray-300 pr-1 flex-shrink-0 flex items-center" style={{height: '54px'}}>
                    {labelDate && labelDate.toLocaleString("default", { month: "short", year: "2-digit" })}
                  </div>
                ) : (
                  <div className="w-12 flex-shrink-0" />
                )}
                {row.map((entry, idx) => (
                  <div
                    key={entry.date_utc + idx}
                    className="flex flex-col items-center justify-center"
                    style={{ minHeight: '54px', height: '54px', margin: 0, padding: 0, width: '48px' }}
                  >
                    <div style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0 }}>
                      {getMoonPhaseVisual(entry, "1.5rem", "w-6 h-6 object-contain", theme)}
                    </div>
                    <span
                      className="text-xs font-mono text-gray-200 text-center leading-tight"
                      style={{ height: '14px', lineHeight: '14px', display: 'block', margin: 0, padding: 0 }}
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
                    <td key={month + '-' + day} className="bg-black p-0 m-0 text-center align-middle" style={{ width: 32, height: 32 }}>
                      {entry ? (
                        <div className="flex flex-col items-center justify-center" style={{ minHeight: 32, minWidth: 32 }}>
                          {getMoonPhaseVisual(entry, "1.25rem", "w-5 h-5 object-contain", theme)}
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
  // Poster (Print) removed
  // Only 'traditional' theme for now
  return (
    <div className="w-full max-w-5xl mt-8 print:mt-0">
      {renderLoadPrevious && renderLoadPrevious()}
      {/* Calendar grid with month and year headers */}
      {(() => {
        const grouped = groupByYearMonth(moonPhases);
        const years = Object.keys(grouped).sort();
        return years.map((year) => (
          <div key={year} className="mb-16 print:mb-0 print:break-after-page">
            {/* Year poster header */}
            <div className="text-4xl font-extrabold text-center mb-8 mt-12 print:mt-0 print:text-5xl print:mb-4 border-b-4 border-gray-300 pb-2 print:border-b-8 print:pb-4">
              {year}
            </div>
            {Object.keys(grouped[year])
              .sort((a, b) => Number(a) - Number(b))
              .map((month) => {
                const monthNum = Number(month);
                const monthName = new Date(Number(year), monthNum, 1).toLocaleString("default", { month: "long" });
                const weeks = buildCalendarWeeks(grouped[year][month]);
                return (
                  <div key={month} className="mb-12 print:mb-8">
                    {/* Month header */}
                    <div className="text-2xl font-bold text-left mb-2 mt-8 print:mt-0 print:text-3xl print:mb-2 border-l-4 border-blue-400 pl-3 print:border-l-8 print:pl-6">
                      {monthName}
                    </div>
                    {/* Weekday labels */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-600 mb-1 print:text-base">
                      <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
                    </div>
                    {/* Calendar weeks */}
                    <div className="grid grid-cols-7 gap-1">
                      {weeks.flat().map((entry, idx) =>
                        entry ? (
                          <div key={entry.date_utc} className="aspect-square flex flex-col items-center justify-center border border-gray-200 bg-white print:bg-white print:border-gray-400 p-1 print:p-2">
                            {getMoonPhaseVisual(entry, "2.5rem", "text-2xl print:text-3xl mb-1 w-10 h-10 object-contain", theme)}
                            <span className="text-xs print:text-base font-mono">{entry.date_utc.slice(8, 10)}</span>
                            <span className="text-[10px] print:text-xs text-gray-500">{entry.major_phase ?? "—"}</span>
                          </div>
                        ) : (
                          <div key={year+month+idx} className="aspect-square bg-gray-50 print:bg-gray-100" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ));
      })()}
      {triggerRef && <div id="infinite-scroll-trigger" className="h-8" ref={triggerRef}></div>}
    </div>
  );
};