import { type ActionFunctionArgs, data } from "react-router";
import { hasAdminCredentials } from "~/.server/admin-api";
import {
  type CheckoutLine,
  type CheckoutRecipientInput,
  createMultiRecipientCheckout,
  discardPreviousAttempt,
} from "~/.server/multi-recipient-checkout";
import { loadCustomerId } from "~/routes/account/address/saved-addresses";
import {
  type CheckoutResponse,
  GIFT_FROM_MAX,
  GIFT_MESSAGE_MAX,
  GIFT_TO_MAX,
  MAX_PER_ITEM,
  MAX_RECIPIENTS,
  US_STATES,
} from "~/utils/multi-recipient";

/**
 * Starts payment for a multi-recipient order. The recipients page calls this
 * when the shopper presses Checkout; it answers with the address of
 * Shopify's payment page for the whole order.
 *
 * This is the one endpoint that creates things in the store (draft orders),
 * so nothing from the browser is used without being checked, and every
 * price comes from Shopify, never from the request.
 */

const NO_STORE = { "Cache-Control": "no-store" };
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LINES = 50;

function respond(body: CheckoutResponse, status = 200) {
  return data(body, { status, headers: NO_STORE });
}

function invalid(message: string, recipient?: number) {
  return respond({ error: { message, recipient } }, 400);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

interface CartLine {
  variantId: string;
  attributes: CheckoutLine["attributes"];
}

/** The caller's cart lines by id: the variant each one is, and whatever was
 * chosen for it on the product page. This, not the request, decides what a
 * line is. */
function cartLines(cart: unknown): Map<string, CartLine> {
  const nodes =
    (
      cart as {
        lines?: {
          nodes?: Array<{
            id?: string | null;
            attributes?: Array<{
              key?: string | null;
              value?: string | null;
            }> | null;
            merchandise?: { id?: string | null } | null;
          }> | null;
        } | null;
      }
    )?.lines?.nodes ?? [];
  const lines = new Map<string, CartLine>();
  for (const node of nodes) {
    if (node?.id && node.merchandise?.id) {
      lines.set(node.id, {
        variantId: node.merchandise.id,
        attributes: (node.attributes ?? [])
          .map((attribute) => ({
            key: attribute?.key ?? "",
            value: attribute?.value ?? "",
          }))
          .filter((attribute) => attribute.key && attribute.value),
      });
    }
  }
  return lines;
}

/** One recipient from the request, checked, or a sentence saying what is
 * wrong with it. */
function parseRecipient(
  source: unknown,
  cart: Map<string, CartLine>,
): CheckoutRecipientInput | string {
  const entry = (source ?? {}) as {
    address?: Record<string, unknown>;
    email?: unknown;
    lines?: unknown;
    shippingMethod?: unknown;
    gift?: Record<string, unknown>;
  };
  const raw = entry.address ?? {};
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
    return "An address is incomplete.";
  }
  if (!US_STATES.some((state) => state.code === address.state)) {
    return "An address is missing its state.";
  }
  if (!ZIP_PATTERN.test(address.zip)) {
    return "An address has an invalid ZIP code.";
  }

  const email = text(entry.email, 200);
  if (email && !EMAIL_PATTERN.test(email)) {
    return "A recipient's email is not valid.";
  }

  if (!Array.isArray(entry.lines) || entry.lines.length === 0) {
    return "A recipient has no gifts.";
  }
  if (entry.lines.length > MAX_LINES) {
    return "A recipient has too many different gifts.";
  }
  const lines: CheckoutLine[] = [];
  for (const item of entry.lines as Record<string, unknown>[]) {
    const line = cart.get(text(item?.lineId, 200));
    const quantity = Number(item?.quantity);
    if (!line) {
      return "One of the gifts is no longer in your cart.";
    }
    if (
      !(Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_PER_ITEM)
    ) {
      return "A gift quantity is out of range.";
    }
    lines.push({ ...line, quantity });
  }

  const shippingMethod = text(entry.shippingMethod, 100);
  if (!shippingMethod) {
    return "A recipient has no shipping method.";
  }

  const gift = entry.gift ?? {};
  return {
    address,
    email,
    lines,
    shippingMethod,
    gift: {
      to: text(gift.to, GIFT_TO_MAX),
      from: text(gift.from, GIFT_FROM_MAX),
      message: text(gift.message, GIFT_MESSAGE_MAX),
    },
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return invalid("Unsupported method.");
  }
  const { cart, weaverse, env, session } = context;

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
  if (settings.enableMultiRecipient !== true || !hasAdminCredentials(env)) {
    throw new Response("Not found", { status: 404 });
  }

  const requested = (body as { recipients?: unknown } | null)?.recipients;
  if (!Array.isArray(requested) || requested.length === 0) {
    return invalid("Add at least one recipient.");
  }
  if (requested.length > MAX_RECIPIENTS) {
    return invalid(
      `One order can go to at most ${MAX_RECIPIENTS} recipients. Please split it into two orders.`,
    );
  }

  const lines = cartLines(cartData);
  const recipients: CheckoutRecipientInput[] = [];
  for (const [index, source] of requested.entries()) {
    const parsed = parseRecipient(source, lines);
    if (typeof parsed === "string") {
      return invalid(parsed, index);
    }
    recipients.push(parsed);
  }

  // Every code on the cart is offered, exactly as it was for the prices the
  // shopper has been looking at.
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

  // A second press of Checkout replaces the first attempt, if it was never
  // paid, so unused drafts do not pile up in the store.
  const previous = session.get("multiRecipientDraft");
  if (previous) {
    await discardPreviousAttempt(env, previous);
  }

  const result = await createMultiRecipientCheckout({
    env,
    recipients,
    discountCodes,
    customerId,
    hiddenRates,
    testMode: env.MULTI_RECIPIENT_TEST_MODE === "true",
  });

  if ("invoiceUrl" in result) {
    if (result.parentId) {
      session.set("multiRecipientDraft", result.parentId);
    }
    return respond({ invoiceUrl: result.invoiceUrl });
  }
  session.unset("multiRecipientDraft");
  return respond({ error: result.error }, 422);
}
