import type { CustomerAccount } from "@shopify/hydrogen";
import type { BuyerInput } from "@shopify/hydrogen/storefront-api-types";

/**
 * B2B buyer context — opt-in per storefront.
 *
 * Active only when the Oxygen environment variable `B2B_ENABLED` is "true"
 * for that storefront. Every other storefront gets `undefined` buyers and
 * `hidden: false`, so their queries run exactly as before.
 *
 * These helpers live outside `app/.server` so Weaverse section loaders can
 * use them too. They only read server values (env, session) and do nothing
 * in the browser.
 */

/** The parts of a route context or a Weaverse client these helpers need. */
export type B2BContext = {
  env: Env;
  customerAccount: CustomerAccount;
  request?: Request;
};

export function isB2BEnabled(env: Env): boolean {
  return env?.B2B_ENABLED === "true";
}

export function isWeaverseDesignMode(request?: Request): boolean {
  if (!request) {
    return false;
  }
  return Boolean(new URL(request.url).searchParams.get("weaverseHost"));
}

/**
 * Returns the buyer to pass to `@inContext(buyer:)`, or `undefined`.
 * A buyer is only returned when B2B is enabled AND a company location
 * has been stored for this session at login.
 */
export async function getB2BBuyer(
  context: B2BContext,
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
 * For product lists that cannot redirect (home page sections, API routes):
 * - not a B2B storefront → `{ hidden: false }` (unchanged behaviour)
 * - B2B storefront with a buyer → `{ hidden: false, buyer }`
 * - B2B storefront without a buyer → `{ hidden: true }`: return no products
 */
export async function getB2BListingContext(
  context: B2BContext,
): Promise<{ hidden: boolean; buyer?: BuyerInput }> {
  if (!isB2BEnabled(context.env)) {
    return { hidden: false };
  }
  // Keep Weaverse Studio usable: the editor iframe has no customer session.
  if (isWeaverseDesignMode(context.request)) {
    return { hidden: false };
  }
  const buyer = await getB2BBuyer(context);
  return buyer ? { hidden: false, buyer } : { hidden: true };
}
