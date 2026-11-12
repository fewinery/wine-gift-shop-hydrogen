import { CacheNone, generateCacheControlHeader } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useMemo, useState } from "react";
import {
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
  redirect,
  useLoaderData,
} from "react-router";
import { hasAdminCredentials } from "~/.server/admin-api";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import {
  type AddOn,
  CartOverview,
} from "~/components/multi-recipient/cart-overview";
import {
  OrderSummary,
  SavedAddresses,
} from "~/components/multi-recipient/order-summary";
import { RecipientCard } from "~/components/multi-recipient/recipient-card";
import { Section } from "~/components/section";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import { useRecipientQuotes } from "~/hooks/use-recipient-quotes";
import { loadSavedAddresses } from "~/routes/account/address/saved-addresses";
import { routeHeaders } from "~/utils/cache";
import { GIFT_NOTE_TEXT } from "~/utils/gift-note";
import {
  buildCheckoutRequest,
  type CheckoutResponse,
  duplicateRecipient,
  loadRecipients,
  MAX_RECIPIENTS,
  missingDetails,
  newRecipient,
  type Recipient,
  recipientFromAddress,
  type SavedAddress,
  saveRecipients,
  summarize,
  toGiftItems,
  totalQuotes,
} from "~/utils/multi-recipient";

export const headers = routeHeaders;

export const meta: MetaFunction = () => [
  { title: "Send to multiple recipients" },
];

/**
 * The multi-recipient cart: one cart, several addresses, one payment.
 *
 * Opt-in per storefront through Theme Settings -> Cart. With the setting off
 * this route sends visitors to the ordinary cart, so a storefront that has
 * not turned it on has no page here at all.
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const { cart, storefront, weaverse } = context;
  const [cartData, theme, saved] = await Promise.all([
    cart.get(),
    weaverse.loadThemeSettings(),
    loadSavedAddresses(context),
  ]);
  // loadThemeSettings returns { theme, ... }; the saved values live in .theme.
  const settings = (theme?.theme ?? {}) as {
    enableMultiRecipient?: boolean;
    multiRecipientAddOnsCollection?: string;
  };

  // Switched on, and set up: without Admin API variables the page could
  // neither price a recipient nor take payment.
  if (
    settings.enableMultiRecipient !== true ||
    !hasAdminCredentials(context.env)
  ) {
    throw redirect(`${storefront.i18n.pathPrefix ?? ""}/cart`);
  }

  // A failed add-ons lookup hides the row instead of taking the page down.
  const addOns = await loadAddOns(
    storefront,
    settings.multiRecipientAddOnsCollection,
  ).catch(() => [] as AddOn[]);

  return data(
    {
      cart: cartData,
      isLoggedIn: saved.isLoggedIn,
      savedAddresses: saved.addresses,
      addOns,
    },
    // The page can carry a shopper's saved addresses, so it is never cached.
    { headers: { "Cache-Control": generateCacheControlHeader(CacheNone()) } },
  );
}

interface AddOnNode {
  id: string;
  title: string;
  handle: string;
  featuredImage?: AddOn["image"];
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
  } | null;
}

/**
 * Products offered as extras, from the collection named in Theme Settings.
 * A collection rather than "best sellers": brands share one Shopify catalog,
 * and a curated collection is the only way to keep the row on-brand and
 * limited to things that can be added without choosing options first.
 */
async function loadAddOns(
  storefront: LoaderFunctionArgs["context"]["storefront"],
  collection: string | undefined,
): Promise<AddOn[]> {
  // Accept the handle however it is pasted: "gift-add-ons",
  // "/collections/gift-add-ons" or the full URL.
  const handle = collection
    ?.trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .split("/")
    .pop();
  if (!handle) {
    return [];
  }
  const result = (await storefront.query(MULTI_RECIPIENT_ADD_ONS_QUERY, {
    variables: {
      handle,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  })) as { collection?: { products?: { nodes?: AddOnNode[] } } | null };

  const addOns: AddOn[] = [];
  for (const node of result?.collection?.products?.nodes ?? []) {
    const variant = node.selectedOrFirstAvailableVariant;
    if (variant?.availableForSale) {
      addOns.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        image: node.featuredImage?.url ? node.featuredImage : null,
        variantId: variant.id,
        price: variant.price,
      });
    }
  }
  return addOns;
}

const MULTI_RECIPIENT_ADD_ONS_QUERY = `#graphql
  query multiRecipientAddOns(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 12) {
        nodes {
          id
          title
          handle
          featuredImage {
            url
            altText
            width
            height
          }
          selectedOrFirstAvailableVariant(
            selectedOptions: []
            ignoreUnknownOptions: true
            caseInsensitiveMatch: true
          ) {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;

/** Nobody has typed a name or an address into this recipient yet. */
function isUntouched(recipient: Recipient) {
  return !(
    recipient.firstName ||
    recipient.lastName ||
    recipient.address1 ||
    recipient.city ||
    recipient.zip
  );
}

const CARD_CLASS = "border border-neutral-300 bg-white p-5";
const HEADING_CLASS =
  "font-bold text-neutral-900 text-sm uppercase tracking-wide";

export default function RecipientsRoute() {
  const { cart, isLoggedIn, savedAddresses, addOns } =
    useLoaderData<typeof loader>();
  const { multiRecipientAddOnsHeading } = useThemeSettings();

  const cartId = cart?.id ?? "";
  const items = useMemo(() => toGiftItems(cart), [cart]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [checkout, setCheckout] = useState<{
    status: "idle" | "working" | "error";
    message?: string;
  }>({ status: "idle" });
  const checkoutEndpoint = usePrefixPathWithLocale(
    "/api/multi-recipient/checkout",
  );

  // Restore once, in the browser, after the first render: the server has no
  // access to the tab's storage, and reading it during render would make the
  // two disagree about what is on the page.
  useEffect(() => {
    if (restored) {
      return;
    }
    const stored = loadRecipients(cartId);
    if (stored.length > 0) {
      setRecipients(stored);
      // Coming back to a saved list, open the first recipient that still
      // needs something, so the next thing to do is already on screen.
      setOpenId(
        stored.find((recipient) => missingDetails(recipient, items).length > 0)
          ?.id ?? null,
      );
    } else {
      const first = newRecipient(items);
      setRecipients([first]);
      setOpenId(first.id);
    }
    setRestored(true);
  }, [restored, cartId, items]);

  useEffect(() => {
    if (restored) {
      saveRecipients(cartId, recipients);
    }
  }, [restored, cartId, recipients]);

  const summary = summarize(recipients, items);
  // Every code on the cart, including ones the cart marks as not applicable:
  // the cart judges them against its own quantities, and what is bought here
  // is what the recipients have been given.
  const discountCodes = useMemo(
    () =>
      (
        (cart as { discountCodes?: Array<{ code?: string | null }> | null })
          ?.discountCodes ?? []
      )
        .map((entry) => entry?.code ?? "")
        .filter(Boolean),
    [cart],
  );
  const { quotes, retry } = useRecipientQuotes(
    recipients,
    items,
    discountCodes,
  );
  const totals = totalQuotes(recipients, quotes);
  const readyCount = recipients.filter(
    (recipient) => quotes[recipient.id]?.status === "ready",
  ).length;
  // Something already in the cart is on the menu already; offering it again
  // as an extra would only add a second copy of the same line.
  const inCart = new Set(items.map((item) => item.variantId));
  const offeredAddOns = addOns.filter((addOn) => !inCart.has(addOn.variantId));

  function addRecipient(recipient: Recipient) {
    setRecipients((current) => [...current, recipient]);
    setOpenId(recipient.id);
  }

  function addSavedAddress(address: SavedAddress) {
    const recipient = recipientFromAddress(address, items);
    setRecipients((current) =>
      // The page opens with one empty recipient. A saved address should take
      // its place, not leave a blank card sitting above it.
      current.length === 1 && isUntouched(current[0])
        ? [recipient]
        : [...current, recipient],
    );
    setOpenId(recipient.id);
  }

  function updateRecipient(id: string, patch: Partial<Recipient>) {
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id ? { ...recipient, ...patch } : recipient,
      ),
    );
  }

  function removeRecipient(id: string) {
    setRecipients((current) =>
      current.filter((recipient) => recipient.id !== id),
    );
  }

  function clearAll() {
    const first = newRecipient(items);
    setRecipients([first]);
    setOpenId(first.id);
    setConfirmingClear(false);
  }

  /**
   * Hands the order over for payment. The server prices every recipient
   * again and answers with Shopify's payment page for the whole order; the
   * figures there, not the ones here, are what is charged.
   */
  async function startCheckout() {
    const request = buildCheckoutRequest(recipients, items, quotes);
    if (!request || checkout.status === "working") {
      return;
    }
    setCheckout({ status: "working" });
    try {
      const response = await fetch(checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const result = (await response.json()) as CheckoutResponse;
      if ("invoiceUrl" in result) {
        // Stay "working" while the browser leaves, so the button cannot be
        // pressed again on the way out.
        window.location.assign(result.invoiceUrl);
        return;
      }
      setCheckout({ status: "error", message: result.error.message });
      // Open the recipient the problem is with, if it names one.
      const at = result.error.recipient;
      if (typeof at === "number" && recipients[at]) {
        setOpenId(recipients[at].id);
      }
    } catch {
      setCheckout({
        status: "error",
        message:
          "We couldn't start checkout just now. Nothing was charged - please try again in a moment.",
      });
    }
  }

  if (items.length === 0) {
    return (
      <Section width="fixed" verticalPadding="medium">
        <div className="mx-auto max-w-xl space-y-6 text-center">
          <h1 className="h3">Send to multiple recipients</h1>
          <p className="text-body-subtle">
            Your cart is empty. Add the gifts you want to send, then come back
            to choose who gets what.
          </p>
          <Link variant="primary" to="/">
            Continue shopping
          </Link>
        </div>
      </Section>
    );
  }

  return (
    // overflow unset: the summary column is sticky, and a clipping ancestor
    // would quietly turn that off.
    <Section width="fixed" verticalPadding="medium" overflow="unset">
      <div className="mx-auto mb-8 max-w-2xl space-y-4 text-center md:mb-12">
        <h1 className="h3">Send to multiple recipients</h1>
        <p className="text-body-subtle">
          One cart, several addresses, one checkout.
        </p>
        <ol className="space-y-1 text-sm">
          <li>
            <strong>1. Fill your cart</strong> with everything you want to send.
          </li>
          <li>
            <strong>2. Add your recipients</strong> and where each one lives.
          </li>
          <li>
            <strong>3. Choose their gifts</strong>, then pay once for all of
            them.
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className={CARD_CLASS}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <h2 className={HEADING_CLASS}>Your cart</h2>
                <p className="text-neutral-600 text-sm">
                  Everything here can be sent to any recipient below.
                </p>
              </div>
              <Link to="/" className="text-sm underline underline-offset-4">
                Keep shopping
              </Link>
            </div>
            <CartOverview
              lines={summary.lines}
              addOns={offeredAddOns}
              addOnsHeading={
                multiRecipientAddOnsHeading || "Recommended add-ons"
              }
            />
          </div>

          <div className={CARD_CLASS}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <h2 className={HEADING_CLASS}>Your recipients</h2>
                <p className="text-neutral-600 text-sm">
                  Choose the gifts, quantities and message for each person.
                </p>
              </div>
              {confirmingClear ? (
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-600">
                    Remove every recipient?
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-red-600 underline underline-offset-4"
                  >
                    Yes, clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="underline underline-offset-4"
                  >
                    Keep them
                  </button>
                </span>
              ) : (
                recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    className="text-red-600 text-sm underline underline-offset-4"
                  >
                    Clear all
                  </button>
                )
              )}
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  index={index}
                  items={items}
                  open={openId === recipient.id}
                  onToggle={() =>
                    setOpenId((current) =>
                      current === recipient.id ? null : recipient.id,
                    )
                  }
                  onChange={(patch) => updateRecipient(recipient.id, patch)}
                  onDuplicate={() =>
                    addRecipient(duplicateRecipient(recipient))
                  }
                  onRemove={() => removeRecipient(recipient.id)}
                  giftNote={GIFT_NOTE_TEXT}
                  quote={quotes[recipient.id]}
                  onRetry={() => retry(recipient.id)}
                />
              ))}
            </div>

            <div className="mt-4">
              <Button onClick={() => addRecipient(newRecipient(items))}>
                + Add recipient
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-(--height-nav)">
          <SavedAddresses
            isLoggedIn={isLoggedIn}
            addresses={savedAddresses}
            onAdd={addSavedAddress}
          />
          <OrderSummary
            lines={summary.lines}
            subtotal={summary.subtotal}
            currencyCode={summary.currencyCode}
            recipientCount={recipients.length}
            readyCount={readyCount}
            totals={totals}
            discountCodes={discountCodes}
            checkout={checkout}
            onCheckout={startCheckout}
            blocked={
              recipients.length > MAX_RECIPIENTS
                ? `One order can go to at most ${MAX_RECIPIENTS} recipients. Please remove some, or place a second order.`
                : undefined
            }
          />
        </div>
      </div>
    </Section>
  );
}
