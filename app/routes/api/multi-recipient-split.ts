import { type ActionFunctionArgs, data } from "react-router";
import { splitParentOrder } from "~/.server/multi-recipient-split";

/**
 * Called by the store (a Shopify Flow workflow on "Order paid") for a paid
 * multi-recipient order. It creates the recipients' orders and cancels the
 * parent; see multi-recipient-split for what that involves.
 *
 * The answer tells the caller what to do next:
 *   200  finished, or not an order this applies to
 *   503  not finished yet - call again (Flow does, for up to a day)
 *   422  a person needs to look - calling again will not help
 *
 * It is not for browsers. The caller proves itself with a shared secret,
 * and the work is safe to repeat, so a duplicate call does no harm.
 */

const NO_STORE = { "Cache-Control": "no-store" };
const ORDER_GID = /^gid:\/\/shopify\/Order\/\d+$/;

/** Compares without stopping at the first difference, so how long it takes
 * says nothing about how much of the secret was right. */
function matches(given: string, expected: string) {
  if (given.length !== expected.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= given.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { env } = context;
  if (request.method !== "POST") {
    return data({ error: "Unsupported method." }, { status: 405 });
  }

  const secret = env.MULTI_RECIPIENT_SPLIT_SECRET;
  if (!secret) {
    // Not set up on this storefront. Asking again later is right: the order
    // is paid and waiting, and this is fixed by adding the variable.
    console.error(
      "Multi-recipient split: MULTI_RECIPIENT_SPLIT_SECRET is not set",
    );
    return data(
      { status: "retry", detail: "The split endpoint is not configured." },
      { status: 503, headers: NO_STORE },
    );
  }
  const given = request.headers.get("X-Multi-Recipient-Secret") ?? "";
  if (!matches(given, secret)) {
    return data({ error: "Not authorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    orderId?: unknown;
  } | null;
  const raw = String(body?.orderId ?? "").trim();
  // Accept the id either way a workflow might send it.
  const orderId = /^\d+$/.test(raw) ? `gid://shopify/Order/${raw}` : raw;
  if (!ORDER_GID.test(orderId)) {
    return data(
      { status: "attention", detail: "The request carried no order id." },
      { status: 400, headers: NO_STORE },
    );
  }

  const outcome = await splitParentOrder({ env, orderId });
  const status =
    outcome.status === "retry"
      ? 503
      : outcome.status === "attention"
        ? 422
        : 200;
  return data(outcome, { status, headers: NO_STORE });
}
