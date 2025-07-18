"use client";

import { LocationSelector, CityOption } from "../components/LocationSelector";
import { useState } from "react";
import { fetchMoonPhases } from "../utils/api";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { useEffect } from "react";
import { useRef } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// TODO: Refactor data state to support infinite loading (track loaded date range, append data)
// TODO: Build full-screen, responsive calendar grid UI (Tailwind)
// TODO: Implement infinite scroll logic (detect near-end, fetch/append more data)
// TODO: Add loading indicator and UX enhancements
// TODO: (Optional) Add month/year navigation

// Helper: Group entries by year and month, and build calendar weeks
// function groupByYearMonth(entries: MoonPhaseEntry[]) {
//   const result: Record<string, Record<string, MoonPhaseEntry[]>> = {};
//   for (const entry of entries) {
//     const date = new Date(entry.date_utc.slice(0, 10));
//     const year = date.getFullYear();
//     const month = date.getMonth(); // 0-indexed
//     if (!result[year]) result[year] = {};
//     if (!result[year][month]) result[year][month] = [];
//     result[year][month].push(entry);
//   }
//   return result;
// }

// Helper: Build weeks for a month, padding with nulls for empty days
// function buildCalendarWeeks(entries: MoonPhaseEntry[]): (MoonPhaseEntry | null)[][] {
//   if (entries.length === 0) return [];
//   const firstDate = new Date(entries[0].date_utc.slice(0, 10));
//   const lastDate = new Date(entries[entries.length - 1].date_utc.slice(0, 10));
//   // const year = firstDate.getFullYear(); // unused
//   // const month = firstDate.getMonth(); // unused
//   // Find the first Monday before or on the first day
//   const firstDayOfWeek = (firstDate.getDay() + 6) % 7; // 0=Monday, 6=Sunday
//   const start = new Date(firstDate);
//   start.setDate(firstDate.getDate() - firstDayOfWeek);
//   // Find the last Sunday after or on the last day
//   const lastDayOfWeek = (lastDate.getDay() + 6) % 7;
//   const end = new Date(lastDate);
//   end.setDate(lastDate.getDate() + (6 - lastDayOfWeek));
//   // Build days
//   const days: (MoonPhaseEntry | null)[] = [];
//   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//     const dStr = d.toISOString().slice(0, 10);
//     const found = entries.find(e => e.date_utc.slice(0, 10) === dStr);
//     days.push(found || null);
//   }
//   // Split into weeks
//   const weeks: (MoonPhaseEntry | null)[][] = [];
//   for (let i = 0; i < days.length; i += 7) {
//     weeks.push(days.slice(i, i + 7));
//   }
//   return weeks;
// }

export default function Home() {
  const cities: CityOption[] = [
    { label: "Cape Town", value: "cape-town" },
    { label: "New York", value: "new-york" },
    { label: "London", value: "london" },
    { label: "Hong Kong", value: "hong-kong" },
    { label: "Melbourne", value: "melbourne" },
  ];
  // City to timezone mapping (frontend, for display or future use)
  // const CITY_TIMEZONES: Record<string, string> = {
  //   "Cape Town": "Africa/Johannesburg",
  //   "New York": "America/New_York",
  //   "London": "Europe/London",
  //   "Hong Kong": "Asia/Hong_Kong",
  //   "Melbourne": "Australia/Melbourne",
  // };
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhases, setMoonPhases] = useState<MoonPhaseEntry[] | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null); // Track loaded date range
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null); // bottom trigger
  const [selectedTheme, setSelectedTheme] = useState<string>("minimal");
  const [posterYear, setPosterYear] = useState<number>(new Date().getFullYear());
  const [posterData, setPosterData] = useState<Record<number, MoonPhaseEntry[]>>({});
  // Cache for non-poster themes: { [city-theme]: { [from-to]: MoonPhaseEntry[] } }
  // const [nonPosterCache, setNonPosterCache] = useState<Record<string, Record<string, MoonPhaseEntry[]>>>({}); // unused
  const posterRef = useRef<HTMLDivElement | null>(null);

  // Fetch more moon phases (next chunk)
  type FetchDirection = 'up' | 'down' | undefined;
  const fetchMore = async (direction?: FetchDirection | number) => {
    if (!selectedCity) return;
    setLoading(true);
    try {
      let dateFrom: string, dateTo: string, yearToFetch: number | undefined;
      if (['poster','poster-print'].includes(selectedTheme)) {
        yearToFetch = typeof direction === 'number' ? direction : posterYear;
        dateFrom = `${yearToFetch}0101`;
        dateTo = `${yearToFetch}1231`;
        const cityName = selectedCity.label;
        const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
        setPosterData(prev => ({ ...prev, [yearToFetch!]: data }));
        setMoonPhases(data);
        setDateRange({ from: dateFrom, to: dateTo });
      } else {
        if (!dateRange) return;
        const cityName = selectedCity.label;
        if (direction === 'down') {
          // Fetch next 6 months (append)
          const lastTo = dateRange.to;
          const fromDateObj = new Date(
            lastTo.slice(0, 4) + "-" + lastTo.slice(4, 6) + "-" + lastTo.slice(6, 8)
          );
          fromDateObj.setDate(fromDateObj.getDate() + 1); // Start after last loaded date
          dateFrom = fromDateObj.toISOString().slice(0, 10).replace(/-/g, "");
          const dateToObj = new Date(fromDateObj);
          dateToObj.setMonth(dateToObj.getMonth() + 6);
          dateToObj.setDate(dateToObj.getDate() - 1);
          dateTo = dateToObj.toISOString().slice(0, 10).replace(/-/g, "");
          const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
          setMoonPhases((prev) => (prev ? [...prev, ...data] : data));
          setDateRange({ from: dateRange.from, to: dateTo });
        } else if (direction === 'up') {
          // Fetch previous 6 months (prepend, only on button click)
          const firstFrom = dateRange.from;
          const toDateObj = new Date(
            firstFrom.slice(0, 4) + "-" + firstFrom.slice(4, 6) + "-" + firstFrom.slice(6, 8)
          );
          toDateObj.setDate(toDateObj.getDate() - 1); // Day before first loaded date
          dateTo = toDateObj.toISOString().slice(0, 10).replace(/-/g, "");
          const fromDateObj = new Date(toDateObj);
          fromDateObj.setMonth(fromDateObj.getMonth() - 6);
          fromDateObj.setDate(1); // Start at first of the month
          dateFrom = fromDateObj.toISOString().slice(0, 10).replace(/-/g, "");
          const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
          setMoonPhases((prev) => (prev ? [...data, ...prev] : data));
          setDateRange({ from: dateFrom, to: dateRange.to });
        }
      }
    } catch {
      alert("Failed to fetch more moon phases");
    } finally {
      setLoading(false);
    }
  };

  // Poster mode: handle year navigation
  const handlePosterYearChange = async (delta: number) => {
    const newYear = posterYear + delta;
    setPosterYear(newYear);
    if (!posterData[newYear]) {
      await fetchMore(newYear);
    } else {
      setMoonPhases(posterData[newYear]);
      setDateRange({ from: `${newYear}0101`, to: `${newYear}1231` });
    }
  };

  // PDF export handler for poster
  const handleExportPDF = async () => {
    if (!posterRef.current) return;
    const element = posterRef.current;
    const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    // Calculate width/height to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Scale image to fit width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 0;
    if (imgHeight < pageHeight) {
      y = (pageHeight - imgHeight) / 2;
    }
    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
    pdf.save(`moon-phases-${posterYear}.pdf`);
  };

  useEffect(() => {
    if (!moonPhases || !triggerRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new window.IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target === triggerRef.current && entry.isIntersecting && !loading) {
            // Bottom: fetch next 6 months (append)
            fetchMore('down');
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    if (triggerRef.current) observerRef.current.observe(triggerRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [moonPhases, loading, selectedCity, dateRange, fetchMore]);

  // TODO: When switching to calendar view, fetch yearly chunks instead of 6 months

  useEffect(() => {
    if (!selectedCity) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let dateFrom, dateTo;
        const now = new Date();
        const year = now.getFullYear();
        if (['poster','poster-print'].includes(selectedTheme)) {
          dateFrom = `${year}0101`;
          dateTo = `${year}1231`;
          const cityName = selectedCity.label;
          const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
          setPosterData(prev => ({ ...prev, [year]: data })); // Merge instead of replace
          setPosterYear(year);
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        } else if (['traditional', 'minimal', 'lunar-cycle'].includes(selectedTheme)) {
          // Fetch 6 months: current month + 5 months forward
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1); // current month
          const end = new Date(now.getFullYear(), now.getMonth() + 6, 0); // 5 months forward, last day
          dateFrom = start.toISOString().slice(0, 10).replace(/-/g, "");
          dateTo = end.toISOString().slice(0, 10).replace(/-/g, "");
          const cityName = selectedCity.label;
          const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        } else {
          dateFrom = now.toISOString().slice(0, 10).replace(/-/g, "");
          const dateToObj = new Date(now);
          dateToObj.setDate(now.getDate() + 89); // 90 days including today
          dateTo = dateToObj.toISOString().slice(0, 10).replace(/-/g, "");
          const cityName = selectedCity.label;
          const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
          setMoonPhases(data);
          setDateRange({ from: dateFrom, to: dateTo });
        }
      } catch {
        alert("Failed to fetch moon phases");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCity, selectedTheme]); // <-- Remove posterData here!

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen p-8 gap-8 ${selectedTheme === 'traditional' ? 'bg-white text-black' : 'bg-black text-white'}`}
    >
      <div className="w-full max-w-md flex flex-col gap-4 mb-2">
        <div className="flex-1">
          <label htmlFor="city-select" className="block mb-1 font-medium">City:</label>
          <LocationSelector
            cities={cities}
            onSelect={setSelectedCity}
            className={`w-full border rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${['minimal','lunar-cycle','poster','poster-print'].includes(selectedTheme) ? 'bg-gray-900 text-white border-gray-700 placeholder-gray-400' : 'bg-white text-black border-gray-300'}`}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="theme-select" className="block mb-1 font-medium">Theme:</label>
          <select
            id="theme-select"
            value={selectedTheme}
            onChange={e => setSelectedTheme(e.target.value)}
            className={`w-full border rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${['minimal','lunar-cycle','poster','poster-print'].includes(selectedTheme) ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
          >
            <option value="traditional">Traditional</option>
            <option value="minimal">Minimal</option>
            <option value="lunar-cycle">Lunar Cycle</option>
            <option value="poster">Poster</option>
            <option value="poster-print">Poster (Print)</option>
          </select>
        </div>
      </div>
      {/* Remove duplicate title: this block is no longer needed */}
      {/* {selectedCity && (
        <div className="mt-2 text-2xl font-semibold text-center">
          Moon Phase Calendar for <span className="font-bold">{selectedCity.label}</span>
          {['poster','poster-print'].includes(selectedTheme) && dateRange && (
            (() => {
              const fromYear = dateRange.from.slice(0, 4);
              const toYear = dateRange.to.slice(0, 4);
              return (
                <span className="ml-2 text-xl font-normal text-gray-500">
                  {fromYear === toYear ? fromYear : `${fromYear}–${toYear}`}
                </span>
              );
            })()
          )}
        </div>
      )} */}
      {/* Toast-style loading indicator */}
      {loading && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded shadow-lg z-50 transition-opacity">
          Loading moon phases…
        </div>
      )}
      {/* Show empty state if no data and not loading */}
      {!loading && (!moonPhases || moonPhases.length === 0) && (
        <div className="mt-12 text-gray-500 text-lg">No moon phase data to display. Select a city to begin.</div>
      )}
      {/* Calendar grid */}
      {moonPhases && moonPhases.length > 0 && (
        <>
          {/* Poster mode: wrap CalendarGrid in a ref for PDF export */}
          {['poster','poster-print'].includes(selectedTheme) ? (
            <div ref={posterRef} className="w-full flex flex-col items-center">
              {/* Title always inside the grid container for all themes */}
              {selectedCity && (
                <div className="mt-2 text-2xl font-semibold text-center">
                  Moon Phase Calendar for <span className="font-bold">{selectedCity.label}</span>
                  {dateRange && (() => {
                    const fromYear = dateRange.from.slice(0, 4);
                    const toYear = dateRange.to.slice(0, 4);
                    return (
                      <span className="ml-2 text-xl font-normal text-gray-500">
                        {fromYear === toYear ? fromYear : `${fromYear}–${toYear}`}
                      </span>
                    );
                  })()}
                </div>
              )}
              <CalendarGrid 
                moonPhases={moonPhases} 
                theme={selectedTheme} 
                triggerRef={triggerRef}
                renderLoadPrevious={() => (null)}
                key={`${selectedTheme}-${selectedCity?.value || ''}`}
              />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Title always inside the grid container for all themes */}
              {selectedCity && (
                <div className="mt-2 text-2xl font-semibold text-center">
                  Moon Phase Calendar for <span className="font-bold">{selectedCity.label}</span>
                  {dateRange && (() => {
                    const fromYear = dateRange.from.slice(0, 4);
                    const toYear = dateRange.to.slice(0, 4);
                    return (
                      <span className="ml-2 text-xl font-normal text-gray-500">
                        {fromYear === toYear ? fromYear : `${fromYear}–${toYear}`}
                      </span>
                    );
                  })()}
                </div>
              )}
              <CalendarGrid 
                moonPhases={moonPhases} 
                theme={selectedTheme} 
                triggerRef={triggerRef}
                renderLoadPrevious={() => (null)}
                key={`${selectedTheme}-${selectedCity?.value || ''}`}
              />
            </div>
          )}
          {['poster','poster-print'].includes(selectedTheme) && (
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
              <button
                onClick={handleExportPDF}
                className="w-32 px-3 py-1 text-xs rounded bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-600 shadow"
                disabled={loading}
              >
                PDF
              </button>
            </div>
          )}
          {/* TODO: Improve toast UX (e.g., add animation, auto-dismiss, error toasts) */}
        </>
      )}
    </div>
  );
}
