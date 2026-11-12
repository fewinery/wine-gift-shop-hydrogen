import { adminGraphql } from "~/.server/admin-api";
import type {
  QuoteErrorCode,
  QuoteRequest,
  QuoteResponse,
  RecipientQuote,
} from "~/utils/multi-recipient";

/**
 * Prices one recipient of a multi-recipient order: their gifts, shipped to
 * their address, with Shopify's own tax and shipping.
 *
 * It uses Shopify's draft order calculation, which creates nothing. The
 * figures come from the store's real tax settings, shipping profiles and
 * carrier rates, so they are the same ones the order will carry later.
 */

// Deliberately not tagged #graphql: codegen checks every tagged query under
// app/ against the Storefront schema, and this one is for the Admin API.
const CALCULATE_MUTATION = `
  mutation multiRecipientCalculate($input: DraftOrderInput!) {
    draftOrderCalculate(input: $input) {
      calculatedDraftOrder {
        currencyCode
        totalLineItemsPriceSet { shopMoney { amount } }
        totalDiscountsSet { shopMoney { amount } }
        totalShippingPriceSet { shopMoney { amount } }
        totalTaxSet { shopMoney { amount } }
        totalPriceSet { shopMoney { amount } }
        taxLines { title priceSet { shopMoney { amount } } }
        availableShippingRates { handle title price { amount } }
        warnings { message }
      }
      userErrors { field message }
    }
  }
`;

interface Money {
  shopMoney?: { amount?: string | null } | null;
}

interface Calculation {
  currencyCode: string;
  totalLineItemsPriceSet: Money;
  totalDiscountsSet: Money;
  totalShippingPriceSet: Money;
  totalTaxSet: Money;
  totalPriceSet: Money;
  taxLines: Array<{ title: string; priceSet: Money }>;
  availableShippingRates: Array<{
    handle: string;
    title: string;
    price: { amount: string };
  }>;
  warnings: Array<{ message: string }>;
}

interface CalculateResult {
  draftOrderCalculate?: {
    calculatedDraftOrder?: Calculation | null;
    userErrors?: Array<{ field?: string[] | null; message: string }> | null;
  } | null;
}

function amount(money: Money | null | undefined) {
  return Number(money?.shopMoney?.amount) || 0;
}

export type QuoteFailure = Extract<QuoteResponse, { error: unknown }>;

function failure(code: QuoteErrorCode, message: string): QuoteFailure {
  return { error: { code, message } };
}

const UNAVAILABLE =
  "Tax and shipping can't be calculated right now. Please try again in a moment.";

/**
 * The draft order input for one recipient: their gifts, their address, the
 * cart's discount codes and, when known, who is buying. Pricing and the real
 * order are both built from this, so they cannot drift apart.
 */
export function pricingInput({
  request,
  discountCodes,
  customerId,
}: {
  request: QuoteRequest;
  /** Read from the shopper's cart on the server, never from the browser. */
  discountCodes: string[];
  /** Set for logged-in shoppers, so prices and tax that depend on who is
   * buying come out the same here as on the order. */
  customerId: string | null;
}): Record<string, unknown> {
  const { address } = request;
  return {
    lineItems: request.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
    shippingAddress: {
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || undefined,
      address1: address.address1,
      address2: address.address2 || undefined,
      city: address.city,
      provinceCode: address.state,
      countryCode: "US",
      zip: address.zip,
      phone: address.phone || undefined,
    },
    discountCodes,
    acceptAutomaticDiscounts: true,
    ...(customerId ? { purchasingEntity: { customerId } } : {}),
  };
}

export interface OfferedRate {
  /** Shopify's own reference for the rate; needed to apply it. */
  handle: string;
  title: string;
  amount: number;
}

/**
 * The shipping methods Shopify offers for an input, cheapest first, with the
 * ones this storefront hides taken out.
 */
export async function offeredRates(
  env: Env,
  input: Record<string, unknown>,
  hiddenRates: string[],
): Promise<{ rates: OfferedRate[] } | QuoteFailure> {
  const first = await calculate(env, input);
  if ("error" in first) {
    return first;
  }

  const hidden = new Set(hiddenRates.map((name) => name.toLowerCase()));
  const rates = first.calculation.availableShippingRates
    .filter((rate) => !hidden.has(rate.title.trim().toLowerCase()))
    .map((rate) => ({
      handle: rate.handle,
      title: rate.title,
      amount: Number(rate.price.amount) || 0,
    }))
    .sort((a, b) => a.amount - b.amount);

  if (rates.length === 0) {
    // Shopify offering nothing is how a destination the store does not ship
    // to shows up - a state wine cannot be sent to, for one.
    return failure(
      "no_rates",
      "We can't ship these gifts to this address. Check the address, or choose different gifts for this recipient.",
    );
  }
  return { rates };
}

export async function quoteRecipient({
  env,
  request,
  discountCodes,
  customerId,
  hiddenRates,
}: {
  env: Env;
  request: QuoteRequest;
  discountCodes: string[];
  customerId: string | null;
  /** Shipping method names this storefront does not offer for gifts. */
  hiddenRates: string[];
}): Promise<QuoteResponse> {
  const input = pricingInput({ request, discountCodes, customerId });

  // First pass: which shipping methods does Shopify offer for this address?
  const offered = await offeredRates(env, input, hiddenRates);
  if ("error" in offered) {
    return offered;
  }
  const { rates } = offered;

  const chosen =
    rates.find((rate) => rate.title === request.shippingMethod) ?? rates[0];

  // Second pass, with the method applied. Tax has to be worked out after the
  // shipping choice: some states tax the shipping charge itself, so the
  // first pass alone would come up short there.
  const second = await calculate(env, {
    ...input,
    shippingLine: { shippingRateHandle: chosen.handle },
  });
  if ("error" in second) {
    return second;
  }
  const priced = second.calculation;

  // One jurisdiction can arrive as several lines (a wine rate and a general
  // rate, both named for the state); a shopper wants one figure per name.
  const taxByTitle = new Map<string, number>();
  for (const line of priced.taxLines) {
    taxByTitle.set(
      line.title,
      (taxByTitle.get(line.title) ?? 0) + amount(line.priceSet),
    );
  }

  const quote: RecipientQuote = {
    currencyCode: priced.currencyCode,
    merchandise: amount(priced.totalLineItemsPriceSet),
    discount: amount(priced.totalDiscountsSet),
    shipping: amount(priced.totalShippingPriceSet),
    tax: amount(priced.totalTaxSet),
    total: amount(priced.totalPriceSet),
    taxLines: [...taxByTitle.entries()].map(([title, value]) => ({
      title,
      amount: value,
    })),
    rates: rates.map((rate) => ({ title: rate.title, amount: rate.amount })),
    shippingMethod: chosen.title,
    notices: priced.warnings.map((warning) => warning.message),
  };
  return { quote };
}

async function calculate(
  env: Env,
  input: Record<string, unknown>,
): Promise<{ calculation: Calculation } | QuoteFailure> {
  const result = await adminGraphql<CalculateResult>(env, CALCULATE_MUTATION, {
    input,
  });
  // Compared with === because this repo runs TypeScript without strict mode,
  // where a bare !result.ok does not narrow the result to its failure shape.
  if (result.ok === false) {
    // The detail goes to the server log, where it can be acted on; the
    // shopper is told only that it did not work.
    console.error(
      "Multi-recipient pricing failed:",
      result.reason,
      result.detail,
    );
    return failure("unavailable", UNAVAILABLE);
  }

  const payload = result.data.draftOrderCalculate;
  const userErrors = payload?.userErrors ?? [];
  if (userErrors.length > 0) {
    // Shopify's own words about what is wrong with the address or the items.
    return failure(
      "invalid",
      userErrors.map((error) => error.message).join(" "),
    );
  }
  if (!payload?.calculatedDraftOrder) {
    console.error("Multi-recipient pricing returned no calculation");
    return failure("unavailable", UNAVAILABLE);
  }
  return { calculation: payload.calculatedDraftOrder };
}
