import type { BuyerInput } from "@shopify/hydrogen/storefront-api-types";
import { type AppLoadContext, redirect } from "react-router";

/**
 * B2B buyer context — opt-in per storefront.
 *
 * Active only when the Oxygen environment variable `B2B_ENABLED` is "true"
 * for that storefront. Every other storefront gets `undefined` from
 * `getB2BBuyer`, so their queries run exactly as before.
 */
export function isB2BEnabled(env: Env): boolean {
  return env.B2B_ENABLED === "true";
}

/**
 * Returns the buyer to pass to `@inContext(buyer:)`, or `undefined`.
 * A buyer is only returned when B2B is enabled AND a company location
 * has been stored for this session at login.
 */
export async function getB2BBuyer(
  context: AppLoadContext,
): Promise<BuyerInput | undefined> {
  if (!isB2BEnabled(context.env)) {
    return undefined;
  }
  const buyer = await context.customerAccount.getBuyer();
  if (!(buyer?.customerAccessToken && buyer.companyLocationId)) {
    return undefined;
  }
  return {
    customerAccessToken: buyer.customerAccessToken,
    companyLocationId: buyer.companyLocationId,
  };
}

/**
 * For product-bearing loaders on a B2B storefront: returns the buyer, or
 * redirects visitors without one (anonymous → login, logged in without a
 * company location → account page). On storefronts without B2B it returns
 * `undefined` and never redirects.
 */
export async function requireB2BBuyer(
  context: AppLoadContext,
  request: Request,
): Promise<BuyerInput | undefined> {
  if (!isB2BEnabled(context.env)) {
    return undefined;
  }
  // Keep Weaverse Studio usable: the editor iframe has no customer session.
  if (new URL(request.url).searchParams.get("weaverseHost")) {
    return undefined;
  }
  const buyer = await getB2BBuyer(context);
  if (buyer) {
    return buyer;
  }
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  const isLoggedIn = await context.customerAccount.isLoggedIn();
  throw redirect(isLoggedIn ? `${prefix}/account` : `${prefix}/account/login`);
}
