import type { MoonPhaseEntry } from "../types/moonPhase";

export async function fetchMoonPhases(city: string, dateFrom: string, dateTo: string): Promise<MoonPhaseEntry[]> {
  const params = new URLSearchParams({
    city,
    date_from: dateFrom,
    date_to: dateTo,
  });
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const res = await fetch(`${API_BASE_URL}/moon-phases?${params}`);
  if (!res.ok) throw new Error("Failed to fetch moon phases");
  return res.json();
} 