"use client";

import { LocationSelector } from "../components/LocationSelector";
import { useState, useCallback, useEffect, useRef } from "react";
import { fetchMoonPhases } from "../utils/api";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { CalendarGrid } from "../components/CalendarGrid";
import { MoonPhaseImagePreloader } from "../components/MoonPhaseImagePreloader";
import { TimeOfDaySlider } from "../components/TimeOfDaySlider";
import { CITY_OPTIONS, CITY_BY_SLUG } from "../config/cities";
import { DEFAULT_VIEW_HOUR } from "../types/api";
import {
  startOfCurrentLocalMonthYmd,
  endOfLocalMonthPlusMonthsYmd,
  addLocalDaysYmd,
  addLocalMonths,
  ymdToIsoDate,
  startOfLocalMonthYmd,
} from "../utils/time";
import { DateTime } from "luxon";

function posterCacheKey(citySlug: string, year: number, viewHour: number): string {
  return `${citySlug}-${year}-${viewHour}`;
}

export default function Home() {
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>("");
  const selectedCity = selectedCitySlug ? CITY_BY_SLUG[selectedCitySlug] : null;

  const [loading, setLoading] = useState(false);
  const [moonPhases, setMoonPhases] = useState<MoonPhaseEntry[] | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("calendar");
  const [viewHour, setViewHour] = useState(DEFAULT_VIEW_HOUR);
  const [hourlyParallacticEnabled, setHourlyParallacticEnabled] = useState(false);
  const viewHourDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewHourSkipInitialRef = useRef(true);

  const tz = selectedCity?.tz ?? "UTC";
  const currentLocalYear = DateTime.now().setZone(tz).year;
  const [posterYear, setPosterYear] = useState<number>(currentLocalYear);
  const [posterData, setPosterData] = useState<Record<string, MoonPhaseEntry[]>>({});

  type PerfLog = {
    startedAt: number;
    finishedAt: number;
    durationMs: number;
    city: string;
    from: string;
    to: string;
    numEntries: number;
    theme: string;
  };
  const [perfOpen, setPerfOpen] = useState(false);
  const [perfLogs, setPerfLogs] = useState<PerfLog[]>([]);

  const logPerf = useCallback(
    (
      city: string,
      from: string,
      to: string,
      startedAt: number,
      finishedAt: number,
      numEntries: number,
      theme: string
    ) => {
      setPerfLogs((prev) =>
        [
          {
            startedAt,
            finishedAt,
            durationMs: finishedAt - startedAt,
            city,
            from,
            to,
            numEntries,
            theme,
          },
          ...prev,
        ].slice(0, 50)
      );
    },
    []
  );

  const fetchOptions = useCallback(
    () => ({
      resolution:
        selectedTheme === "hourly-timeline"
          ? ("3h" as const)
          : ("daily" as const),
      viewHour,
    }),
    [selectedTheme, viewHour]
  );

  const loadPhases = useCallback(
    async (cityLabel: string, dateFrom: string, dateTo: string) => {
      const t0 = performance.now();
      const data = await fetchMoonPhases(cityLabel, dateFrom, dateTo, fetchOptions());
      const t1 = performance.now();
      logPerf(cityLabel, dateFrom, dateTo, t0, t1, data.length, selectedTheme);
      return data;
    },
    [fetchOptions, logPerf, selectedTheme]
  );

  type FetchDirection = "up" | "down" | undefined;

  const fetchMore = useCallback(
    async (direction?: FetchDirection | number) => {
      if (!selectedCity) return;
      if (selectedTheme === "hourly-timeline") return;

      setLoading(true);
      try {
        if (selectedTheme === "poster") {
          const yearToFetch =
            typeof direction === "number" ? direction : posterYear;
          const dateFrom = `${yearToFetch}0101`;
          const dateTo = `${yearToFetch}1231`;
          const cacheKey = posterCacheKey(selectedCitySlug, yearToFetch, viewHour);
          const cached = posterData[cacheKey];
          if (cached) {
            setMoonPhases(cached);
            setDateRange({ from: dateFrom, to: dateTo });
            return;
          }
          const data = await loadPhases(selectedCity.label, dateFrom, dateTo);
          setPosterData((prev) => ({ ...prev, [cacheKey]: data }));
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        } else if (dateRange) {
          if (direction === "down") {
            const dateFrom = addLocalDaysYmd(dateRange.to, 1, tz);
            const dateTo = addLocalMonths(ymdToIsoDate(dateFrom), 6, tz);
            const endDt = DateTime.fromISO(ymdToIsoDate(dateTo), { zone: tz }).minus({
              days: 1,
            });
            const dateToAdjusted = endDt.toFormat("yyyyMMdd");
            const data = await loadPhases(
              selectedCity.label,
              dateFrom,
              dateToAdjusted
            );
            setMoonPhases((prev) => (prev ? [...prev, ...data] : data));
            setDateRange({ from: dateRange.from, to: dateToAdjusted });
          } else if (direction === "up") {
            const dateTo = addLocalDaysYmd(dateRange.from, -1, tz);
            const dateFrom = startOfLocalMonthYmd(
              addLocalMonths(ymdToIsoDate(dateTo), -6, tz),
              tz
            );
            const data = await loadPhases(
              selectedCity.label,
              dateFrom,
              dateTo
            );
            setMoonPhases((prev) => (prev ? [...data, ...prev] : data));
            setDateRange({ from: dateFrom, to: dateRange.to });
          }
        }
      } catch {
        alert("Failed to fetch more moon phases");
      } finally {
        setLoading(false);
      }
    },
    [
      selectedCity,
      selectedCitySlug,
      selectedTheme,
      dateRange,
      posterYear,
      viewHour,
      posterData,
      loadPhases,
      tz,
    ]
  );

  const handlePosterYearChange = async (delta: number) => {
    const newYear = posterYear + delta;
    setPosterYear(newYear);
    const cacheKey = posterCacheKey(selectedCitySlug, newYear, viewHour);
    if (posterData[cacheKey]) {
      setMoonPhases(posterData[cacheKey]);
      setDateRange({ from: `${newYear}0101`, to: `${newYear}1231` });
    } else {
      await fetchMore(newYear);
    }
  };

  useEffect(() => {
    if (!moonPhases || !triggerRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.target === triggerRef.current &&
            entry.isIntersecting &&
            !loading
          ) {
            fetchMore("down");
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    observerRef.current.observe(triggerRef.current);
    return () => observerRef.current?.disconnect();
  }, [moonPhases, loading, fetchMore]);

  useEffect(() => {
    if (!selectedCity) return;

    viewHourSkipInitialRef.current = true;
    setMoonPhases(null);

    const fetchData = async () => {
      setLoading(true);
      try {
        let dateFrom: string;
        let dateTo: string;

        if (selectedTheme === "poster") {
          const year = DateTime.now().setZone(tz).year;
          dateFrom = `${year}0101`;
          dateTo = `${year}1231`;
          const cacheKey = posterCacheKey(selectedCitySlug, year, viewHour);
          const cached = posterData[cacheKey];
          if (cached) {
            setPosterYear(year);
            setMoonPhases(cached);
            setDateRange({ from: dateFrom, to: dateTo });
            return;
          }
          const data = await loadPhases(selectedCity.label, dateFrom, dateTo);
          setPosterData((prev) => ({ ...prev, [cacheKey]: data }));
          setPosterYear(year);
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        } else if (["calendar", "lunar-cycle"].includes(selectedTheme)) {
          dateFrom = startOfCurrentLocalMonthYmd(tz);
          dateTo = endOfLocalMonthPlusMonthsYmd(tz, 5);
          const data = await loadPhases(selectedCity.label, dateFrom, dateTo);
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        } else if (selectedTheme === "hourly-timeline") {
          setMoonPhases([]);
          setDateRange(null);
        }
      } catch {
        alert("Failed to fetch moon phases");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- posterData intentionally excluded
  }, [selectedCitySlug, selectedTheme]);

  // Regenerate when viewHour changes (daily themes only)
  useEffect(() => {
    if (viewHourSkipInitialRef.current) {
      viewHourSkipInitialRef.current = false;
      return;
    }
    if (!selectedCity || !dateRange) return;
    if (selectedTheme === "hourly-timeline") return;

    if (viewHourDebounceRef.current) {
      clearTimeout(viewHourDebounceRef.current);
    }

    viewHourDebounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { from, to } = dateRange;
        const data = await loadPhases(selectedCity.label, from, to);
        if (selectedTheme === "poster") {
          const year = from.slice(0, 4);
          const cacheKey = posterCacheKey(selectedCitySlug, Number(year), viewHour);
          setPosterData((prev) => ({ ...prev, [cacheKey]: data }));
        }
        setMoonPhases(data);
      } catch {
        alert("Failed to update viewing time");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (viewHourDebounceRef.current) clearTimeout(viewHourDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewHour]);

  const darkControls = ["calendar", "lunar-cycle", "poster"].includes(selectedTheme);
  const showViewHourSlider = selectedTheme !== "hourly-timeline";
  const showHourlyParallacticCheckbox =
    selectedTheme === "hourly-timeline" && selectedCity != null;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 gap-8 bg-black text-white">
      <MoonPhaseImagePreloader />

      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setPerfOpen((o) => !o)}
          className="px-3 py-2 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600 shadow"
          title="Show generation stats"
        >
          {(() => {
            const last = perfLogs[0];
            const toStr = dateRange
              ? `${dateRange.to.slice(0, 4)}-${dateRange.to.slice(4, 6)}-${dateRange.to.slice(6, 8)}`
              : "—";
            return last
              ? `Gen ${Math.round(last.durationMs)}ms • to ${toStr}`
              : `Gen • to ${toStr}`;
          })()}
        </button>
        {perfOpen && (
          <div className="mt-2 w-80 max-h-64 overflow-auto bg-gray-900 text-gray-200 text-xs border border-gray-700 rounded shadow-lg p-2">
            <div className="font-semibold mb-1">Generation Stats</div>
            <div className="mb-1">
              Loaded to:{" "}
              {dateRange
                ? `${dateRange.to.slice(0, 4)}-${dateRange.to.slice(4, 6)}-${dateRange.to.slice(6, 8)}`
                : "—"}
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left pr-2">ms</th>
                  <th className="text-left pr-2">city</th>
                  <th className="text-left pr-2">from</th>
                  <th className="text-left pr-2">to</th>
                  <th className="text-right">#</th>
                </tr>
              </thead>
              <tbody>
                {perfLogs.slice(0, 20).map((log, i) => (
                  <tr key={log.finishedAt + "-" + i}>
                    <td className="pr-2">{Math.round(log.durationMs)}</td>
                    <td className="pr-2">{log.city}</td>
                    <td className="pr-2">{`${log.from.slice(0, 4)}-${log.from.slice(4, 6)}-${log.from.slice(6, 8)}`}</td>
                    <td className="pr-2">{`${log.to.slice(0, 4)}-${log.to.slice(4, 6)}-${log.to.slice(6, 8)}`}</td>
                    <td className="text-right">{log.numEntries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-400 leading-snug">
              Images:{" "}
              <a
                href="https://svs.gsfc.nasa.gov/4310/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-gray-300 hover:text-white"
              >
                NASA&apos;s Scientific Visualization Studio
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 mb-2">
        <div className="flex-1">
          <label htmlFor="city-select" className="block mb-1 font-medium">
            City:
          </label>
          <LocationSelector
            cities={CITY_OPTIONS}
            onSelect={(c) => setSelectedCitySlug(c.value)}
            className={`w-full border rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              darkControls
                ? "bg-gray-900 text-white border-gray-700 placeholder-gray-400"
                : "bg-white text-black border-gray-300"
            }`}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="theme-select" className="block mb-1 font-medium">
            Theme:
          </label>
          <select
            id="theme-select"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className={`w-full border rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              darkControls
                ? "bg-gray-900 text-white border-gray-700"
                : "bg-white text-black border-gray-300"
            }`}
          >
            <option value="calendar">Calendar</option>
            <option value="lunar-cycle">Lunar Cycle</option>
            <option value="hourly-timeline">Hourly Timeline</option>
            <option value="poster">Poster</option>
          </select>
        </div>
        {showViewHourSlider && selectedCity && (
          <TimeOfDaySlider
            value={viewHour}
            onChange={setViewHour}
            tz={tz}
            cityLabel={selectedCity.label}
            className={darkControls ? "text-white" : "text-black"}
          />
        )}
        {showHourlyParallacticCheckbox && (
          <label className="flex items-start gap-2 cursor-pointer text-white">
            <input
              type="checkbox"
              checked={hourlyParallacticEnabled}
              onChange={(e) => setHourlyParallacticEnabled(e.target.checked)}
              className="mt-0.5 accent-blue-500"
            />
            <span>
              Parallactic rotation
              <span className="block text-xs text-gray-500 mt-0.5 font-normal">
                Uses {selectedCity!.label} ({tz}). Synodic cycle only when off.
              </span>
            </span>
          </label>
        )}
      </div>

      {loading && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded shadow-lg z-50 transition-opacity">
          Loading moon phases…
        </div>
      )}

      {!loading && !selectedCity && (
        <div className="mt-12 text-gray-500 text-lg">
          No moon phase data to display. Select a city to begin.
        </div>
      )}

      {!loading &&
        selectedCity &&
        selectedTheme !== "hourly-timeline" &&
        (!moonPhases || moonPhases.length === 0) && (
        <div className="mt-12 text-gray-500 text-lg">
          No moon phase data to display.
        </div>
      )}

      {selectedCity &&
        (selectedTheme === "hourly-timeline" ||
          (moonPhases && moonPhases.length > 0)) && (
        <>
          <div className="w-full flex flex-col items-center">
            <div className="mt-2 text-2xl font-semibold text-center">
              Moon Phase Calendar for{" "}
              <span className="font-bold">{selectedCity.label}</span>
              {dateRange && (
                <span className="ml-2 text-xl font-normal text-gray-500">
                  {dateRange.from.slice(0, 4) === dateRange.to.slice(0, 4)
                    ? dateRange.from.slice(0, 4)
                    : `${dateRange.from.slice(0, 4)}–${dateRange.to.slice(0, 4)}`}
                </span>
              )}
            </div>
            <CalendarGrid
              moonPhases={moonPhases ?? []}
              theme={selectedTheme}
              tz={tz}
              latitude={selectedCity.lat}
              longitude={selectedCity.lon}
              viewHour={viewHour}
              parallacticRotationEnabled={hourlyParallacticEnabled}
              triggerRef={triggerRef}
              renderLoadPrevious={() => null}
              key={`${selectedTheme}-${selectedCitySlug}-${viewHour}`}
            />
          </div>

          {selectedTheme === "poster" && (
            <div className="flex flex-row gap-2 justify-center mt-4 mb-2">
              <button
                onClick={() => handlePosterYearChange(-1)}
                className="w-32 px-3 py-1 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600 shadow"
                disabled={loading || posterYear <= 1900}
              >
                Previous Year
              </button>
              <button
                onClick={() => handlePosterYearChange(1)}
                className="w-32 px-3 py-1 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600 shadow"
                disabled={loading || posterYear >= 2100}
              >
                Next Year
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
