/**
 * Shared shapes and rules for the multi-recipient cart: one cart, several
 * delivery addresses, one payment.
 *
 * The cart is treated as a menu. What is bought is whatever the recipients
 * have been given, so a quantity lives on a recipient and never on the cart
 * line - one bottle in the cart can be sent to five people.
 *
 * Nothing here talks to Shopify. It is plain data and arithmetic so the page
 * and, later, the server that prices and creates the orders can agree on one
 * definition of "a complete recipient".
 */

/** A cart line the shopper can hand to a recipient. */
export interface GiftItem {
  /** The cart line id. Two lines of the same variant can differ by their
   * attributes (a logo, a wood card), so the line is the key, not the variant. */
  lineId: string;
  variantId: string;
  title: string;
  /** Empty for products with a single variant. */
  variantTitle: string;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  unitPrice: number;
  currencyCode: string;
}

export interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  /** Two-letter state code. */
  state: string;
  zip: string;
  email: string;
  phone: string;
  giftTo: string;
  giftFrom: string;
  giftMessage: string;
  /** The shipping method chosen for this address, by its name. Empty means
   * "the cheapest one offered", which is what a recipient starts on. */
  shippingMethod: string;
  /** cart line id -> how many of it this recipient gets. */
  items: Record<string, number>;
}

/** An address from the shopper's account, already narrowed to what we use. */
export interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

/**
 * The same limits the product page puts on a gift message. A 3D wood card is
 * printed from these fields, so a longer message here would simply not fit.
 */
export const GIFT_TO_MAX = 20;
export const GIFT_FROM_MAX = 20;
export const GIFT_MESSAGE_MAX = 100;

/** A ceiling per item per recipient, so a slipped finger is not 900 bottles. */
export const MAX_PER_ITEM = 99;

export const US_STATES: Array<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

interface CartLineLike {
  id?: string | null;
  cost?: {
    amountPerQuantity?: {
      amount?: string | null;
      currencyCode?: string | null;
    } | null;
  } | null;
  merchandise?: {
    id?: string | null;
    title?: string | null;
    image?: GiftItem["image"];
    product?: { title?: string | null } | null;
  } | null;
}

/**
 * Turns the cart's lines into the items a recipient can be given. Read
 * structurally, like the cart summary does: codegen cannot currently run in
 * this repo, so the generated cart type lags the real fragment.
 */
export function toGiftItems(cart: unknown): GiftItem[] {
  const nodes = ((cart as { lines?: { nodes?: CartLineLike[] | null } | null })
    ?.lines?.nodes ?? []) as CartLineLike[];

  const items: GiftItem[] = [];
  for (const line of nodes) {
    const merchandise = line?.merchandise;
    if (!(line?.id && merchandise?.id)) {
      continue;
    }
    const variantTitle = merchandise.title ?? "";
    items.push({
      lineId: line.id,
      variantId: merchandise.id,
      title: merchandise.product?.title ?? variantTitle,
      // Shopify names the only variant of a simple product "Default Title".
      variantTitle: variantTitle === "Default Title" ? "" : variantTitle,
      image: merchandise.image?.url ? merchandise.image : null,
      unitPrice: Number(line.cost?.amountPerQuantity?.amount) || 0,
      currencyCode: line.cost?.amountPerQuantity?.currencyCode || "USD",
    });
  }
  return items;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A blank recipient. When the cart holds exactly one thing there is no choice
 * to make, so the recipient starts with one of it; with several, they start
 * empty and the shopper picks.
 */
export function newRecipient(items: GiftItem[]): Recipient {
  const starting: Record<string, number> = {};
  if (items.length === 1) {
    starting[items[0].lineId] = 1;
  }
  return {
    id: createId(),
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    phone: "",
    giftTo: "",
    giftFrom: "",
    giftMessage: "",
    shippingMethod: "",
    items: starting,
  };
}

export function recipientFromAddress(
  address: SavedAddress,
  items: GiftItem[],
): Recipient {
  return {
    ...newRecipient(items),
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state: address.state,
    zip: address.zip,
    phone: address.phone,
  };
}

/** A copy for "same again, different person": the gifts and message carry
 * over, the name and address do not. */
export function duplicateRecipient(source: Recipient): Recipient {
  return {
    ...source,
    id: createId(),
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    phone: "",
    giftTo: "",
    // Methods and prices belong to an address; a new one starts afresh.
    shippingMethod: "",
    items: { ...source.items },
  };
}

/** What this recipient gets, limited to lines still in the cart. A line
 * removed from the cart drops out here without the stored data being touched. */
export function recipientItems(recipient: Recipient, items: GiftItem[]) {
  const assigned: Array<{ item: GiftItem; quantity: number }> = [];
  for (const item of items) {
    const quantity = recipient.items[item.lineId] ?? 0;
    if (quantity > 0) {
      assigned.push({ item, quantity });
    }
  }
  return assigned;
}

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * What still stands between this recipient and checkout, as labels a shopper
 * can read. An empty list means complete.
 */
export function missingDetails(recipient: Recipient, items: GiftItem[]) {
  const missing: string[] = [];
  if (!recipient.firstName.trim()) {
    missing.push("First name");
  }
  if (!recipient.lastName.trim()) {
    missing.push("Last name");
  }
  if (!recipient.address1.trim()) {
    missing.push("Address");
  }
  if (!recipient.city.trim()) {
    missing.push("City");
  }
  if (!recipient.state) {
    missing.push("State");
  }
  if (!ZIP_PATTERN.test(recipient.zip.trim())) {
    missing.push("ZIP code");
  }
  if (recipient.email.trim() && !EMAIL_PATTERN.test(recipient.email.trim())) {
    missing.push("A valid email");
  }
  if (recipientItems(recipient, items).length === 0) {
    missing.push("At least one gift");
  }
  return missing;
}

export interface OrderLine {
  item: GiftItem;
  quantity: number;
  /** How many recipients are getting this item. */
  recipientCount: number;
  total: number;
}

/** The order as it stands: every item with its quantity across all recipients. */
export function summarize(recipients: Recipient[], items: GiftItem[]) {
  const lines: OrderLine[] = [];
  for (const item of items) {
    let quantity = 0;
    let recipientCount = 0;
    for (const recipient of recipients) {
      const assigned = recipient.items[item.lineId] ?? 0;
      if (assigned > 0) {
        quantity += assigned;
        recipientCount += 1;
      }
    }
    lines.push({
      item,
      quantity,
      recipientCount,
      total: quantity * item.unitPrice,
    });
  }
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  return {
    lines,
    subtotal,
    currencyCode: items[0]?.currencyCode ?? "USD",
  };
}

/** What the page sends to have one recipient priced. */
export interface QuoteRequest {
  address: {
    firstName: string;
    lastName: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  items: Array<{ variantId: string; quantity: number }>;
  shippingMethod: string;
}

/** Shopify's own figures for one recipient: their gifts, to their address. */
export interface RecipientQuote {
  currencyCode: string;
  /** The gifts before any discount. */
  merchandise: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  taxLines: Array<{ title: string; amount: number }>;
  /** Every method offered for this address, cheapest first. */
  rates: Array<{ title: string; amount: number }>;
  /** The method these figures were calculated with. */
  shippingMethod: string;
  /** Things Shopify wants the shopper to know, such as a code that did not
   * apply to this recipient's gifts. */
  notices: string[];
}

export type QuoteErrorCode = "no_rates" | "invalid" | "unavailable";

export type QuoteResponse =
  | { quote: RecipientQuote }
  | { error: { code: QuoteErrorCode; message: string } };

export type QuoteState =
  // A recipient being re-priced keeps the last figures on screen, so the
  // numbers do not blink out on every keystroke.
  | { status: "loading"; quote?: RecipientQuote }
  | { status: "ready"; quote: RecipientQuote }
  | { status: "error"; code: QuoteErrorCode; message: string };

/**
 * The pricing request for a recipient, or null while they are incomplete -
 * there is no point asking Shopify to price half an address.
 *
 * Two cart lines of the same variant are one line to Shopify's pricing, so
 * their quantities are added together here.
 */
export function buildQuoteRequest(
  recipient: Recipient,
  items: GiftItem[],
): QuoteRequest | null {
  if (missingDetails(recipient, items).length > 0) {
    return null;
  }
  const quantities = new Map<string, number>();
  for (const { item, quantity } of recipientItems(recipient, items)) {
    quantities.set(
      item.variantId,
      (quantities.get(item.variantId) ?? 0) + quantity,
    );
  }
  return {
    address: {
      firstName: recipient.firstName.trim(),
      lastName: recipient.lastName.trim(),
      company: recipient.company.trim(),
      address1: recipient.address1.trim(),
      address2: recipient.address2.trim(),
      city: recipient.city.trim(),
      state: recipient.state,
      zip: recipient.zip.trim(),
      phone: recipient.phone.trim(),
    },
    items: [...quantities.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([variantId, quantity]) => ({ variantId, quantity })),
    shippingMethod: recipient.shippingMethod,
  };
}

/**
 * The whole order's figures, available only once every recipient has been
 * priced. Until then a total would be a number that is about to change, so
 * this returns null and the page says the figures are on their way.
 */
export function totalQuotes(
  recipients: Recipient[],
  quotes: Record<string, QuoteState>,
) {
  if (recipients.length === 0) {
    return null;
  }
  const totals = { merchandise: 0, discount: 0, shipping: 0, tax: 0, total: 0 };
  for (const recipient of recipients) {
    const state = quotes[recipient.id];
    if (state?.status !== "ready") {
      return null;
    }
    totals.merchandise += state.quote.merchandise;
    totals.discount += state.quote.discount;
    totals.shipping += state.quote.shipping;
    totals.tax += state.quote.tax;
    totals.total += state.quote.total;
  }
  return totals;
}

const STORAGE_PREFIX = "multi-recipient:v1:";

/**
 * Recipients survive a refresh or a trip back to the shop, but only in this
 * browser tab's session and only for this cart. Typing ten addresses and
 * losing them to a reload is the failure this exists to prevent.
 *
 * Storage can be unavailable (private windows, blocked site data), so every
 * access is guarded and the page simply starts empty when it is.
 */
export function loadRecipients(cartId: string): Recipient[] {
  if (!cartId) {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + cartId);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Fill anything a stored record lacks, so a field added later never
    // arrives undefined in a recipient saved before it existed.
    return parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        ...newRecipient([]),
        ...(entry as Partial<Recipient>),
        items: { ...((entry as Partial<Recipient>).items ?? {}) },
      }));
  } catch {
    return [];
  }
}

export function saveRecipients(cartId: string, recipients: Recipient[]) {
  if (!cartId) {
    return;
  }
  try {
    window.sessionStorage.setItem(
      STORAGE_PREFIX + cartId,
      JSON.stringify(recipients),
    );
  } catch {
    // Nothing to do: the page works without it, it just will not survive a
    // reload.
  }
}

/** The most recipients one order can have. Every recipient is a real order
 * to create, and the request that creates them has a time limit. */
export const MAX_RECIPIENTS = 25;

/** Order tags. The parent is the single order the shopper pays; each child
 * is the order one address is fulfilled from. */
export const PARENT_TAG = "Multi_rec_parent_order";
export const CHILD_TAG = "Multi_rec_child_order";
/** Added to both when the storefront is in test mode, so a warehouse has one
 * thing to ignore. */
export const TEST_TAG = "Multi_rec_test";
/** Followed by the parent's order name on every child, so one search finds
 * every order from one purchase. */
export const FROM_TAG_PREFIX = "Multi_rec_from_";
/** Set on the parent once every child exists. */
export const SPLIT_DONE_TAG = "Multi_rec_split_done";
/** Set on the parent when a child could not be created and a person has to
 * look. */
export const ATTENTION_TAG = "Multi_rec_needs_attention";
/** Set on the parent when the children do not add up to what was paid. */
export const REVIEW_TAG = "Multi_rec_review";
/** Followed by the storefront's own address on the parent and every child.
 * These orders are created by an app, so Shopify's Channel column names the
 * app, not the brand; this tag is how they are filtered by brand. */
export const SITE_TAG_PREFIX = "Multi_rec_site_";
/** Shopify refuses an order tag longer than this. */
const TAG_MAX_LENGTH = 40;

/** The brand tag for the address a shopper is buying from, or "" if there
 * is no address to name. A long address is cut to fit, never rejected. */
export function siteTag(host: string): string {
  const name = (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
  return name ? `${SITE_TAG_PREFIX}${name}`.slice(0, TAG_MAX_LENGTH) : "";
}

/** One recipient as the page hands it over to be turned into an order. */
export interface CheckoutRecipient {
  address: QuoteRequest["address"];
  /** The recipient's own email, kept for reference; notifications go to
   * the buyer. */
  email: string;
  /** Cart lines rather than variants, so each line keeps what was chosen
   * for it on the product page - a logo, a wood card, a package. */
  lines: Array<{ lineId: string; quantity: number }>;
  shippingMethod: string;
  gift: { to: string; from: string; message: string };
}

export interface CheckoutRequest {
  recipients: CheckoutRecipient[];
}

export type CheckoutResponse =
  | { invoiceUrl: string }
  // recipient is the position of the one at fault, when there is one.
  | { error: { message: string; recipient?: number } };

/**
 * What to send to start payment, or null if the order is not ready for it:
 * every recipient has to be complete and priced, and there cannot be more of
 * them than one order can hold.
 *
 * Each recipient goes with the shipping method their price was worked out
 * for, so what is charged is what was on screen.
 */
export function buildCheckoutRequest(
  recipients: Recipient[],
  items: GiftItem[],
  quotes: Record<string, QuoteState>,
): CheckoutRequest | null {
  if (recipients.length === 0 || recipients.length > MAX_RECIPIENTS) {
    return null;
  }
  const out: CheckoutRecipient[] = [];
  for (const recipient of recipients) {
    const state = quotes[recipient.id];
    const priced = buildQuoteRequest(recipient, items);
    if (!priced || state?.status !== "ready") {
      return null;
    }
    out.push({
      address: priced.address,
      email: recipient.email.trim(),
      lines: recipientItems(recipient, items).map(({ item, quantity }) => ({
        lineId: item.lineId,
        quantity,
      })),
      shippingMethod: state.quote.shippingMethod,
      gift: {
        to: recipient.giftTo.trim(),
        from: recipient.giftFrom.trim(),
        message: recipient.giftMessage.trim(),
      },
    });
  }
  return { recipients: out };
}
