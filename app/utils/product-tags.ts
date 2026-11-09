/**
 * Shopify tags the storefront treats as instructions.
 *
 * Matched without regard to capital letters or surrounding spaces, the same
 * way the club price message tag is, because a tag typed by hand in the admin
 * will eventually arrive as "No-Price-Displayed " or "no-price-displayed".
 */

/**
 * Hides the price wherever this product's own price would be shown: the
 * product page and the cards on listings and search.
 *
 * Display only. It does not change what the product costs, what the cart
 * charges, or anything at checkout - a tagged product still has its price and
 * still sells at it.
 */
const NO_PRICE_TAG = "no-price-displayed";

export function hidesPrice(tags?: string[] | null) {
  return Boolean(
    tags?.some((tag) => tag.trim().toLowerCase() === NO_PRICE_TAG),
  );
}
