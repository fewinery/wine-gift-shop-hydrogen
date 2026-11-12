import { adminGraphql } from "~/.server/admin-api";
import {
  ATTENTION_TAG,
  FROM_TAG_PREFIX,
  PARENT_TAG,
  REVIEW_TAG,
  SPLIT_DONE_TAG,
} from "~/utils/multi-recipient";

/**
 * Runs after a multi-recipient parent order has been paid. It turns each
 * recipient's draft into a real order, then cancels the parent - which was
 * only ever a way to take one payment - without refunding it.
 *
 * Everything here can be run again safely. A draft can only ever become one
 * order, so a second run finds the first run's orders rather than making
 * more; a run that is cut short is simply finished by the next one. The
 * parent is cancelled last, and only once every recipient's order exists.
 */

// Not tagged #graphql: codegen checks tagged queries under app/ against the
// Storefront schema, and these are for the Admin API.
const PARENT_QUERY = `
  query multiRecipientParent($id: ID!) {
    order(id: $id) {
      id
      name
      tags
      note
      email
      cancelledAt
      displayFinancialStatus
      customer { id }
      billingAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        provinceCode
        countryCodeV2
        zip
        phone
      }
      totalPriceSet { shopMoney { amount } }
      lineItems(first: 250) {
        nodes { customAttributes { key value } }
      }
    }
  }
`;

const CHILD_ORDER_FIELDS = `
  id
  name
  email
  customer { id }
  totalPriceSet { shopMoney { amount } }
`;

const CHILD_QUERY = `
  query multiRecipientChild($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      tags
      order { ${CHILD_ORDER_FIELDS} }
    }
  }
`;

const CHILD_UPDATE = `
  mutation multiRecipientChildUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder { id }
      userErrors { field message }
    }
  }
`;

const CHILD_COMPLETE = `
  mutation multiRecipientChildComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      draftOrder {
        id
        order { ${CHILD_ORDER_FIELDS} }
      }
      userErrors { field message }
    }
  }
`;

const ORDER_UPDATE = `
  mutation multiRecipientOrderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order { id }
      userErrors { field message }
    }
  }
`;

const CUSTOMER_SET = `
  mutation multiRecipientCustomerSet($orderId: ID!, $customerId: ID!) {
    orderCustomerSet(orderId: $orderId, customerId: $customerId) {
      order { id }
      userErrors { field message }
    }
  }
`;

const TAGS_ADD = `
  mutation multiRecipientTagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

// refundMethod is spelled out as "do not refund". The parent's payment is
// what pays for the recipients' orders; cancelling must never send it back.
const PARENT_CANCEL = `
  mutation multiRecipientParentCancel($orderId: ID!, $staffNote: String) {
    orderCancel(
      orderId: $orderId
      reason: OTHER
      restock: false
      notifyCustomer: false
      refundMethod: { originalPaymentMethodsRefund: false }
      staffNote: $staffNote
    ) {
      job { id }
      orderCancelUserErrors { field message code }
    }
  }
`;

const PARENT_CLOSE = `
  mutation multiRecipientParentClose($id: ID!) {
    orderClose(input: { id: $id }) {
      order { id }
      userErrors { field message }
    }
  }
`;

export type SplitOutcome =
  /** Every recipient has an order and the parent is cancelled. */
  | { status: "done"; detail: string }
  /** Not a paid multi-recipient parent; nothing to do. */
  | { status: "ignored"; detail: string }
  /** Unfinished for a reason that should pass; call again. */
  | { status: "retry"; detail: string }
  /** Something a person has to look at; calling again will not fix it. */
  | { status: "attention"; detail: string };

interface Money {
  shopMoney?: { amount?: string | null } | null;
}

interface ChildOrder {
  id: string;
  name: string;
  email?: string | null;
  customer?: { id: string } | null;
  totalPriceSet: Money;
}

interface Parent {
  id: string;
  name: string;
  tags: string[];
  note?: string | null;
  email?: string | null;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  customer?: { id: string } | null;
  billingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    provinceCode?: string | null;
    countryCodeV2?: string | null;
    zip?: string | null;
    phone?: string | null;
  } | null;
  totalPriceSet: Money;
  lineItems: {
    nodes: Array<{
      customAttributes: Array<{ key: string; value?: string | null }>;
    }>;
  };
}

type ChildResult =
  | { state: "done"; name: string; total: number }
  | { state: "retry"; detail: string }
  | { state: "attention"; detail: string };

// Leaves room inside the 30 seconds the caller waits for an answer. Anything
// not reached is picked up when it calls again.
const TIME_BUDGET_MS = 20_000;

function cents(money: Money | null | undefined) {
  return Math.round((Number(money?.shopMoney?.amount) || 0) * 100);
}

function messages(errors: Array<{ message: string }> | null | undefined) {
  return (errors ?? []).map((error) => error.message).join(" ");
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

export async function splitParentOrder({
  env,
  orderId,
}: {
  env: Env;
  orderId: string;
}): Promise<SplitOutcome> {
  const deadline = Date.now() + TIME_BUDGET_MS;

  const loaded = await adminGraphql<{ order?: Parent | null }>(
    env,
    PARENT_QUERY,
    { id: orderId },
  );
  if (loaded.ok === false) {
    console.error(
      "Multi-recipient split: could not load the order:",
      loaded.detail,
    );
    return { status: "retry", detail: "The order could not be loaded." };
  }
  const parent = loaded.data.order;
  if (!parent) {
    return { status: "ignored", detail: "No such order." };
  }
  if (!parent.tags.includes(PARENT_TAG)) {
    return { status: "ignored", detail: "Not a multi-recipient order." };
  }

  const childIds: string[] = [];
  for (const line of parent.lineItems.nodes) {
    for (const attribute of line.customAttributes) {
      if (
        attribute.key === "_mr_child" &&
        attribute.value &&
        !childIds.includes(attribute.value)
      ) {
        childIds.push(attribute.value);
      }
    }
  }
  if (childIds.length === 0) {
    return {
      status: "attention",
      detail: `${parent.name} carries no recipients.`,
    };
  }

  const finished = parent.tags.includes(SPLIT_DONE_TAG);
  if (!finished) {
    // Only money that has actually arrived is turned into orders to ship.
    const paid = parent.displayFinancialStatus === "PAID";
    if (!paid) {
      const waiting = ["PENDING", "AUTHORIZED", "PARTIALLY_PAID"].includes(
        parent.displayFinancialStatus ?? "",
      );
      return waiting && !parent.cancelledAt
        ? { status: "retry", detail: `${parent.name} is not paid yet.` }
        : {
            status: "ignored",
            detail: `${parent.name} is ${parent.displayFinancialStatus}; nothing was split.`,
          };
    }
  }

  const fromTag = `${FROM_TAG_PREFIX}${parent.name}`;
  const billing = parent.billingAddress
    ? {
        firstName: parent.billingAddress.firstName,
        lastName: parent.billingAddress.lastName,
        company: parent.billingAddress.company,
        address1: parent.billingAddress.address1,
        address2: parent.billingAddress.address2,
        city: parent.billingAddress.city,
        provinceCode: parent.billingAddress.provinceCode,
        countryCode: parent.billingAddress.countryCodeV2,
        zip: parent.billingAddress.zip,
        phone: parent.billingAddress.phone,
      }
    : null;

  async function settleChild(draftId: string): Promise<ChildResult> {
    if (Date.now() > deadline) {
      return { state: "retry", detail: "Out of time; more to do." };
    }
    const found = await adminGraphql<{
      draftOrder?: {
        id: string;
        status: string;
        tags: string[];
        order?: ChildOrder | null;
      } | null;
    }>(env, CHILD_QUERY, { id: draftId });
    if (found.ok === false) {
      return { state: "retry", detail: found.detail };
    }
    const draft = found.data.draftOrder;
    if (!draft) {
      return {
        state: "attention",
        detail: `A recipient's draft (${draftId}) no longer exists.`,
      };
    }

    let order = draft.order ?? null;
    if (!order) {
      // The buyer's billing address and the link back to the parent go on
      // before the draft becomes an order. If this fails the order is still
      // made - a missing billing address must not hold up a shipment.
      await adminGraphql(env, CHILD_UPDATE, {
        id: draftId,
        input: {
          tags: [...new Set([...draft.tags, fromTag])],
          ...(billing ? { billingAddress: billing } : {}),
        },
      });

      const completed = await adminGraphql<{
        draftOrderComplete?: {
          draftOrder?: { order?: ChildOrder | null } | null;
          userErrors?: Array<{ message: string }> | null;
        } | null;
      }>(env, CHILD_COMPLETE, { id: draftId });
      if (completed.ok === false) {
        return { state: "retry", detail: completed.detail };
      }
      const problem = messages(completed.data.draftOrderComplete?.userErrors);
      if (problem) {
        return { state: "attention", detail: problem };
      }
      order = completed.data.draftOrderComplete?.draftOrder?.order ?? null;
      if (!order) {
        return { state: "retry", detail: "The order is not available yet." };
      }
    }

    // Idempotent finishing touches, repeated on every run until they hold:
    // the link back to the parent, and the buyer as the order's contact so
    // shipping updates reach them.
    const tagged = await adminGraphql(env, TAGS_ADD, {
      id: order.id,
      tags: [fromTag],
    });
    if (tagged.ok === false) {
      return { state: "retry", detail: tagged.detail };
    }
    if (!order.email && parent.email) {
      const updated = await adminGraphql(env, ORDER_UPDATE, {
        input: { id: order.id, email: parent.email },
      });
      if (updated.ok === false) {
        return { state: "retry", detail: updated.detail };
      }
    }
    if (!order.customer?.id && parent.customer?.id) {
      const set = await adminGraphql(env, CUSTOMER_SET, {
        orderId: order.id,
        customerId: parent.customer.id,
      });
      if (set.ok === false) {
        return { state: "retry", detail: set.detail };
      }
    }
    return {
      state: "done",
      name: order.name,
      total: cents(order.totalPriceSet),
    };
  }

  const results = await mapLimit(childIds, 4, settleChild);

  const blocked = results.filter((result) => result.state === "attention");
  if (blocked.length > 0) {
    const detail = blocked
      .map((result) => (result.state === "attention" ? result.detail : ""))
      .join(" | ");
    console.error(
      `Multi-recipient split: ${parent.name} needs attention:`,
      detail,
    );
    // Flag it where someone will see it. The parent stays paid and open.
    await adminGraphql(env, TAGS_ADD, { id: parent.id, tags: [ATTENTION_TAG] });
    return { status: "attention", detail: `${parent.name}: ${detail}` };
  }

  const unfinished = results.filter((result) => result.state === "retry");
  if (unfinished.length > 0) {
    return {
      status: "retry",
      detail: `${parent.name}: ${unfinished.length} of ${childIds.length} recipients still to do.`,
    };
  }

  const names: string[] = [];
  let childrenTotal = 0;
  for (const result of results) {
    if (result.state === "done") {
      names.push(result.name);
      childrenTotal += result.total;
    }
  }

  // Every recipient has an order. Record that on the parent first, so a
  // repeat call can never start over.
  const tags = [SPLIT_DONE_TAG];
  if (childrenTotal !== cents(parent.totalPriceSet)) {
    // The orders do not add up to what was paid. They are still correct
    // orders to ship; someone should look at the difference.
    console.error(`Multi-recipient split: ${parent.name} total mismatch`, {
      paid: cents(parent.totalPriceSet),
      childrenTotal,
    });
    tags.push(REVIEW_TAG);
  }
  const marked = await adminGraphql(env, TAGS_ADD, { id: parent.id, tags });
  if (marked.ok === false) {
    return { status: "retry", detail: marked.detail };
  }

  const summary = `Sent as ${names.join(", ")}`;
  if (!(parent.note ?? "").includes(summary)) {
    await adminGraphql(env, ORDER_UPDATE, {
      input: {
        id: parent.id,
        note: [parent.note, summary].filter(Boolean).join("\n"),
      },
    });
  }

  if (!parent.cancelledAt) {
    const cancelled = await adminGraphql<{
      orderCancel?: {
        orderCancelUserErrors?: Array<{ message: string }> | null;
      } | null;
    }>(env, PARENT_CANCEL, {
      orderId: parent.id,
      staffNote: `Multi-recipient order. ${summary}`.slice(0, 255),
    });
    if (cancelled.ok === false) {
      return { status: "retry", detail: cancelled.detail };
    }
    const problem = messages(cancelled.data.orderCancel?.orderCancelUserErrors);
    if (problem) {
      // The recipients' orders exist; only the tidy-up failed. Trying again
      // is harmless, and a parent left open would look like work to do.
      return { status: "retry", detail: `${parent.name}: ${problem}` };
    }
  }
  // Archive it, as cancelled multi-address parents are today. Best effort.
  await adminGraphql(env, PARENT_CLOSE, { id: parent.id });

  return { status: "done", detail: `${parent.name}: ${summary}` };
}
