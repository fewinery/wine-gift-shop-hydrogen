/**
 * Ad-click attribution across the shared checkout.
 *
 * A shopper clicks an ad and lands on a brand site with tracking in the URL
 * (utm_* tags, Google's gclid, Meta's fbclid). They pay on winegiftshop.com,
 * a different domain, where that URL and the brand site's cookies are gone,
 * so GA4, Google Ads and Meta record the sale as "Direct" or "Unassigned".
 *
 * 1. In the browser, rememberAdClick() keeps the tracking from the landing
 *    URL in a first-party cookie for 30 days.
 * 2. On the server, getAttributionAttributes() turns that cookie, plus the
 *    GA4 and Meta browser IDs, into cart attributes.
 * 3. The Shopify checkout pixel reads the attributes and hands them to the
 *    brand's GTM container, so the purchase is credited to the ad. The same
 *    values show on each order under "Additional details".
 */

export const AD_CLICK_COOKIE = "_wgs_ad";

const AD_CLICK_MAX_AGE = 60 * 60 * 24 * 30;

// Shopify keeps attribute values short; tracking values never need more.
const MAX_VALUE_LENGTH = 250;

const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

type AdClick = Partial<Record<(typeof CAMPAIGN_PARAMS)[number], string>> & {
  landing?: string;
  at?: string;
};

export interface AttributeInput {
  key: string;
  value: string;
}

/**
 * Browser only. Saves the campaign tracking from a landing URL. A visit with
 * no tracking leaves the saved click alone, so a shopper who clicks an ad and
 * comes back by typing the address is still credited to the ad, the same way
 * Google Ads and Meta count it. A newer ad click replaces an older one.
 */
export function rememberAdClick(href: string) {
  if (typeof document === "undefined") {
    return;
  }
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return;
  }
  const click: AdClick = {};
  for (const param of CAMPAIGN_PARAMS) {
    const value = url.searchParams.get(param);
    if (value) {
      click[param] = value.slice(0, MAX_VALUE_LENGTH);
    }
  }
  if (Object.keys(click).length === 0) {
    return;
  }
  click.landing = url.pathname.slice(0, MAX_VALUE_LENGTH);
  click.at = new Date().toISOString();
  const secure = url.protocol === "https:" ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: a plain first-party cookie is all this needs
  document.cookie = `${AD_CLICK_COOKIE}=${encodeURIComponent(
    JSON.stringify(click),
  )}; Max-Age=${AD_CLICK_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function readCookies(request: Request): Map<string, string> {
  const cookies = new Map<string, string>();
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name && !cookies.has(name)) {
      try {
        cookies.set(name, decodeURIComponent(value));
      } catch {
        cookies.set(name, value);
      }
    }
  }
  return cookies;
}

/** "GA1.1.123456789.1700000000" is the GA4 _ga cookie; the ID is the end. */
function gaClientId(cookie: string | undefined): string {
  const parts = (cookie ?? "").split(".");
  return parts.length >= 4 ? parts.slice(-2).join(".") : "";
}

/**
 * Server only. The cart attributes that carry the shopper's ad click and
 * browser IDs into checkout. Keys start with "_" so Shopify hides them from
 * the shopper at checkout but shows them to staff on the order.
 */
export function getAttributionAttributes(request: Request): AttributeInput[] {
  const cookies = readCookies(request);
  const attributes: AttributeInput[] = [];
  const add = (key: string, value: string | undefined) => {
    if (value) {
      attributes.push({ key, value: value.slice(0, MAX_VALUE_LENGTH) });
    }
  };

  let click: AdClick = {};
  try {
    click = JSON.parse(cookies.get(AD_CLICK_COOKIE) ?? "{}") as AdClick;
  } catch {
    click = {};
  }
  for (const param of CAMPAIGN_PARAMS) {
    add(`_${param}`, click[param]);
  }
  add("_landing_page", click.landing);
  add("_ad_click_at", click.at);

  add("_ga_client_id", gaClientId(cookies.get("_ga")));
  add("_fbp", cookies.get("_fbp"));
  add("_fbc", cookies.get("_fbc"));
  return attributes;
}
