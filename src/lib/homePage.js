// File: src/lib/homePage.js
// Loads public landing page content from the published static JSON bundle.
// Fallback chain: /content/{locale}.json → zh-CN→zh→en → homePageFallback.json

import fallbackData from "@/data/homePageFallback.json";
import { fetchLocaleBundle } from "./contentApi";

// In-memory cache keyed by locale  { locale: { data, fetchedAt } }
const memCache = {};
const STALE_MS = 10 * 60 * 1000; // 10 minutes

/** Return the localStorage cache key for a locale */
const storageKey = (locale) => `content_bundle:${locale}`;

function normalizeBundle(bundle) {
  if (bundle?.home || bundle?.ui) return bundle;
  if (bundle?.data?.home || bundle?.data?.ui) return bundle.data;
  return bundle;
}

/** Fallback chain: zh-CN → zh → en etc. */
function getFallbackChain(locale) {
  const chains = {
    "zh-CN": ["zh", "en"],
    "zh-TW": ["zh", "en"],
    zh: ["en"],
    "en-GB": ["en"],
    "en-US": ["en"],
  };
  if (chains[locale]) return [locale, ...chains[locale]];
  if (locale.includes("-")) return [locale, locale.split("-")[0], "en"];
  return [locale, "en"];
}

/** Try loading a bundle for one locale, using memory → localStorage → network */
async function loadBundle(locale) {
  // 1. Memory cache (fastest)
  const cached = memCache[locale];
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
    return normalizeBundle(cached.data);
  }

  // 2. localStorage cache (survives page reload)
  try {
    const stored = localStorage.getItem(storageKey(locale));
    if (stored) {
      const { data, fetchedAt } = JSON.parse(stored);
      if (Date.now() - fetchedAt < STALE_MS) {
        const normalizedData = normalizeBundle(data);
        memCache[locale] = { data: normalizedData, fetchedAt };
        // Background revalidate after half the TTL
        if (Date.now() - fetchedAt > STALE_MS / 2) {
          revalidate(locale);
        }
        return normalizedData;
      }
    }
  } catch {
    // corrupted localStorage — ignore
  }

  // 3. Network fetch
  return await revalidate(locale);
}

/** Fetch from network and update both caches */
async function revalidate(locale) {
  const bundle = normalizeBundle(await fetchLocaleBundle(locale));
  if (bundle) {
    const entry = { data: bundle, fetchedAt: Date.now() };
    memCache[locale] = entry;
    try {
      localStorage.setItem(storageKey(locale), JSON.stringify(entry));
    } catch {
      // storage quota exceeded — skip
    }
    return bundle;
  }
  return null;
}

/**
 * Main export used by Index.jsx.
 * Returns { data, source } where source = "cms" | "fallback"
 */
export async function fetchHomePageData(locale = "en") {
  const chain = getFallbackChain(locale);

  for (const candidate of chain) {
    try {
      const bundle = await loadBundle(candidate);
      if (bundle?.home) {
        return {
          data: bundle.home,
          bundle,           // full bundle (home + ui) for LanguageContext
          source: "cms",
          message: null,
        };
      }
    } catch {
      // try next in chain
    }
  }

  // All chain members failed — use static fallback JSON
  return {
    data: fallbackData,
    bundle: null,
    source: "fallback",
    message: null,
  };
}

/**
 * Load only the UI namespace for a locale (used by LanguageContext).
 * Returns an object of key→value pairs, or null if unavailable.
 */
export async function fetchUiBundle(locale = "en") {
  const chain = getFallbackChain(locale);

  for (const candidate of chain) {
    try {
      const bundle = await loadBundle(candidate);
      if (bundle?.ui) return bundle.ui;
    } catch {
      // try next
    }
  }

  return null;
}

/** Invalidate cache for a locale (call after admin publishes) */
export function invalidateContentCache(locale) {
  delete memCache[locale];
  try {
    localStorage.removeItem(storageKey(locale));
  } catch {
    // ignore
  }
}
