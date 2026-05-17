export type ImageSearchResult = {
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  provider: "google_custom_search" | "unsplash" | "pexels" | "fallback";
  altText?: string;
};

/**
 * Build a clean image search query from location and context.
 */
export function buildImageSearchQuery(locationName: string, city: string, country: string): string {
  const parts = [locationName, city, country].filter(Boolean);
  return parts.join(" ") + " travel photography landmark";
}

/**
 * Search images using Google Custom Search API.
 * Returns up to `limit` results.
 */
export async function searchGoogleImages(
  query: string,
  limit = 4
): Promise<ImageSearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.warn("Google Custom Search API not configured");
    return [];
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(Math.min(limit, 10)));
    url.searchParams.set("imgType", "photo");
    url.searchParams.set("imgSize", "large");
    url.searchParams.set("safe", "active");

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const data = await res.json();
    const items: Array<Record<string, unknown>> = data.items || [];

    return normalizeGoogleResults(items).slice(0, limit);
  } catch (err) {
    console.error("Google image search failed:", err);
    return [];
  }
}

function normalizeGoogleResults(items: Array<Record<string, unknown>>): ImageSearchResult[] {
  return items
    .filter(item => {
      const link = String(item.link || "");
      return link.startsWith("http") && !isLowQuality(item);
    })
    .map(item => {
      const image = item.image as Record<string, unknown> | undefined;
      return {
        imageUrl: String(item.link || ""),
        thumbnailUrl: String(image?.thumbnailLink || ""),
        sourceUrl: String(item.image ? (image?.contextLink || "") : ""),
        sourceTitle: String(item.title || ""),
        provider: "google_custom_search" as const,
        altText: String(item.title || ""),
      };
    });
}

function isLowQuality(item: Record<string, unknown>): boolean {
  const link = String(item.link || "").toLowerCase();
  // Filter out icons, logos, maps, infographics
  const badPatterns = [".gif", "icon", "logo", "map", "flag", "chart", "infographic", "clipart"];
  return badPatterns.some(p => link.includes(p));
}

/**
 * Remove duplicate image URLs from results.
 */
export function removeDuplicateImages(results: ImageSearchResult[]): ImageSearchResult[] {
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.imageUrl)) return false;
    seen.add(r.imageUrl);
    return true;
  });
}

/**
 * Select top N images for a day, deduped.
 */
export function selectTopImagesForDay(results: ImageSearchResult[], max = 4): ImageSearchResult[] {
  return removeDuplicateImages(results).slice(0, max);
}
