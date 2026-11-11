import { type ActionFunctionArgs, data } from "react-router";
import { quoteRecipient } from "~/.server/multi-recipient-quote";
import { loadCustomerId } from "~/routes/account/address/saved-addresses";
import {
  MAX_PER_ITEM,
  type QuoteRequest,
  type QuoteResponse,
  toGiftItems,
  US_STATES,
} from "~/utils/multi-recipient";

/**
 * Prices one recipient of a multi-recipient order. The recipients page calls
 * this whenever a recipient's address, gifts or shipping method changes.
 *
 * It reads prices; it creates nothing. Even so it reaches the Admin API, so
 * it only answers for a storefront that has the feature on, and only for
 * products that are actually in the caller's cart.
 */

const NO_STORE = { "Cache-Control": "no-store" };
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const MAX_LINES = 50;

function respond(body: QuoteResponse, status = 200) {
  return data(body, { status, headers: NO_STORE });
}

function invalid(message: string) {
  return respond({ error: { code: "invalid", message } }, 400);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Reads the request body into the shape the pricing expects, or says what
 * is wrong with it. Nothing from the browser is trusted past this point. */
function parseRequest(
  body: unknown,
  cartVariantIds: Set<string>,
): QuoteRequest | string {
  const source = (body ?? {}) as {
    address?: Record<string, unknown>;
    items?: unknown;
    shippingMethod?: unknown;
  };
  const raw = source.address ?? {};
  const address = {
    firstName: text(raw.firstName, 100),
    lastName: text(raw.lastName, 100),
    company: text(raw.company, 100),
    address1: text(raw.address1, 200),
    address2: text(raw.address2, 200),
    city: text(raw.city, 100),
    state: text(raw.state, 2).toUpperCase(),
    zip: text(raw.zip, 10),
    phone: text(raw.phone, 30),
  };
  if (
    !(address.firstName && address.lastName && address.address1 && address.city)
  ) {
    return "The address is incomplete.";
  }
  if (!US_STATES.some((state) => state.code === address.state)) {
    return "Choose a state.";
  }
  if (!ZIP_PATTERN.test(address.zip)) {
    return "Enter a valid ZIP code.";
  }

  if (!Array.isArray(source.items) || source.items.length === 0) {
    return "Choose at least one gift.";
  }
  if (source.items.length > MAX_LINES) {
    return "Too many different gifts for one recipient.";
  }
  const items: QuoteRequest["items"] = [];
  for (const entry of source.items as Record<string, unknown>[]) {
    const variantId = text(entry?.variantId, 100);
    const quantity = Number(entry?.quantity);
    if (!cartVariantIds.has(variantId)) {
      return "One of these gifts is no longer in your cart.";
    }
    if (
      !(Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_PER_ITEM)
    ) {
      return "A gift quantity is out of range.";
    }
    items.push({ variantId, quantity });
  }

  return { address, items, shippingMethod: text(source.shippingMethod, 100) };
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return invalid("Unsupported method.");
  }
  const { cart, weaverse, env } = context;

  const [theme, cartData, customerId, body] = await Promise.all([
    weaverse.loadThemeSettings(),
    cart.get(),
    loadCustomerId(context),
    request.json().catch(() => null),
  ]);
  // loadThemeSettings returns { theme, ... }; the saved values live in .theme.
  const settings = (theme?.theme ?? {}) as {
    enableMultiRecipient?: boolean;
    multiRecipientHiddenRates?: string;
  };
  if (settings.enableMultiRecipient !== true) {
    throw new Response("Not found", { status: 404 });
  }

  const cartVariantIds = new Set(
    toGiftItems(cartData).map((item) => item.variantId),
  );
  const parsed = parseRequest(body, cartVariantIds);
  if (typeof parsed === "string") {
    return invalid(parsed);
  }

  // Every code on the cart is offered to the calculation, including ones the
  // cart itself marks as not applicable: the cart judges them against its
  // own quantities, which are not what is being bought here.
  const discountCodes = (
    (cartData as { discountCodes?: Array<{ code?: string | null }> | null })
      ?.discountCodes ?? []
  )
    .map((entry) => entry?.code ?? "")
    .filter(Boolean);

  const hiddenRates = (settings.multiRecipientHiddenRates ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return respond(
    await quoteRecipient({
      env,
      request: parsed,
      discountCodes,
      customerId,
      hiddenRates,
    }),
  );
}
