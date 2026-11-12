import { adminGraphql } from "~/.server/admin-api";
import { offeredRates, pricingInput } from "~/.server/multi-recipient-quote";
import {
  CHILD_TAG,
  type CheckoutResponse,
  PARENT_TAG,
  type QuoteRequest,
  TEST_TAG,
} from "~/utils/multi-recipient";

/**
 * Turns a set of priced recipients into something the shopper can pay for.
 *
 * It creates one draft order per recipient - the real products, their
 * address, their shipping method - and lets Shopify work out each one's
 * tax, shipping and discounts. Then it creates one more draft, the parent,
 * which simply adds those up and is the only thing the shopper pays.
 *
 * Because the parent is built from the children's own totals, the amount
 * charged and the orders that are later fulfilled cannot disagree. Nothing
 * is an order yet: the children become orders only after the parent is
 * paid (see multi-recipient-split).
 */

export interface CheckoutLine {
  variantId: string;
  quantity: number;
  /** What was chosen for this cart line on the product page. */
  attributes: Array<{ key: string; value: string }>;
}

export interface CheckoutRecipientInput {
  address: QuoteRequest["address"];
  email: string;
  lines: CheckoutLine[];
  shippingMethod: string;
  gift: { to: string; from: string; message: string };
}

// Not tagged #graphql: codegen checks tagged queries under app/ against the
// Storefront schema, and these are for the Admin API.
const DRAFT_CREATE = `
  mutation multiRecipientDraftCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        invoiceUrl
        currencyCode
        totalShippingPriceSet { shopMoney { amount } }
        totalTaxSet { shopMoney { amount } }
        totalPriceSet { shopMoney { amount } }
        taxLines { title priceSet { shopMoney { amount } } }
        shippingLine { title }
        lineItems(first: 50) {
          nodes {
            title
            variantTitle
            quantity
            originalUnitPriceSet { shopMoney { amount } }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const DRAFT_DELETE = `
  mutation multiRecipientDraftDelete($input: DraftOrderDeleteInput!) {
    draftOrderDelete(input: $input) {
      deletedId
      userErrors { message }
    }
  }
`;

const PREVIOUS_ATTEMPT = `
  query multiRecipientPreviousAttempt($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      lineItems(first: 250) {
        nodes { customAttributes { key value } }
      }
    }
  }
`;

const UNAVAILABLE =
  "We couldn't start checkout just now. Nothing was charged - please try again in a moment.";

interface Money {
  shopMoney?: { amount?: string | null } | null;
}

interface CreatedDraft {
  id: string;
  name: string;
  invoiceUrl?: string | null;
  currencyCode: string;
  totalShippingPriceSet: Money;
  totalTaxSet: Money;
  totalPriceSet: Money;
  taxLines: Array<{ title: string; priceSet: Money }>;
  shippingLine?: { title?: string | null } | null;
  lineItems: {
    nodes: Array<{
      title: string;
      variantTitle?: string | null;
      quantity: number;
      originalUnitPriceSet: Money;
    }>;
  };
}

interface DraftCreateResult {
  draftOrderCreate?: {
    draftOrder?: CreatedDraft | null;
    userErrors?: Array<{ message: string }> | null;
  } | null;
}

/** Money is added up in whole cents, so twenty-five recipients' worth of
 * decimals cannot drift by a fraction. */
function cents(money: Money | null | undefined) {
  return Math.round((Number(money?.shopMoney?.amount) || 0) * 100);
}

function decimal(value: number) {
  return (value / 100).toFixed(2);
}

function dollars(value: number) {
  return `$${decimal(value)}`;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  run: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await run(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

async function deleteDrafts(env: Env, ids: string[]) {
  await Promise.all(
    ids.map((id) => adminGraphql(env, DRAFT_DELETE, { input: { id } })),
  );
}

/**
 * Clears away the drafts from this shopper's last attempt, if they never
 * paid it. Pressing Checkout, going back to fix an address and pressing it
 * again would otherwise leave a full set of unused drafts behind each time.
 *
 * A parent that is no longer open has been paid, so it and its children are
 * left strictly alone.
 */
export async function discardPreviousAttempt(env: Env, parentId: string) {
  const found = await adminGraphql<{
    draftOrder?: {
      id: string;
      status: string;
      lineItems: {
        nodes: Array<{
          customAttributes: Array<{ key: string; value?: string | null }>;
        }>;
      };
    } | null;
  }>(env, PREVIOUS_ATTEMPT, { id: parentId });
  if (found.ok === false) {
    return;
  }
  const draft = found.data.draftOrder;
  if (!draft || draft.status !== "OPEN") {
    return;
  }
  const children = new Set<string>();
  for (const line of draft.lineItems.nodes) {
    for (const attribute of line.customAttributes) {
      if (attribute.key === "_mr_child" && attribute.value) {
        children.add(attribute.value);
      }
    }
  }
  await deleteDrafts(env, [...children, draft.id]);
}

function recipientName(address: QuoteRequest["address"]) {
  return `${address.firstName} ${address.lastName}`.trim();
}

function shipToLabel(address: QuoteRequest["address"]) {
  return [
    recipientName(address),
    address.address1,
    address.address2,
    address.city,
    `${address.state} ${address.zip}`,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * The attributes a product line carries onto the recipient's order: whatever
 * was chosen for it on the product page. Where that included a gift message
 * (a wood card's To / From / Message) and this recipient has their own, the
 * recipient's replaces it - that is the whole point of a message each.
 */
function lineAttributes(
  attributes: CheckoutLine["attributes"],
  gift: CheckoutRecipientInput["gift"],
) {
  const overrides: Record<string, string> = {
    To: gift.to,
    From: gift.from,
    Message: gift.message,
  };
  const hasGift = Boolean(gift.to || gift.from || gift.message);
  return attributes
    .map(({ key, value }) => ({
      key,
      value: hasGift && key in overrides ? overrides[key] : value,
    }))
    .filter((attribute) => attribute.key && attribute.value);
}

interface Child {
  id: string;
  name: string;
  currencyCode: string;
  shipping: number;
  tax: number;
  total: number;
  shippingTitle: string;
  taxLines: Array<{ title: string; amount: number }>;
  lines: Array<{ title: string; quantity: number; unit: number }>;
}

type ChildResult = { child: Child } | { error: string };

export async function createMultiRecipientCheckout({
  env,
  recipients,
  discountCodes,
  customerId,
  hiddenRates,
  testMode,
}: {
  env: Env;
  recipients: CheckoutRecipientInput[];
  /** Read from the shopper's cart on the server, never from the browser. */
  discountCodes: string[];
  customerId: string | null;
  hiddenRates: string[];
  /** Adds the test tag to everything, for storefronts used for testing. */
  testMode: boolean;
}): Promise<CheckoutResponse & { parentId?: string }> {
  const extraTags = testMode ? [TEST_TAG] : [];

  async function createChild(
    recipient: CheckoutRecipientInput,
    index: number,
  ): Promise<ChildResult> {
    // Two cart lines of one variant are one line to Shopify's pricing.
    const quantities = new Map<string, number>();
    for (const line of recipient.lines) {
      quantities.set(
        line.variantId,
        (quantities.get(line.variantId) ?? 0) + line.quantity,
      );
    }
    const input = pricingInput({
      request: {
        address: recipient.address,
        items: [...quantities.entries()].map(([variantId, quantity]) => ({
          variantId,
          quantity,
        })),
        shippingMethod: recipient.shippingMethod,
      },
      discountCodes,
      customerId,
    });

    const offered = await offeredRates(env, input, hiddenRates);
    if ("error" in offered) {
      return { error: offered.error.message };
    }
    // Unlike pricing, this does not fall back to the cheapest method. The
    // shopper was shown a total for a particular one; if that is gone they
    // should see the new figures before being asked to pay.
    const chosen = offered.rates.find(
      (rate) => rate.title === recipient.shippingMethod,
    );
    if (!chosen) {
      return {
        error: `The shipping method for ${recipientName(recipient.address)} is no longer offered. Please review their shipping and try again.`,
      };
    }

    const { gift } = recipient;
    const giftText = [
      gift.to && `To: ${gift.to}`,
      gift.from && `From: ${gift.from}`,
      gift.message && `Message: ${gift.message}`,
    ]
      .filter(Boolean)
      .join("\n");

    const created = await adminGraphql<DraftCreateResult>(env, DRAFT_CREATE, {
      input: {
        ...input,
        lineItems: recipient.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
          customAttributes: lineAttributes(line.attributes, gift),
        })),
        shippingLine: { shippingRateHandle: chosen.handle },
        tags: [CHILD_TAG, ...extraTags],
        note: giftText ? `Gift message\n${giftText}` : undefined,
        customAttributes: [
          { key: "_mr_index", value: String(index) },
          { key: "Gift To", value: gift.to },
          { key: "Gift From", value: gift.from },
          { key: "Gift Message", value: gift.message },
          { key: "Recipient email", value: recipient.email },
        ].filter((attribute) => attribute.value),
      },
    });
    if (created.ok === false) {
      console.error(
        "Multi-recipient checkout: could not create a recipient draft:",
        created.reason,
        created.detail,
      );
      return { error: UNAVAILABLE };
    }
    const payload = created.data.draftOrderCreate;
    const userErrors = payload?.userErrors ?? [];
    const draft = payload?.draftOrder;
    if (userErrors.length > 0 || !draft) {
      return {
        error:
          userErrors.map((error) => error.message).join(" ") || UNAVAILABLE,
      };
    }

    const taxByTitle = new Map<string, number>();
    for (const line of draft.taxLines) {
      taxByTitle.set(
        line.title,
        (taxByTitle.get(line.title) ?? 0) + cents(line.priceSet),
      );
    }
    return {
      child: {
        id: draft.id,
        name: draft.name,
        currencyCode: draft.currencyCode,
        shipping: cents(draft.totalShippingPriceSet),
        tax: cents(draft.totalTaxSet),
        total: cents(draft.totalPriceSet),
        shippingTitle: draft.shippingLine?.title || recipient.shippingMethod,
        taxLines: [...taxByTitle.entries()].map(([title, amount]) => ({
          title,
          amount,
        })),
        lines: draft.lineItems.nodes.map((line) => ({
          title:
            line.variantTitle && line.variantTitle !== "Default Title"
              ? `${line.title} - ${line.variantTitle}`
              : line.title,
          quantity: line.quantity,
          unit: cents(line.originalUnitPriceSet),
        })),
      },
    };
  }

  const results = await mapLimit(recipients, 5, createChild);
  const children: Child[] = [];
  let failure: { message: string; recipient: number } | null = null;
  for (const [index, result] of results.entries()) {
    if ("child" in result) {
      children.push(result.child);
    } else if (!failure) {
      failure = { message: result.error, recipient: index };
    }
  }
  const createdIds = children.map((child) => child.id);
  if (failure) {
    // All or nothing: a shopper is never sent to pay for some recipients.
    await deleteDrafts(env, createdIds);
    return { error: failure };
  }

  // The parent: every recipient's gifts at their listed price, then
  // shipping and tax as their own lines, then one discount for the
  // difference - so its total is exactly the sum of the children.
  const currencyCode = children[0]?.currencyCode ?? "USD";
  const lineItems: Record<string, unknown>[] = [];
  let listed = 0;
  let shipping = 0;
  let tax = 0;
  let expected = 0;
  const shippingNotes: Array<{ key: string; value: string }> = [];
  const taxTotals = new Map<string, number>();

  children.forEach((child, index) => {
    const recipient = recipients[index];
    for (const line of child.lines) {
      listed += line.unit * line.quantity;
      lineItems.push({
        title: line.title,
        quantity: line.quantity,
        originalUnitPriceWithCurrency: {
          amount: decimal(line.unit),
          currencyCode,
        },
        requiresShipping: false,
        taxable: false,
        customAttributes: [
          { key: "Ship to", value: shipToLabel(recipient.address) },
          { key: "_mr_child", value: child.id },
          { key: "_mr_index", value: String(index) },
        ],
      });
    }
    shipping += child.shipping;
    tax += child.tax;
    expected += child.total;
    shippingNotes.push({
      key: `${index + 1}. ${recipientName(recipient.address)}`,
      value: `${child.shippingTitle} - ${dollars(child.shipping)}`,
    });
    for (const line of child.taxLines) {
      taxTotals.set(line.title, (taxTotals.get(line.title) ?? 0) + line.amount);
    }
  });

  if (shipping > 0) {
    lineItems.push({
      title: "Shipping",
      quantity: 1,
      originalUnitPriceWithCurrency: {
        amount: decimal(shipping),
        currencyCode,
      },
      requiresShipping: false,
      taxable: false,
      customAttributes: [
        ...shippingNotes,
        { key: "_mr_kind", value: "shipping" },
      ],
    });
  }
  if (tax > 0) {
    lineItems.push({
      title: "Tax",
      quantity: 1,
      originalUnitPriceWithCurrency: { amount: decimal(tax), currencyCode },
      requiresShipping: false,
      taxable: false,
      customAttributes: [
        ...[...taxTotals.entries()].map(([title, amount]) => ({
          key: title,
          value: dollars(amount),
        })),
        { key: "_mr_kind", value: "tax" },
      ],
    });
  }

  const discount = listed + shipping + tax - expected;
  if (discount < 0) {
    // The children cost more than their listed prices add up to. There is no
    // honest way to show that as a line, so stop rather than guess.
    console.error("Multi-recipient checkout: children exceed listed prices", {
      listed,
      shipping,
      tax,
      expected,
    });
    await deleteDrafts(env, createdIds);
    return { error: { message: UNAVAILABLE } };
  }

  const parent = await adminGraphql<DraftCreateResult>(env, DRAFT_CREATE, {
    input: {
      lineItems,
      // The tax is already in the Tax line, worked out per address. Shopify
      // must not add its own on top for whatever address is on the payment.
      taxExempt: true,
      // Codes and automatic discounts were applied recipient by recipient;
      // letting either apply again here would discount the order twice.
      acceptAutomaticDiscounts: false,
      allowDiscountCodesInCheckout: false,
      tags: [PARENT_TAG, ...extraTags],
      customAttributes: [
        { key: "_mr_children", value: String(children.length) },
      ],
      ...(discount > 0
        ? {
            appliedDiscount: {
              value: Number(decimal(discount)),
              valueType: "FIXED_AMOUNT",
              title: discountCodes.join(", ") || "Discounts",
            },
          }
        : {}),
      ...(customerId ? { purchasingEntity: { customerId } } : {}),
    },
  });

  const parentDraft =
    parent.ok === false ? null : parent.data.draftOrderCreate?.draftOrder;
  if (!parentDraft?.invoiceUrl) {
    console.error(
      "Multi-recipient checkout: could not create the parent draft:",
      parent.ok === false
        ? parent.detail
        : JSON.stringify(parent.data.draftOrderCreate?.userErrors),
    );
    await deleteDrafts(env, createdIds);
    return { error: { message: UNAVAILABLE } };
  }

  // The last line of defence: never send anyone to pay an amount that is
  // not exactly what their recipients' orders come to.
  const parentTotal = cents(parentDraft.totalPriceSet);
  if (parentTotal !== expected) {
    console.error("Multi-recipient checkout: parent total mismatch", {
      parentTotal,
      expected,
    });
    await deleteDrafts(env, [...createdIds, parentDraft.id]);
    return { error: { message: UNAVAILABLE } };
  }

  return { invoiceUrl: parentDraft.invoiceUrl, parentId: parentDraft.id };
}
