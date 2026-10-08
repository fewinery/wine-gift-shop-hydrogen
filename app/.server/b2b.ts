import type { BuyerInput } from "@shopify/hydrogen/storefront-api-types";
import { type AppLoadContext, redirect } from "react-router";
import { getB2BBuyer, isB2BEnabled, isWeaverseDesignMode } from "~/utils/b2b";

/**
 * B2B buyer context — opt-in per storefront via `B2B_ENABLED`.
 * Shared helpers live in `~/utils/b2b` (Weaverse section loaders use them
 * too); they are re-exported here so routes keep one import path.
 */
export {
  getB2BBuyer,
  getB2BListingContext,
  isB2BEnabled,
} from "~/utils/b2b";

/**
 * For product pages, collections, search and the all-products page on a B2B
 * storefront: returns the buyer, or redirects visitors without one
 * (anonymous → login, then back to this page; logged in without a company
 * location → account page). On storefronts without B2B it returns
 * `undefined` and never redirects.
 */
export async function requireB2BBuyer(
  context: AppLoadContext,
  request: Request,
): Promise<BuyerInput | undefined> {
  if (!isB2BEnabled(context.env)) {
    return undefined;
  }
  if (isWeaverseDesignMode(request)) {
    return undefined;
  }
  const buyer = await getB2BBuyer(context);
  if (buyer) {
    return buyer;
  }
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (isLoggedIn) {
    throw redirect(`${prefix}/account`);
  }
  const url = new URL(request.url);
  url.searchParams.delete("_routes");
  const returnTo = url.pathname.replace(/\.data$/, "") + url.search;
  throw redirect(
    `${prefix}/account/login?${new URLSearchParams({ return_to: returnTo })}`,
  );
}

/**
 * After login on a B2B storefront, send buyers to the home page instead of
 * the account (orders) page. Any other destination — such as the product
 * page they were trying to open — is kept.
 */
export function b2bPostLoginRedirect(
  context: AppLoadContext,
  response: Response,
): Response {
  if (!isB2BEnabled(context.env)) {
    return response;
  }
  const location = response.headers.get("Location");
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  if (location === "/account" || location === `${prefix}/account`) {
    return redirect(prefix || "/");
  }
  return response;
}
