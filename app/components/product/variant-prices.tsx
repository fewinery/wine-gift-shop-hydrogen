import { Money, useMoney } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import type { ProductVariantFragment } from "storefront-api.generated";
import { cn } from "~/utils/cn";

function CompareAtPrice({
  data,
  className,
}: {
  data: MoneyV2;
  className?: string;
}) {
  const { currencyNarrowSymbol, amount } = useMoney(data);
  return (
    <span className={cn("strike text-(--color-compare-price-text)", className)}>
      {currencyNarrowSymbol}
      {amount}
    </span>
  );
}

export function VariantPrices({
  variant,
  showCompareAtPrice = true,
  className,
}: {
  variant:
  | ProductVariantFragment
  | { price: Pick<MoneyV2, "amount" | "currencyCode"> };
  showCompareAtPrice?: boolean;
  className?: string;
}) {
  // Optional text shown before the sale price (e.g. "Holiday Price:").
  // Empty by default, so storefronts that never fill it in see no label.
  const { salePriceLabel } = useThemeSettings();
  const label = typeof salePriceLabel === "string" ? salePriceLabel.trim() : "";
  if (variant) {
    const { price } = variant;
    const compareAtPrice =
      "compareAtPrice" in variant ? variant.compareAtPrice : undefined;
    if (price) {
      const isOnSale =
        showCompareAtPrice &&
        compareAtPrice &&
        Number(compareAtPrice.amount) > Number(price.amount);
      return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          {isOnSale && (
            <CompareAtPrice data={compareAtPrice as MoneyV2} className="mr-2" />
          )}
          {isOnSale && label && <span>{label}</span>}
          <Money data={price} />
        </div>
      );
    }
  }
  return null;
}
