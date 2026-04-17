import fallbackData from "@/data/homePageFallback.json";
import { strapiFetch } from "@/lib/strapi";

function isMeaningful(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function mergeWithFallback(cmsData = {}, fallback = {}) {
  const merged = { ...fallback };

  Object.keys(cmsData).forEach((key) => {
    const cmsValue = cmsData[key];
    const fallbackValue = fallback[key];

    if (Array.isArray(cmsValue)) {
      merged[key] = cmsValue.length > 0 ? cmsValue : fallbackValue ?? [];
      return;
    }

    if (
      cmsValue &&
      typeof cmsValue === "object" &&
      !Array.isArray(cmsValue) &&
      fallbackValue &&
      typeof fallbackValue === "object" &&
      !Array.isArray(fallbackValue)
    ) {
      merged[key] = mergeWithFallback(cmsValue, fallbackValue);
      return;
    }

    merged[key] = isMeaningful(cmsValue) ? cmsValue : fallbackValue;
  });

  return merged;
}

function hasAnyCmsContent(data = {}) {
  const ignoredKeys = [
    "id",
    "documentId",
    "createdAt",
    "updatedAt",
    "publishedAt",
    "locale",
    "localizations",
  ];

  return Object.entries(data).some(([key, value]) => {
    if (ignoredKeys.includes(key)) return false;
    return isMeaningful(value);
  });
}

export async function fetchHomePageData(locale = "en") {
  try {
    const response = await strapiFetch("home-page", {
      query: {
        locale,
        populate: "*",
      },
    });

    const cmsData = response?.data || {};
    const merged = mergeWithFallback(cmsData, fallbackData);
    const hasCmsData = hasAnyCmsContent(cmsData);

    return {
      data: merged,
      error: null,
      source: hasCmsData ? "strapi+fallback" : "fallback",
      message: hasCmsData
        ? null
        : `Home page CMS content for "${locale}" is not filled yet. Showing fallback content.`,
    };
  } catch (error) {
    console.error("Home page fetch error:", error);

    return {
      data: fallbackData,
      error,
      source: "fallback",
      message: "Unable to load content from CMS right now. Showing fallback content.",
    };
  }
}