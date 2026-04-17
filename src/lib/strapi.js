// src/lib/strapi.js
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

export async function strapiFetch(path, options = {}) {
  const url = new URL(`${STRAPI_URL}/api/${path}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Strapi request failed: ${res.status}`);
  }

  return res.json();
}

export function getStrapiMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}