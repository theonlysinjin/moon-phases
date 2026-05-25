import type { LocationConfig } from "@/config/cities";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { generateMoonPhases } from "./generateMoonPhases";
import type { FetchOptions } from "@/types/api";

export async function fetchMoonPhases(
  location: LocationConfig,
  dateFrom: string,
  dateTo: string,
  options?: FetchOptions
): Promise<MoonPhaseEntry[]> {
  return generateMoonPhases(location, dateFrom, dateTo, options);
}