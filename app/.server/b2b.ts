import type { BuyerInput } from "@shopify/hydrogen/storefront-api-types";
import { type AppLoadContext, redirect } from "react-router";
import {
  getB2BBuyer,
  isB2BEnabled,
  isB2BPublicCatalog,
  isWeaverseDesignMode,
} from "~/utils/b2b";

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

/** Customers who can buy for more than one location must pick one. */
function needsLocationChoice(context: AppLoadContext): boolean {
  return (context.session.get("b2bLocationCount") ?? 0) > 1;
}

/** The page that lets a customer pick (or switch) their location. */
export function locationPickerUrl(
  context: AppLoadContext,
  returnTo: string,
): string {
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  return `${prefix}/account/locations?${new URLSearchParams({ return_to: returnTo })}`;
}

/**
 * For product pages, collections, search and the all-products page on a B2B
 * storefront: returns the buyer, or redirects visitors without one
 * (customers with several locations → location picker; anonymous → login,
 * then back to this page; logged in without a company location → account
 * page, or the public catalog in public mode). On storefronts without B2B it
 * returns `undefined` and never redirects.
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
  const url = new URL(request.url);
  url.searchParams.delete("_routes");
  const returnTo = url.pathname.replace(/\.data$/, "") + url.search;
  if (
    needsLocationChoice(context) &&
    (await context.customerAccount.isLoggedIn())
  ) {
    throw redirect(locationPickerUrl(context, returnTo));
  }
  // Public mode: no buyer means the public catalog, not a login wall.
  if (isB2BPublicCatalog(context.env)) {
    return undefined;
  }
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  if (isLoggedIn) {
    throw redirect(`${prefix}/account`);
  }
  throw redirect(
    `${prefix}/account/login?${new URLSearchParams({ return_to: returnTo })}`,
  );
}

/**
 * After login on a B2B storefront, send buyers to the home page instead of
 * the account (orders) page. Any other destination — such as the product
 * page they were trying to open — is kept. Customers with several locations
 * go to the location picker first, then on to that destination.
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
  const destination =
    !location || location === "/account" || location === `${prefix}/account`
      ? prefix || "/"
      : location;
  if (needsLocationChoice(context) && !context.session.get("b2bLocation")) {
    return redirect(locationPickerUrl(context, destination));
  }
  if (destination !== location) {
    return redirect(destination);
  }
  return response;
}

/**
 * Company and location names for the "Ordering for" bar, or `null`.
 * Only returned on a B2B storefront while a company location is active.
 * `canSwitch` is true when the customer can buy for other locations too.
 */
export async function getB2BLocationLabel(context: AppLoadContext): Promise<{
  companyName: string;
  locationName: string;
  canSwitch: boolean;
} | null> {
  const buyer = await getB2BBuyer(context);
  const label = buyer ? context.session.get("b2bLocation") : null;
  if (!label) {
    return null;
  }
  return { ...label, canSwitch: needsLocationChoice(context) };
}
