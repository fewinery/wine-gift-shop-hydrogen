import { TagIcon, XIcon } from "@phosphor-icons/react";
import { CartForm, Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import type { FetcherWithComponents } from "react-router";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import type { OrderLine, SavedAddress } from "~/utils/multi-recipient";

const CARD_CLASS = "space-y-4 border border-neutral-300 bg-white p-5";
const HEADING_CLASS =
  "font-bold text-neutral-900 text-sm uppercase tracking-wide";

function addressLine(address: SavedAddress) {
  return [address.address1, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

/**
 * Saved addresses from the shopper's account, each one a single click to add
 * as a recipient. Guests are offered the login instead; nothing here is
 * required to check out.
 */
export function SavedAddresses({
  isLoggedIn,
  addresses,
  onAdd,
}: {
  isLoggedIn: boolean;
  addresses: SavedAddress[];
  onAdd: (address: SavedAddress) => void;
}) {
  return (
    <div className={CARD_CLASS}>
      <p className={HEADING_CLASS}>Saved addresses</p>
      {!isLoggedIn && (
        <>
          <p className="text-neutral-600 text-sm">
            Log in to send to addresses saved on your account. You can also
            carry on as a guest.
          </p>
          <Link
            variant="outline"
            to="/account/login?return_to=/cart/recipients"
            className="w-full"
          >
            Log in
          </Link>
        </>
      )}
      {isLoggedIn && addresses.length === 0 && (
        <p className="text-neutral-600 text-sm">
          There are no addresses saved on your account yet.
        </p>
      )}
      {isLoggedIn && addresses.length > 0 && (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex items-center justify-between gap-3 border border-neutral-200 p-3"
            >
              <span className="min-w-0 text-sm">
                <span className="block truncate text-neutral-900">
                  {`${address.firstName} ${address.lastName}`.trim() ||
                    address.company}
                </span>
                <span className="block truncate text-neutral-500">
                  {addressLine(address)}
                </span>
              </span>
              <Button
                variant="outline"
                className="shrink-0 px-3 py-1.5 text-sm"
                onClick={() => onAdd(address)}
              >
                + Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex items-baseline justify-between gap-4 font-semibold text-neutral-900"
          : "flex items-baseline justify-between gap-4 text-neutral-600 text-sm"
      }
    >
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap">{children}</dd>
    </div>
  );
}

function DiscountField({
  fetcher,
}: {
  fetcher: FetcherWithComponents<unknown>;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        name="discountCode"
        required
        placeholder="Discount code"
        aria-label="Discount code"
        autoComplete="off"
        className="min-w-0 flex-1 border border-neutral-400 bg-white px-3 py-2 text-neutral-900 text-sm outline-none transition-colors placeholder:text-neutral-500 focus:border-black"
      />
      <Button
        type="submit"
        variant="outline"
        disabled={fetcher.state !== "idle"}
        className="shrink-0 px-4 py-2 text-sm"
      >
        Apply
      </Button>
    </div>
  );
}

/**
 * Discount codes live on the cart, the same place the ordinary cart keeps
 * them, so a code added before coming here is already applied and one added
 * here is still there if the shopper goes back.
 */
function DiscountCodes({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-2">
      {codes.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li
              key={code}
              className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 text-neutral-900 text-sm [&>form]:flex"
            >
              <TagIcon size={14} aria-hidden="true" />
              <span>{code}</span>
              <CartForm
                route="/cart"
                action={CartForm.ACTIONS.DiscountCodesUpdate}
                inputs={{
                  discountCodes: codes.filter((other) => other !== code),
                }}
              >
                <button
                  type="submit"
                  aria-label={`Remove discount code ${code}`}
                  className="flex size-4 items-center justify-center transition-colors hover:text-red-600"
                >
                  <XIcon size={12} />
                </button>
              </CartForm>
            </li>
          ))}
        </ul>
      )}
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.DiscountCodesUpdate}
        inputs={{ discountCodes: codes }}
      >
        {(fetcher: FetcherWithComponents<unknown>) => (
          // Keyed by the codes on the cart: when one is added the field is
          // replaced by an empty one, ready for the next. The applied code
          // is then read from the list above, not from the box.
          <DiscountField key={codes.join(",")} fetcher={fetcher} />
        )}
      </CartForm>
    </div>
  );
}

export interface OrderTotals {
  merchandise: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

/**
 * The order as it stands. Tax and shipping depend on each recipient's
 * address, so the full figures appear only once every recipient has been
 * priced; until then the rows say so instead of showing a number that is
 * about to change.
 */
export function OrderSummary({
  lines,
  subtotal,
  currencyCode,
  recipientCount,
  readyCount,
  totals,
  discountCodes,
  checkout,
  onCheckout,
  blocked,
}: {
  lines: OrderLine[];
  /** The gifts at their cart prices, used until Shopify's figures arrive. */
  subtotal: number;
  currencyCode: string;
  recipientCount: number;
  readyCount: number;
  /** Shopify's figures for the whole order, or null while any are missing. */
  totals: OrderTotals | null;
  discountCodes: string[];
  /** Where the hand-off to payment stands. */
  checkout: { status: "idle" | "working" | "error"; message?: string };
  onCheckout: () => void;
  /** A reason payment cannot start even with every recipient ready. */
  blocked?: string;
}) {
  const assigned = lines.filter((line) => line.quantity > 0);
  const money = (amount: number) =>
    ({ amount: amount.toFixed(2), currencyCode }) as MoneyV2;
  const merchandise = totals ? totals.merchandise : subtotal;

  return (
    <div className={CARD_CLASS}>
      <p className={HEADING_CLASS}>Order summary</p>

      {assigned.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          Gifts appear here as you assign them to recipients.
        </p>
      ) : (
        <dl className="space-y-2">
          {assigned.map(({ item, quantity, total }) => (
            <Row key={item.lineId} label={`${item.title} ×${quantity}`}>
              <Money as="span" withoutTrailingZeros data={money(total)} />
            </Row>
          ))}
        </dl>
      )}

      <dl className="space-y-2 border-neutral-200 border-t pt-4">
        <Row label="Subtotal">
          {merchandise > 0 ? (
            <Money as="span" data={money(merchandise)} />
          ) : (
            "—"
          )}
        </Row>
        {totals && totals.discount > 0 && (
          <Row label="Discounts">
            -<Money as="span" data={money(totals.discount)} />
          </Row>
        )}
        <Row label="Shipping">
          {totals ? <Money as="span" data={money(totals.shipping)} /> : "—"}
        </Row>
        <Row label="Tax">
          {totals ? <Money as="span" data={money(totals.tax)} /> : "—"}
        </Row>
      </dl>

      <dl className="border-neutral-200 border-t pt-4">
        <Row label="Total" emphasis>
          {totals ? <Money as="span" data={money(totals.total)} /> : "—"}
        </Row>
      </dl>

      <p className="text-neutral-600 text-sm" aria-live="polite">
        {readyCount} of {recipientCount}{" "}
        {recipientCount === 1 ? "recipient" : "recipients"} ready
        {!totals &&
          recipientCount > 0 &&
          ". Shipping, tax and the total appear once every recipient is ready."}
      </p>

      <div className="space-y-2 border-neutral-200 border-t pt-4">
        <DiscountCodes codes={discountCodes} />
        {totals && discountCodes.length > 0 && totals.discount === 0 && (
          <p className="text-amber-900 text-sm">
            No discount was applied: the code does not apply to these gifts as
            they are split between recipients.
          </p>
        )}
      </div>

      {/* Payment needs a real figure for every recipient, so the button
          waits for that. While the order is being prepared it is locked, so
          a second press cannot start a second one. */}
      <Button
        className="w-full"
        disabled={!totals || Boolean(blocked) || checkout.status === "working"}
        onClick={onCheckout}
      >
        {checkout.status === "working" ? "Preparing your order..." : "Checkout"}
      </Button>
      {blocked && <p className="text-amber-900 text-sm">{blocked}</p>}
      {checkout.status === "error" && (
        <p className="text-red-800 text-sm" role="alert">
          {checkout.message}
        </p>
      )}
      <p className="text-neutral-500 text-xs">
        You pay once, on the next page, for every recipient.
      </p>
    </div>
  );
}
