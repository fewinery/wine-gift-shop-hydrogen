/**
 * Cart attribute that records which storefront a cart was created on.
 *
 * All brand storefronts share one Shopify checkout, so the checkout pixel
 * reads this attribute to send checkout and purchase events to the right
 * brand's GTM container.
 */
export const STOREFRONT_ATTRIBUTE = "_storefront";

export function getStorefrontHost(request: Request): string {
  return new URL(request.url).hostname.replace(/^www\./, "");
}
