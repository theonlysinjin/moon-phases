"use client";

import { LocationSelector, CityOption } from "../components/LocationSelector";
import { useState } from "react";
import { fetchMoonPhases } from "../utils/api";
import type { MoonPhaseEntry } from "../types/moonPhase";
import { useEffect } from "react";

export default function Home() {
  const cities: CityOption[] = [
    { label: "Cape Town", value: "cape-town" },
    { label: "New York", value: "new-york" },
    { label: "London", value: "london" },
    { label: "Hong Kong", value: "hong-kong" },
    { label: "Melbourne", value: "melbourne" },
  ];
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [moonPhases, setMoonPhases] = useState<MoonPhaseEntry[] | null>(null);
  useEffect(() => {
    if (!selectedCity) return;
    const fetchData = async () => {
      setLoading(true);
      setMoonPhases(null);
      try {
        const today = new Date();
        const dateFrom = today.toISOString().slice(0, 10).replace(/-/g, "");
        const dateToObj = new Date(today);
        dateToObj.setDate(today.getDate() + 89); // 90 days including today
        const dateTo = dateToObj.toISOString().slice(0, 10).replace(/-/g, "");
        // Backend expects city name, not value slug
        const cityName = selectedCity.label;
        const data = await fetchMoonPhases(cityName, dateFrom, dateTo);
        setMoonPhases(data);
      } catch (e) {
        alert("Failed to fetch moon phases");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCity]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <LocationSelector cities={cities} onSelect={setSelectedCity} />
      {selectedCity && (
        <div className="mt-4 text-xl">
          Selected city: <span className="font-bold">{selectedCity.label}</span>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-2xl font-semibold">Loading moon phases…</div>
        </div>
      )}
      {moonPhases && (
        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-lg font-bold mb-2">Moon Phases (next 90 days)</h2>
          <ul className="divide-y divide-gray-200">
            {moonPhases.map((entry) => (
              <li key={entry.date_utc} className="py-2 flex justify-between">
                <span>{entry.date_utc.slice(0, 10)}</span>
                <span>{entry.major_phase ?? "—"}</span>
                <span>{Math.round(entry.illuminated_fraction * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
