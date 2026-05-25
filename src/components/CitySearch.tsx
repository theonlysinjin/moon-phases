"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { LocationConfig } from "@/config/cities";
import { PRESET_LOCATIONS } from "@/config/cities";
import { resolveFromGeolocation, searchCities } from "@/utils/geocoding";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type CitySearchProps = {
  value: LocationConfig | null;
  onSelect: (location: LocationConfig) => void;
  className?: string;
  inputClassName?: string;
  dark?: boolean;
};

export function CitySearch({
  value,
  onSelect,
  className,
  inputClassName,
  dark = false,
}: CitySearchProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<LocationConfig[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const found = await searchCities(q);
      setResults(found);
      setOpen(true);
    } catch {
      setError("City search failed. Try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(next), SEARCH_DEBOUNCE_MS);
  };

  const pick = (loc: LocationConfig) => {
    onSelect(loc);
    setQuery(loc.label);
    setOpen(false);
    setResults([]);
  };

  const handleUseLocation = async () => {
    setGeoLoading(true);
    setError(null);
    try {
      const loc = await resolveFromGeolocation();
      pick(loc);
    } catch (err) {
      const msg =
        err instanceof GeolocationPositionError
          ? err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not get your location."
          : err instanceof Error
            ? err.message
            : "Could not get your location.";
      setError(msg);
    } finally {
      setGeoLoading(false);
    }
  };

  const inputStyles = inputClassName ?? className ?? "";
  const listStyles = dark
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-300 text-black";
  const itemHover = dark ? "hover:bg-gray-800" : "hover:bg-gray-100";

  return (
    <div ref={containerRef} className={className}>
      <div className="flex gap-2">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Search for a city…"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className={`flex-1 min-w-0 border rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${inputStyles}`}
        />
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={geoLoading}
          title="Use my location"
          className={`shrink-0 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 ${
            dark
              ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
              : "bg-gray-100 text-black border-gray-300 hover:bg-gray-200"
          }`}
        >
          {geoLoading ? "…" : "Near me"}
        </button>
      </div>

      {(searching || error) && (
        <p className={`mt-1 text-xs ${error ? "text-red-400" : "text-gray-500"}`}>
          {error ?? "Searching…"}
        </p>
      )}

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className={`mt-1 max-h-48 overflow-auto border rounded shadow-lg z-10 ${listStyles}`}
        >
          {results.map((loc) => (
            <li
              key={loc.slug}
              role="option"
              aria-selected={value?.slug === loc.slug}
            >
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm ${itemHover}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(loc)}
              >
                {loc.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !searching && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && !error && (
        <p className="mt-1 text-xs text-gray-500">No cities found.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {PRESET_LOCATIONS.map((loc) => (
          <button
            key={loc.slug}
            type="button"
            onClick={() => pick(loc)}
            className={`text-xs px-2 py-0.5 rounded border ${
              dark
                ? "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                : "border-gray-300 text-gray-600 hover:text-black"
            }`}
          >
            {loc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
