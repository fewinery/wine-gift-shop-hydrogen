import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

const PERCENT = 100;
const CENTS = 100;

/**
 * The club member price derived from whatever price is on screen, so the
 * figure always tracks the price shown directly above it rather than drifting
 * to a different variant. The label and the discount live in theme settings
 * because they are copy and a number a brand will want to change without a
 * deploy; the block itself is always rendered.
 */
export function ClubMemberPrice({
  price,
  className,
}: {
  price?: Pick<MoneyV2, "amount" | "currencyCode"> | null;
  className?: string;
}) {
  const { clubPriceLabel, clubPriceDiscount } = useThemeSettings();

  const amount = Number(price?.amount);
  const discount = Number(clubPriceDiscount);

  // A missing price, a zero price or a nonsense discount means there is
  // nothing honest to show, so show nothing rather than "$NaN".
  if (!(price?.currencyCode && Number.isFinite(amount)) || amount <= 0) {
    return null;
  }
  if (!Number.isFinite(discount) || discount <= 0 || discount >= PERCENT) {
    return null;
  }

  const memberAmount =
    Math.round(amount * (1 - discount / PERCENT) * CENTS) / CENTS;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-1 font-body leading-tight",
        className,
      )}
    >
      <span className="text-body-subtle text-sm">
        {clubPriceLabel || "Club Member Price as Low as"}
      </span>
      <Money
        withoutTrailingZeros
        data={
          {
            amount: memberAmount.toFixed(2),
            currencyCode: price.currencyCode,
          } as MoneyV2
        }
      />
    </div>
  );
}
