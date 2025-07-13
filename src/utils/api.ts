import type { MoonPhaseEntry } from "../types/moonPhase";

export async function fetchMoonPhases(city: string, dateFrom: string, dateTo: string): Promise<MoonPhaseEntry[]> {
  const params = new URLSearchParams({
    city,
    date_from: dateFrom,
    date_to: dateTo,
  });
  const res = await fetch(`http://127.0.0.1:5000/moon-phases?${params}`);
  if (!res.ok) throw new Error("Failed to fetch moon phases");
  return res.json();
} 