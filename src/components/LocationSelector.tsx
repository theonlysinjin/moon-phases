"use client";

import React from 'react';

export type CityOption = {
  label: string;
  value: string;
};

export type LocationSelectorProps = {
  cities: CityOption[];
  onSelect: (city: CityOption) => void;
  className?: string;
};

export function LocationSelector({ cities, onSelect, className }: LocationSelectorProps) {
  return (
    <select
      className={className}
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
  );
} 