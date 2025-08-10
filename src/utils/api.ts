import type { MoonPhaseEntry } from "../types/moonPhase";
import { generateMoonPhases } from "./generateMoonPhases";

export async function fetchMoonPhases(city: string, dateFrom: string, dateTo: string): Promise<MoonPhaseEntry[]> {
  // Client-side generation replaces the API call
  return generateMoonPhases(city, dateFrom, dateTo);
}