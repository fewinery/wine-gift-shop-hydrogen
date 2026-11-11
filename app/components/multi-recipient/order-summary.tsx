import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
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

/**
 * The order as it stands. Tax and shipping depend on each recipient's
 * address, so until they are priced the rows say so instead of showing a
 * figure that would change.
 */
export function OrderSummary({
  lines,
  subtotal,
  currencyCode,
  recipientCount,
  completeCount,
}: {
  lines: OrderLine[];
  subtotal: number;
  currencyCode: string;
  recipientCount: number;
  completeCount: number;
}) {
  const assigned = lines.filter((line) => line.quantity > 0);
  const money = (amount: number) =>
    ({ amount: amount.toFixed(2), currencyCode }) as MoneyV2;

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
          {subtotal > 0 ? (
            <Money as="span" withoutTrailingZeros data={money(subtotal)} />
          ) : (
            "—"
          )}
        </Row>
        <Row label="Tax">—</Row>
        <Row label="Shipping">—</Row>
      </dl>

      <dl className="border-neutral-200 border-t pt-4">
        <Row label="Total" emphasis>
          —
        </Row>
      </dl>

      <p className="text-neutral-600 text-sm" aria-live="polite">
        {completeCount} of {recipientCount}{" "}
        {recipientCount === 1 ? "recipient" : "recipients"} ready
      </p>

      {/* Payment arrives in a later release. The button is shown, disabled,
          so the page can be reviewed as a whole - and says why, so nobody
          who lands here early thinks it is broken. */}
      <Button className="w-full" disabled>
        Checkout
      </Button>
      <p className="text-neutral-500 text-xs">
        Preview: tax, shipping and payment for multi-recipient orders are not
        switched on yet.
      </p>
    </div>
  );
}
