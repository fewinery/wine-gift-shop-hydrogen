import { GiftIcon, TagIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { CartForm, Money, type OptimisticCart } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { Skeleton } from "~/components/skeleton";
import { Spinner } from "~/components/spinner";
import type { CartLayoutType } from "~/types/others";
import {
  DiscountDialog,
  GiftCardDialog,
  NoteDialog,
} from "./cart-summary-actions";
import { useCartDrawerStore } from "./store";

interface MoneyLike {
  amount?: string | null;
  currencyCode?: string | null;
}

interface AllocationLike {
  discountedAmount?: MoneyLike | null;
  // Automatic and custom discounts carry a title; a code discount carries the
  // code the shopper typed, which is the label they will recognise.
  title?: string | null;
  code?: string | null;
  targetType?: string | null;
}

/**
 * Free-shipping promotions arrive as allocations too, but their money is not
 * part of the subtotal - shipping is not priced until checkout. Counting one
 * here would deduct an amount that was never added.
 */
function isMerchandiseDiscount(allocation: AllocationLike | null | undefined) {
  return allocation?.targetType !== "SHIPPING_LINE";
}

/**
 * The cart shape these helpers need. Read structurally rather than from the
 * generated types: codegen cannot currently run in this repo (two queries
 * share an operation name), so the generated cart type lags the fragment and
 * would report these new fields as missing.
 */
interface CartDiscountShape {
  discountAllocations?: AllocationLike[] | null;
}

function sumAmounts(values: Array<MoneyLike | null | undefined>) {
  return values.reduce<number>(
    (total, value) => total + (Number(value?.amount) || 0),
    0,
  );
}

/**
 * Order-level discounts only. Shopify defines cost.subtotalAmount as "the
 * amount, before taxes and cart-level discounts", so product-level offers -
 * including buy X get Y, which allocates against the discounted line - are
 * already deducted from it and are shown on the lines themselves. Deducting
 * them again here would take the same money off twice.
 */
function discountTotals(cart: unknown) {
  const source = cart as CartDiscountShape;
  const cartAllocations = (source.discountAllocations ?? []).filter(
    isMerchandiseDiscount,
  );
  const cartLevel = sumAmounts(
    cartAllocations.map((allocation) => allocation?.discountedAmount),
  );

  // One promotion spread over several lines arrives as several allocations,
  // so group by label - otherwise the same offer is listed three times.
  const byLabel = new Map<string, number>();
  for (const allocation of cartAllocations) {
    const label = allocation?.title || allocation?.code || "Discount";
    const amount = Number(allocation?.discountedAmount?.amount) || 0;
    if (amount > 0) {
      byLabel.set(label, (byLabel.get(label) ?? 0) + amount);
    }
  }

  return {
    cartLevel,
    orderLevelLines: [...byLabel.entries()].map(([label, amount]) => ({
      label,
      amount,
    })),
  };
}

function money(amount: number, currencyCode: string) {
  return { amount: amount.toFixed(2), currencyCode } as MoneyV2;
}

function SummaryRow({
  label,
  children,
  loading,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  loading: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4",
        emphasis ? "font-medium" : "text-body-subtle",
      )}
    >
      {/* min-w-0 lets a long offer name wrap. Without it the label holds the
          row open at its own width and pushes the amount off the edge. */}
      <dt className="min-w-0">{label}</dt>
      {loading ? (
        <Skeleton className="h-4 w-20 rounded" />
      ) : (
        <dd className="shrink-0 whitespace-nowrap">{children}</dd>
      )}
    </div>
  );
}

export function CartSummary({
  cart,
  layout,
}: {
  cart: OptimisticCart<CartApiQueryFragment>;
  layout: CartLayoutType;
}) {
  const {
    enableCartNote,
    cartNoteButtonText,
    enableDiscountCode,
    discountCodeButtonText,
    enableGiftCard,
    giftCardButtonText,
    checkoutButtonText,
    cartShowContinueShopping,
    cartContinueShoppingText,
    cartContinueShoppingLink,
    cartContinueShoppingBgColor,
    cartContinueShoppingTextColor,
    cartContinueShoppingBorderColor,
  } = useThemeSettings();
  const closeCartDrawer = useCartDrawerStore((state) => state.close);
  // Only a path on this site ("/", "/collections/all"); anything else falls
  // back to the home page rather than sending shoppers off the storefront.
  const continueShoppingTo = cartContinueShoppingLink?.trim().startsWith("/")
    ? cartContinueShoppingLink.trim()
    : "/";
  const [removingDiscountCode, setRemovingDiscountCode] = useState<
    string | null
  >(null);
  const [removingGiftCard, setRemovingGiftCard] = useState<string | null>(null);
  const dcRemoveFetcher = useFetcher({ key: "discount-code-remove" });
  const gcRemoveFetcher = useFetcher({ key: "gift-card-remove" });
  const {
    cost,
    discountCodes,
    isOptimistic,
    checkoutUrl,
    appliedGiftCards,
    note,
  } = cart;

  const currencyCode =
    cost?.totalAmount?.currencyCode ||
    cost?.subtotalAmount?.currencyCode ||
    "USD";
  // Product-level offers are shown on the lines themselves, and Shopify's
  // subtotal already has them deducted. Only order-level discounts still need
  // a row here.
  //
  // No tax is shown. cost.totalAmount carries Shopify's tax estimate, which is
  // guessed from whatever it knows of the shopper - often nothing before they
  // sign in or type an address - so it moves around and can be wrong. The cart
  // stays on figures that are certain, and checkout states tax and shipping.
  const discounts = discountTotals(cart);
  const subtotal = Number(cost?.subtotalAmount?.amount) || 0;
  const totalAfterDiscounts = Math.max(subtotal - discounts.cartLevel, 0);
  const hasOrderDiscount = discounts.orderLevelLines.length > 0;

  // Show loading state for optimistic line item changes or pending cart actions
  const isCartUpdating =
    isOptimistic ||
    dcRemoveFetcher.state !== "idle" ||
    gcRemoveFetcher.state !== "idle";
  return (
    <div
      className={clsx(
        // min-w-0: without it the summary is as wide as its widest row, and on
        // a phone that pushed the whole cart past the screen edge, cutting off
        // names, prices and buttons.
        "min-w-0",
        layout === "drawer" && "grid border-line-subtle border-t pt-4",
        layout === "page" &&
          "sticky top-(--height-nav) grid w-full rounded-sm py-4 md:translate-y-4 md:px-6 lg:py-0",
      )}
    >
      <h2 id="summary-heading" className="sr-only">
        Order summary
      </h2>
      {appliedGiftCards?.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {appliedGiftCards.map((giftCard) => {
            // Check if this specific gift card is being removed
            const isGCRemoving =
              gcRemoveFetcher.state !== "idle" &&
              removingGiftCard === giftCard.lastCharacters;
            return (
              <div
                key={giftCard.id}
                className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-2 py-1.5 [&>form]:flex"
              >
                <GiftIcon className="h-4.5 w-4.5" aria-hidden="true" />
                <div className="flex items-center gap-1 leading-normal">
                  <span>***{giftCard.lastCharacters}</span>
                  <span className="inline-flex items-center">
                    (-{<Money data={giftCard.amountUsed} />})
                  </span>
                </div>
                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.GiftCardCodesRemove}
                  inputs={{
                    giftCardCodes: [giftCard.id],
                  }}
                  fetcherKey="gift-card-remove"
                >
                  <button
                    type="submit"
                    className="relative ml-1 size-4 transition-colors hover:text-red-600"
                    aria-label={`Remove gift card code ${giftCard.id}`}
                    onClick={() => setRemovingGiftCard(giftCard.lastCharacters)}
                  >
                    {isGCRemoving ? (
                      <Spinner size={16} />
                    ) : (
                      <XIcon
                        className="size-4"
                        weight="regular"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </CartForm>
              </div>
            );
          })}
        </div>
      )}
      {discountCodes?.length > 0 && (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {discountCodes
            .filter((discount) => discount.applicable)
            .map((discount) => {
              const codes = discountCodes
                .filter((d) => d.applicable)
                .map((d) => d.code);
              const updatedCodes = codes.filter((c) => c !== discount.code);

              // Check if this specific discount is being removed
              const isDCRemoving =
                dcRemoveFetcher.state !== "idle" &&
                removingDiscountCode === discount.code;

              return (
                <div
                  key={discount.code}
                  className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-2 py-1.5 [&>form]:flex"
                >
                  <TagIcon className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="leading-normal">{discount.code}</span>
                  <CartForm
                    route="/cart"
                    action={CartForm.ACTIONS.DiscountCodesUpdate}
                    inputs={{ discountCodes: updatedCodes || [] }}
                    fetcherKey="discount-code-remove"
                  >
                    <button
                      type="submit"
                      className="relative ml-1 size-4 transition-colors hover:text-red-600"
                      aria-label={`Remove discount code ${discount.code}`}
                      onClick={() => setRemovingDiscountCode(discount.code)}
                    >
                      {isDCRemoving ? (
                        <Spinner size={16} />
                      ) : (
                        <XIcon
                          className="size-4"
                          weight="regular"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </CartForm>
                </div>
              );
            })}
        </div>
      )}
      <dl className="mb-4 grid gap-1">
        {hasOrderDiscount && (
          <SummaryRow label="Subtotal:" loading={isCartUpdating}>
            <Money data={money(subtotal, currencyCode)} />
          </SummaryRow>
        )}
        {discounts.orderLevelLines.map(({ label, amount }) => (
          <SummaryRow key={label} label={`${label}:`} loading={isCartUpdating}>
            -<Money as="span" data={money(amount, currencyCode)} />
          </SummaryRow>
        ))}
        <div
          className={clsx(
            "flex items-center justify-between font-medium",
            layout === "page" && "text-xl",
          )}
        >
          <dt>{hasOrderDiscount ? "Total:" : "Subtotal:"}</dt>
          {isCartUpdating ? (
            <Skeleton className="h-4 w-20 rounded" />
          ) : (
            <dd>
              {subtotal > 0 ? (
                <Money data={money(totalAfterDiscounts, currencyCode)} />
              ) : (
                "-"
              )}
            </dd>
          )}
        </div>
      </dl>
      <div className="mb-2 text-right text-body-subtle">
        Taxes and{" "}
        <Link
          target="_blank"
          to="/policies/shipping-policy"
          variant="underline"
          className="text-current after:bg-current"
        >
          shipping
        </Link>{" "}
        calculated at checkout.
      </div>
      {(enableCartNote || enableDiscountCode || enableGiftCard) && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {enableCartNote && (
            <>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="underline">
                    {cartNoteButtonText || "Add a note"}
                  </Button>
                </Dialog.Trigger>
                <NoteDialog cartNote={note} />
              </Dialog.Root>
              {(enableDiscountCode || enableGiftCard) && <span>/</span>}
            </>
          )}
          {enableDiscountCode && (
            <>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="underline">
                    {discountCodeButtonText || "Add a discount code"}
                  </Button>
                </Dialog.Trigger>
                <DiscountDialog discountCodes={discountCodes} />
              </Dialog.Root>
              {enableGiftCard && <span>/</span>}
            </>
          )}
          {enableGiftCard && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="underline">
                  {giftCardButtonText || "Redeem a gift card"}
                </Button>
              </Dialog.Trigger>
              <GiftCardDialog appliedGiftCards={appliedGiftCards} />
            </Dialog.Root>
          )}
        </div>
      )}
      {checkoutUrl && (
        <div className="mt-4 flex flex-col gap-3">
          <a href={checkoutUrl} target="_self">
            <Button className="w-full">
              {checkoutButtonText || "Continue to Checkout"}
            </Button>
          </a>
          {/* @todo: <CartShopPayButton cart={cart} /> */}
          {cartShowContinueShopping && (
            <Link
              variant="primary"
              to={continueShoppingTo}
              // Same shape as the checkout button; each colour left empty
              // keeps the theme's primary button colour.
              className="w-full hover:opacity-90"
              style={{
                backgroundColor: cartContinueShoppingBgColor || undefined,
                color: cartContinueShoppingTextColor || undefined,
                borderColor: cartContinueShoppingBorderColor || undefined,
              }}
              onClick={closeCartDrawer}
            >
              {cartContinueShoppingText || "Continue Shopping"}
            </Link>
          )}
          {layout === "drawer" && (
            <Link variant="underline" to="/cart" className="mx-auto w-fit">
              View cart
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
