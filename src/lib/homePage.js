import fallbackData from "@/data/homePageFallback.json";

/**
 * Fetches home page data.
 * Since Strapi is no longer in use, this returns fallback data directly.
 */
export async function fetchHomePageData(locale = "en") {
  // We return the fallback data directly. 
  // In a real scenario, this might fetch from the new Laravel API if implemented.
  return {
    data: fallbackData,
    error: null,
    source: "fallback",
    message: null, // Removed the error/warning message
  };
}