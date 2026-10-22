import { TagIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticData,
} from "@shopify/hydrogen";
import clsx from "clsx";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import { Skeleton } from "~/components/skeleton";
import type { CartLayoutType } from "~/types/others";
import { calculateAspectRatio } from "~/utils/image";
import { CartLineQuantityAdjust } from "./cart-line-qty-adjust";
import { useCartDrawerStore } from "./store";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];

export type CartLineOptimisticData = {
  action?: string;
  quantity?: number;
};

interface LineAllocation {
  discountedAmount?: { amount?: string | null } | null;
  title?: string | null;
  code?: string | null;
  targetType?: string | null;
}

/**
 * The discounts Shopify has applied to this line. Read structurally because
 * codegen cannot currently run in this repo, so the generated cart types lag
 * the fragment.
 *
 * One promotion can arrive as several allocations, so the titles are grouped
 * and the amounts summed - otherwise the same offer is listed twice.
 */
function lineDiscounts(line: unknown) {
  const allocations =
    (line as { discountAllocations?: LineAllocation[] | null })
      ?.discountAllocations ?? [];
  const byLabel = new Map<string, number>();
  let total = 0;
  for (const allocation of allocations) {
    const amount = Number(allocation?.discountedAmount?.amount) || 0;
    // A free-shipping promotion can allocate against a line; its money is not
    // in the line price, so it must not strike through one.
    if (amount > 0 && allocation?.targetType !== "SHIPPING_LINE") {
      total += amount;
      const label = allocation?.title || allocation?.code || "Discount";
      byLabel.set(label, (byLabel.get(label) ?? 0) + amount);
    }
  }
  return { total, labels: [...byLabel.keys()] };
}

export function CartLineItem({
  line,
  layout,
}: {
  line: CartLine;
  layout: CartLayoutType;
}) {
  const { close: closeCartDrawer } = useCartDrawerStore();
  const optimisticData = useOptimisticData<CartLineOptimisticData>(line?.id);

  if (!line?.id) {
    return null;
  }

  const { id, quantity, merchandise, isOptimistic: lineOptimistic } = line;
  /**
   * Determines if the current line item is in an optimistic state.
   * Note: The isOptimistic field on the line does not update as documented
   * in https://shopify.dev/docs/api/hydrogen/latest/hooks/useoptimisticcart#useOptimisticCart-returns,
   * so we manually check it via the optimisticData object when lineOptimistic is undefined.
   */
  const isOptimistic =
    lineOptimistic === undefined
      ? JSON.stringify(optimisticData) !== "{}"
      : lineOptimistic;

  if (typeof quantity === "undefined" || !merchandise?.product) {
    return null;
  }

  const { image, title, product, selectedOptions } = merchandise;
  const discounts = lineDiscounts(line);
  const publicAttributes = (line.attributes ?? []).filter(
    (attr) => !attr?.key?.startsWith("_"),
  );
  let url = `/products/${product.handle}`;
  if (selectedOptions?.length) {
    const params = new URLSearchParams();
    for (const option of selectedOptions) {
      params.append(option.name, option.value);
    }
    url += `?${params.toString()}`;
  }

  return (
    <li
      className="flex gap-4"
      style={{
        // Hide the line item if the optimistic data action is remove
        // Do not remove the form from the DOM
        display: optimisticData?.action === "remove" ? "none" : "flex",
      }}
    >
      <div className="relative shrink-0">
        {image && (
          <Image
            width={250}
            height={250}
            data={image}
            className="h-24 w-24 object-cover object-center"
            alt={title}
            aspectRatio="1/1"
          />
        )}
      </div>
      <div className="flex min-w-0 grow flex-col gap-3">
        <div className="flex min-w-0 justify-between gap-4">
          <div>
            <div>
              {product?.handle ? (
                <Link
                  to={url}
                  className="inline-block"
                  onClick={closeCartDrawer}
                >
                  <RevealUnderline>{product?.title || ""}</RevealUnderline>
                </Link>
              ) : (
                <p>{product?.title || ""}</p>
              )}
            </div>
            {/* Show selling plan (subscription) info if exists */}
            {"sellingPlanAllocation" in line &&
              line.sellingPlanAllocation?.sellingPlan?.name && (
                <div className="space-y-0.5 text-gray-500 text-sm">
                  <div>{line.sellingPlanAllocation.sellingPlan.name}</div>
                </div>
              )}
            {/* Otherwise show variant options */}
            {!("sellingPlanAllocation" in line && line.sellingPlanAllocation) &&
              selectedOptions &&
              selectedOptions.length > 0 && (
                <div className="space-y-0.5 text-gray-500 text-sm">
                  {selectedOptions.map((option) => {
                    // Skip default variant
                    if (
                      option.name === "Title" &&
                      option.value === "Default Title"
                    ) {
                      return null;
                    }
                    return (
                      <div key={option.name}>
                        {option.name}: {option.value}
                      </div>
                    );
                  })}
                </div>
              )}
            {/* Show line item properties (attributes). Keys beginning with an
                underscore are Shopify's convention for internal data - where
                a sale came from, an app's bookkeeping - and Shopify's own
                checkout hides them from the buyer. Ours has to as well, or
                the shopper reads "_blog_cta" next to their wine. */}
            {publicAttributes.length > 0 && (
              <div className="mt-1 space-y-0.5 text-gray-500 text-sm italic">
                {publicAttributes.map((attr) => (
                  <div key={attr.key}>
                    {attr.key}: {attr.value}
                  </div>
                ))}
              </div>
            )}
            {/* The offer sits on the product it applies to, so the shopper can
                see why the price moved rather than meeting an unexplained
                deduction down in the totals. */}
            {discounts.labels.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {discounts.labels.map((label) => (
                  <div
                    key={label}
                    className="flex items-start gap-1.5 text-sm leading-snug"
                  >
                    <TagIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                      weight="regular"
                    />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {layout === "drawer" && (
            <ItemRemoveButton lineId={id} className="-mt-1.5 -mr-2" />
          )}
        </div>
        <div
          className={clsx(
            "flex items-center gap-2",
            layout === "drawer" && "justify-between",
          )}
        >
          <CartLineQuantityAdjust line={line} />
          {layout === "page" && <ItemRemoveButton lineId={id} />}
          <CartLinePrice
            line={line}
            isOptimistic={isOptimistic}
            discountAmount={discounts.total}
          />
        </div>
      </div>
    </li>
  );
}

function ItemRemoveButton({
  lineId,
  className,
}: {
  lineId: CartLine["id"];
  className?: string;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds: [lineId] }}
    >
      <button
        className={clsx(
          "flex h-8 w-8 items-center justify-center border-none",
          className,
        )}
        type="submit"
      >
        <span className="sr-only">Remove</span>
        <TrashIcon aria-hidden="true" className="size-4.5" />
      </button>
      <OptimisticInput id={lineId} data={{ action: "remove" }} />
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = "regular",
  isOptimistic,
  discountAmount = 0,
}: {
  line: CartLine;
  priceType?: "regular" | "compareAt";
  isOptimistic?: boolean;
  discountAmount?: number;
}) {
  if (!(line?.cost?.amountPerQuantity && line?.cost?.totalAmount)) {
    return null;
  }

  const moneyV2 =
    priceType === "regular"
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

   if (isOptimistic) {
    return <Skeleton as="span" className="ml-auto h-4 w-16 rounded" />;
  }

  // line.cost.totalAmount is already net of the line's discounts, so adding
  // them back reconstructs what the shopper would have paid without the offer.
  const paid = Number(moneyV2.amount) || 0;
  const showWas = discountAmount > 0 && paid > 0;

  return (
    <span className="ml-auto flex flex-col items-end leading-tight">
      {showWas && (
        <Money
          withoutTrailingZeros
          as="span"
          data={
            {
              amount: (paid + discountAmount).toFixed(2),
              currencyCode: moneyV2.currencyCode,
            } as typeof moneyV2
          }
          className="strike text-(--color-compare-price-text)"
        />
      )}
      <Money withoutTrailingZeros as="span" data={moneyV2} />
    </span>
  );
}
