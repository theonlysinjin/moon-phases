import type { MoonPhaseEntry } from "../types/moonPhase";
import { generateMoonPhases } from "./generateMoonPhases";
import type { FetchOptions } from "@/types/api";

export async function fetchMoonPhases(
  city: string,
  dateFrom: string,
  dateTo: string,
  options?: FetchOptions
): Promise<MoonPhaseEntry[]> {
  // Client-side generation replaces the API call
  return generateMoonPhases(city, dateFrom, dateTo, options);
}