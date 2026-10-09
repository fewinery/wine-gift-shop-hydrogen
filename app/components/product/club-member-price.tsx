import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

const PERCENT = 100;
const CENTS = 100;

/**
 * The club member price derived from whatever price is on screen, so the
 * figure always tracks the price shown directly above it rather than drifting
 * to a different variant.
 *
 * Off unless a storefront switches it on. This theme is shared by brands with
 * no wine club at all — corporate gifting among them — and a club discount
 * shown there is not a cosmetic slip, it is a wrong price on a live site. So
 * the default is silence, and a brand opts in.
 */
export function ClubMemberPrice({
  price,
  className,
}: {
  price?: Pick<MoneyV2, "amount" | "currencyCode"> | null;
  className?: string;
}) {
  const { clubPriceEnabled, clubPriceLabel, clubPriceDiscount } =
    useThemeSettings();

  if (!clubPriceEnabled) {
    return null;
  }

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
        {clubPriceLabel || "Club or Loyalty Pricing from"}
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
