// File: src/components/ui/phone-input.jsx
// Uses src/lib/country-code.json for the full country list
import * as React from "react";
import countriesRaw from "@/lib/country-code.json";
import { cn } from "@/lib/utils";

// Generate flag emoji from ISO country code (e.g. "TZ" → "🇹🇿")
function getFlagEmoji(code) {
  if (!code || code.length !== 2) return "🌐";
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

// Normalize the JSON into a consistent shape
const COUNTRIES = countriesRaw.map((c) => ({
  name:     c.name,
  dialCode: c.dial_code.replace(/\s/g, ""), // "+255" (no spaces)
  rawCode:  c.dial_code.replace(/\D/g, ""), // "255"  (digits only)
  iso:      c.code.toUpperCase(),           // "TZ"
  flag:     getFlagEmoji(c.code),
}));

// Preferred countries shown at the top
const PREFERRED_ISOS = ["TZ", "KE", "UG", "RW", "BI", "NG", "ZA", "US", "GB", "AE", "IN", "CN"];

const preferred = PREFERRED_ISOS.map((iso) => COUNTRIES.find((c) => c.iso === iso)).filter(Boolean);
const rest      = COUNTRIES.filter((c) => !PREFERRED_ISOS.includes(c.iso));
const SORTED_COUNTRIES = [...preferred, ...rest];

// Default = Tanzania
const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.iso === "TZ") || COUNTRIES[0];

function detectCountry(rawValue) {
  if (!rawValue) return DEFAULT_COUNTRY;
  const digits = String(rawValue).replace(/\D/g, "");
  // Try longest match first (handles e.g. +1809 vs +1)
  const sorted = [...COUNTRIES].sort((a, b) => b.rawCode.length - a.rawCode.length);
  return sorted.find((c) => digits.startsWith(c.rawCode)) || DEFAULT_COUNTRY;
}

function stripCountryCode(rawValue, country) {
  if (!rawValue) return "";
  const digits = String(rawValue).replace(/\D/g, "");
  return digits.startsWith(country.rawCode) ? digits.slice(country.rawCode.length) : digits;
}

export const PhoneInputField = React.forwardRef(
  ({ value, onChange, error, className }, ref) => {
    const [open, setOpen]         = React.useState(false);
    const [search, setSearch]     = React.useState("");
    const dropdownRef             = React.useRef(null);
    const searchRef               = React.useRef(null);

    const [country, setCountry]         = React.useState(() => detectCountry(value));
    const [localNumber, setLocalNumber] = React.useState(() => stripCountryCode(value, detectCountry(value)));

    // Sync when external value changes (e.g. edit form loads)
    React.useEffect(() => {
      if (value !== undefined) {
        const detected = detectCountry(value);
        setCountry(detected);
        setLocalNumber(stripCountryCode(value, detected));
      }
    }, [value]);

    // Close dropdown on outside click
    React.useEffect(() => {
      if (!open) return;
      const handler = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Focus search when dropdown opens
    React.useEffect(() => {
      if (open && searchRef.current) {
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    }, [open]);

    const handleCountrySelect = (c) => {
      setCountry(c);
      setOpen(false);
      setSearch("");
      onChange?.(c.rawCode + localNumber);
    };

    const handleNumberChange = (e) => {
      const digits = e.target.value.replace(/\D/g, "");
      setLocalNumber(digits);
      onChange?.(country.rawCode + digits);
    };

    const filtered = SORTED_COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.rawCode.includes(search.replace(/\D/g, ""))
    );

    return (
      <div className={cn("relative flex", className)} ref={dropdownRef}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1.5 h-10 px-3 shrink-0",
            "rounded-l-xl border border-r-0 border-input bg-background",
            "text-sm font-medium hover:bg-muted transition-colors",
            error && "border-destructive"
          )}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-muted-foreground text-xs">{country.dialCode}</span>
          <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Number input */}
        <input
          ref={ref}
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder="712 345 678"
          className={cn(
            "flex-1 h-10 rounded-r-xl border border-input bg-background px-3 text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors",
            error && "border-destructive focus-visible:ring-destructive"
          )}
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 z-[10000] mt-1 w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground text-center italic">No results</li>
              )}
              {filtered.map((c) => (
                <li key={`${c.iso}-${c.rawCode}`}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors",
                      country.iso === c.iso && country.rawCode === c.rawCode
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground"
                    )}
                  >
                    <span className="text-base w-6 text-center shrink-0">{c.flag}</span>
                    <span className="flex-1 text-left truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{c.dialCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

PhoneInputField.displayName = "PhoneInputField";
