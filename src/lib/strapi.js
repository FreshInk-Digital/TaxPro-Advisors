const RAW_STRAPI_URL = import.meta.env.VITE_STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

const STRAPI_URL = RAW_STRAPI_URL?.replace(/\/+$/, "");

export async function strapiFetch(path, options = {}) {
  if (!STRAPI_URL) {
    throw new Error("VITE_STRAPI_URL is not defined");
  }

  const cleanPath = String(path).replace(/^\/+/, "");
  const url = new URL(`${STRAPI_URL}/api/${cleanPath}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new Error(
      `Strapi request failed: ${res.status} ${res.statusText} - ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`
    );
  }

  return body;
}

export function getStrapiMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}