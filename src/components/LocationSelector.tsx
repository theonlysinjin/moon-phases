"use client";

import React from 'react';

export type CityOption = {
  label: string;
  value: string;
};

export type LocationSelectorProps = {
  cities: CityOption[];
  onSelect: (city: CityOption) => void;
};

export function LocationSelector({ cities, onSelect }: LocationSelectorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <h2 className="text-2xl font-bold mb-4">Select Location</h2>
      <select
        className="border border-gray-300 rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        onChange={e => {
          const selected = cities.find(c => c.value === e.target.value);
          if (selected) onSelect(selected);
        }}
        defaultValue=""
      >
        <option value="" disabled>
          Choose a city...
        </option>
        {cities.map(city => (
          <option key={city.value} value={city.value}>
            {city.label}
          </option>
        ))}
      </select>
    </div>
  );
} 