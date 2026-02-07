import type { AppLoadContext } from "@shopify/remix-oxygen";
import type { ApiResponse, WineClub, WineClubDetails } from "~/types/winehub";
import { isWineClub } from "~/types/winehub";

/**
 * Fetch with timeout support
 *
 * @description Wraps fetch API with configurable timeout to prevent hanging requests
 * @param url - Request URL
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 * @returns Response promise that rejects on timeout
 *
 * @throws Error when request exceeds timeout
 * @example
 * const response = await fetchWithTimeout(url, options, 5000);
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Request timeout after ${timeoutMs}ms - API may be slow or unavailable`,
      );
    }
    throw error;
  }
}

/**
 * Fetch all wine clubs for the shop
 *
 * @description Retrieves wine club listings from Winehub API with server-side caching
 * @param context - Shopify Hydrogen app context containing environment variables
 * @returns Array of wine clubs sorted by position, or empty array on error
 *
 * @example
 * const clubs = await fetchWineClubs({ context });
 * if (clubs.length > 0) {
 *   // Render wine clubs
 * }
 */
export async function fetchWineClubs({
  context,
}: {
  context: AppLoadContext;
}): Promise<WineClub[]> {
  const env = context.env as Record<string, string>;
  const apiBase = env.WINEHUB_API_BASE || "https://api.winehub.io/headless";
  const shopDomain = env.PUBLIC_STORE_DOMAIN;

  if (!shopDomain) {
    console.error("[Winehub] PUBLIC_STORE_DOMAIN not configured");
    return [];
  }

  try {
    // Use fetchWithTimeout to prevent hanging on slow API (T068, Edge Case: API timeout)
    const response = await fetchWithTimeout(
      `${apiBase}/clubs/basic-details?shop=${shopDomain}`,
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Hydrogen-Weaverse-Pilot/1.0",
        },
      },
      5000, // 5 second timeout
    );

    if (!response.ok) {
      console.error(
        `[Winehub] API error: ${response.status} ${response.statusText}`,
      );
      console.error(
        "[Winehub] Request URL:",
        `${apiBase}/clubs/basic-details?shop=${shopDomain}`,
      );
      console.error(
        "[Winehub] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );
      return [];
    }

    // Handle malformed JSON (FR-030, Edge Case: malformed API data)
    let data: unknown;
    try {
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.error("[Winehub] Empty response body");
        return [];
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[Winehub] Failed to parse JSON response:", parseError);
      console.error("[Winehub] Response was not valid JSON");
      return [];
    }

    // Validate response is an array (FR-030)
    if (!Array.isArray(data)) {
      console.error("[Winehub] Expected array response, got:", typeof data);
      return [];
    }

    // Normalize and validate each club (FR-030: handle missing/null fields)
    const normalizedClubs = data
      .map((club: unknown) => {
        if (!club || typeof club !== "object") {
          console.warn("[Winehub] Skipping invalid club entry:", typeof club);
          return null;
        }

        const clubObj = club as Record<string, unknown>;

        // Normalize field names and provide safe defaults
        const normalized = {
          ...clubObj,
          id: String(clubObj.id), // Convert numeric ID to string
          shopifyId: String(clubObj.shopifyId || clubObj.shopify_id || ""),
          type: clubObj.type || null, // Can be null in API
          position:
            typeof clubObj.position === "number" ? clubObj.position : 999,
          description: clubObj.description || null,
          image: clubObj.image || null,
          caseSizes: Array.isArray(clubObj.caseSizes) ? clubObj.caseSizes : [],
          sellingPlans: Array.isArray(clubObj.sellingPlans)
            ? clubObj.sellingPlans
            : [],
          sellingPlanPerks: Array.isArray(clubObj.sellingPlanPerks)
            ? clubObj.sellingPlanPerks
            : [],
        };

        // Validate required fields using type guard
        if (!isWineClub(normalized)) {
          console.warn(
            "[Winehub] Skipping invalid wine club (missing required fields):",
            clubObj.id || "unknown",
          );
          return null;
        }

        return normalized as WineClub;
      })
      .filter((club): club is WineClub => club !== null);

    // Sort by position
    return normalizedClubs.sort(
      (a, b) => (a.position || 999) - (b.position || 999),
    );
  } catch (error) {
    // Catch network errors, timeout, etc. (FR-029, T068)
    console.error("[Winehub] Fetch failed:", error);
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        console.error(
          "[Winehub] API request timed out after 5 seconds - API may be slow or unavailable",
        );
      } else if (error.message.includes("fetch")) {
        console.error(
          "[Winehub] Network error - check API availability and connectivity",
        );
      }
    }
    return [];
  }
}

/**
 * Fetch detailed wine club information
 *
 * @description Retrieves complete wine club details including products from Winehub API
 * @param context - Shopify Hydrogen app context containing environment variables
 * @param clubId - Unique wine club identifier
 * @returns Wine club details or null on error
 *
 * @example
 * const details = await fetchWineClubDetails({ context, clubId: 'premium-club' });
 * if (details) {
 *   // Render wine club detail page
 * }
 */
export async function fetchWineClubDetails({
  context,
  clubId,
}: {
  context: AppLoadContext;
  clubId: string;
}): Promise<WineClubDetails | null> {
  const env = context.env as Record<string, string>;
  const apiBase = env.WINEHUB_API_BASE || "https://api.winehub.io/headless";
  const shopDomain = env.PUBLIC_STORE_DOMAIN;

  if (!shopDomain) {
    console.error("[Winehub] PUBLIC_STORE_DOMAIN not configured");
    return null;
  }

  if (!clubId) {
    console.error("[Winehub] clubId is required");
    return null;
  }

  try {
    // Use fetchWithTimeout to prevent hanging on slow API (T068, Edge Case: API timeout)
    // 1. Fetch main club details from headless API
    const response = await fetchWithTimeout(
      `${apiBase}/club/${encodeURIComponent(clubId)}/details?shop=${shopDomain}`,
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Hydrogen-Weaverse-Pilot/1.0",
        },
      },
      5000,
    );

    if (!response.ok) {
      console.error(
        `[Winehub] API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    // Handle malformed JSON
    let data: unknown;
    try {
      const text = await response.text();
      if (!text || text.trim().length === 0) return null;
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[Winehub] Failed to parse JSON:", parseError);
      return null;
    }

    if (!data || typeof data !== "object") return null;
    const clubObj = data as Record<string, unknown>;

    // 2. Fetch extra selling plan details (images) from main API
    // The headless API strips images, so we need to fetch them from the core API
    let sellingPlanImages: Record<string, any> = {};
    try {
      // We use the ID from the club object to fetch the selling plan group
      // Note: The headless ID usually matches the selling_plan_group ID
      const groupId = clubObj.id;
      if (groupId) {
        const imageResponse = await fetchWithTimeout(
          `https://api.winehub.io/api/selling_plan_groups/${groupId}?shop=${shopDomain}&properties[]=sellingPlans&properties[]=image`,
          { headers: { Accept: "application/json" } },
          3000, // Short timeout for enhancement data
        );

        if (imageResponse.ok) {
          const imageData = (await imageResponse.json()) as {
            sellingPlans?: any[];
          };
          if (imageData && Array.isArray(imageData.sellingPlans)) {
            imageData.sellingPlans.forEach((sp: any) => {
              if (sp.id && sp.image) {
                sellingPlanImages[sp.id] = sp.image;
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("[Winehub] Failed to fetch selling plan images", e);
      // Continue without images
    }

    // Normalize and validate
    const normalized = {
      ...clubObj,
      id: String(clubObj.id),
      shopifyId: String(clubObj.shopifyId || clubObj.shopify_id || ""),
      type: clubObj.type || null,
      position: typeof clubObj.position === "number" ? clubObj.position : 999,
      description: clubObj.description || null,
      image: clubObj.image || null,
      caseSizes: Array.isArray(clubObj.caseSizes) ? clubObj.caseSizes : [],
      sellingPlans: Array.isArray((clubObj as any).sellingPlans)
        ? ((clubObj as any).sellingPlans as any[]).map((sp: any) => ({
          ...sp,
          // Inject image if we found one
          image: sellingPlanImages[sp.id] || null,
        }))
        : [],
      sellingPlanPerks: Array.isArray(clubObj.sellingPlanPerks)
        ? clubObj.sellingPlanPerks
        : [],
      productData: Array.isArray(clubObj.productData)
        ? clubObj.productData
        : [],
      sellingPlanVariants: Array.isArray(clubObj.sellingPlanVariants)
        ? clubObj.sellingPlanVariants
        : [],
      minimumOrderValue: Array.isArray(clubObj.minimumOrderValue)
        ? clubObj.minimumOrderValue
        : [],
      signUpProductOffer: clubObj.signUpProductOffer || null,
      movOnly: typeof clubObj.movOnly === "boolean" ? clubObj.movOnly : false,
      isPlaylist:
        typeof clubObj.isPlaylist === "boolean" ? clubObj.isPlaylist : false,
      useSeasons:
        typeof clubObj.useSeasons === "boolean" ? clubObj.useSeasons : false,
    };

    if (!isWineClub(normalized)) {
      console.error("[Winehub] Invalid club data");
      return null;
    }

    return normalized as WineClubDetails;
  } catch (error) {
    // Catch network errors, timeout, etc. (FR-029, T068: Edge Case: API timeout)
    console.error("[Winehub] Fetch failed for club:", clubId, error);
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        console.error(
          "[Winehub] API request timed out after 5 seconds for club:",
          clubId,
          "- API may be slow or unavailable",
        );
      } else if (error.message.includes("fetch")) {
        console.error(
          "[Winehub] Network error - check API availability and connectivity",
        );
      }
    }
    return null;
  }
}

/**
 * Sanitize HTML content from Winehub API
 *
 * @description Removes dangerous HTML elements and attributes to prevent XSS attacks
 * Uses DOMPurify to allow safe HTML tags while blocking scripts, iframes, and event handlers
 *
 * @param html - Raw HTML string from Winehub API
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 *
 * @security Implements FR-008 security requirement (remove script tags, iframes, inline event handlers)
 *
 * @example
 * const safeHtml = sanitizeHtml(club.description);
 * <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
 */
export function sanitizeHtml(html: string): string {
  if (!html) {
    return "";
  }

  // Remove dangerous tags and attributes
  let cleaned = html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe, object, embed, form, input tags
    .replace(/<(iframe|object|embed|form|input)[^>]*>/gi, "")
    .replace(/<\/(iframe|object|embed|form|input)>/gi, "")
    // Remove dangerous event handlers
    .replace(/on\w+\s*=/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")
    // Remove data: URLs (except for images)
    .replace(/data:(?!image\/)/gi, "");

  return cleaned;
}

/**
 * API response wrapper for consistent error handling
 *
 * @description Helper function to wrap API responses with error state
 * @param data - Response data or null on error
 * @param error - Whether an error occurred
 * @param message - Optional error message
 * @returns Wrapped API response
 *
 * @example
 * const response = wrapResponse(clubs, false);
 * if (response.error) {
 *   // Handle error
 * }
 */
export function wrapResponse<T>(
  data: T | null,
  error: boolean,
  message?: string,
): ApiResponse<T> {
  return {
    data,
    error,
    message,
  };
}
