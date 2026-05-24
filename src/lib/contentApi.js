// File: src/lib/contentApi.js
// Dedicated API module for the Content Translation CMS (admin + public fallback)
// Visitors NEVER hit these endpoints — they load /public/content/{locale}.json directly.
// Only admins call these to manage and publish translations.

import { apiFetch } from "./api";

// Re-export apiFetch from api.js using the named export pattern already in use
// We call it directly via the base fetch wrapper

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

function unwrapContentBundle(payload) {
  if (payload?.home || payload?.ui) return payload;
  if (payload?.data?.home || payload?.data?.ui) return payload.data;
  return null;
}

function getToken() {
  return (
    sessionStorage.getItem("adminToken") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    null
  );
}

async function contentFetch(path, options = {}) {
  const { method = "GET", body, requireAuth = false } = options;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/${path.replace(/^\/+/, "")}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: "cors",
  });

  const data = res.headers.get("content-type")?.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      typeof data === "object"
        ? data?.message || `Error ${res.status}`
        : `Error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Admin API calls (all require auth token)
// ---------------------------------------------------------------------------

export const contentApi = {
  /**
   * GET /admin/content
   * Returns completion stats for all languages: { language_code, translated, total, percent, published }
   */
  stats: () => contentFetch("admin/content"),

  /**
   * GET /admin/content/{locale}
   * Returns all content keys + their current translation for this locale.
   * Each item: { id, namespace, key, type, group_name, default_value, value, status }
   */
  show: (locale) => contentFetch(`admin/content/${locale}`),

  /**
   * PUT /admin/content/{locale}
   * Batch-save translations.
   * Body: { translations: [{ id: contentKeyId, value: "..." }, ...] }
   */
  save: (locale, translations) =>
    contentFetch(`admin/content/${locale}`, {
      method: "PUT",
      body: { translations },
    }),

  /**
   * POST /admin/content/{locale}/publish
   * Triggers Laravel to write /public/content/{locale}.json.
   * Returns { locale, path }
   */
  publish: (locale) =>
    contentFetch(`admin/content/${locale}/publish`, { method: "POST" }),
};

// ---------------------------------------------------------------------------
// Public helpers (called by homePage.js and LanguageContext.jsx)
// ---------------------------------------------------------------------------

/**
 * Fetch the published static JSON for a locale.
 * Primary: fetch from /content/{locale}.json (static file served by web server)
 * Fallback: fetch from /api/v1/content/{locale} (Laravel serves it dynamically)
 */
export async function fetchLocaleBundle(locale) {
  // Try static file first (fast, CDN-cacheable)
  try {
    const origin = window.location.origin;
    const res = await fetch(`${origin}/content/${locale}.json`, {
      // Cache for 10 minutes, allow stale while revalidating
      cache: "no-cache",
    });
    if (res.ok) {
      return unwrapContentBundle(await res.json());
    }
  } catch {
    // static file not available — fall through to API fallback
  }

  // Fallback: ask Laravel to serve it
  try {
    const res = await fetch(`${BASE_URL}/content/${locale}`, {
      headers: { Accept: "application/json" },
      mode: "cors",
    });
    if (res.ok) {
      const json = await res.json();
      return unwrapContentBundle(json?.data) || unwrapContentBundle(json);
    }
  } catch {
    // nothing
  }

  return null;
}
