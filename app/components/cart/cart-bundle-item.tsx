import { MinusIcon, PlusIcon, TagIcon, TrashIcon } from "@phosphor-icons/react";
import {
  CartForm,
  Money,
  type OptimisticCart,
  OptimisticInput,
  useOptimisticData,
} from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import { Skeleton } from "~/components/skeleton";
import type { CartLayoutType } from "~/types/others";
import {
  type BundleInfo,
  bundleCount,
  isBundleAttribute,
} from "~/utils/bundle";
import { lineDiscounts } from "./cart-line-item";
import { useCartDrawerStore } from "./store";

type CartLine = OptimisticCart<CartApiQueryFragment>["lines"]["nodes"][0];

interface BundleOptimisticData {
  action?: string;
  quantity?: number;
}

/**
 * A build-your-own bundle in the cart: the pieces added together in one
 * click, shown as one item with one quantity, one price and one remove
 * button. See utils/bundle for how the lines are tied together.
 */
export function CartBundleItem({
  bundle,
  parts,
  layout,
}: {
  bundle: BundleInfo;
  parts: Array<{ line: CartLine; unit: number }>;
  layout: CartLayoutType;
}) {
  const { close: closeCartDrawer } = useCartDrawerStore();
  // One id for the whole bundle, so every piece shows the same pending
  // state while a change is on its way.
  const optimisticId = `bundle-${bundle.id}`;
  const optimisticData = useOptimisticData<BundleOptimisticData>(optimisticId);

  const live = parts.filter(
    (part) => part.line?.id && part.line.merchandise?.product,
  );
  if (live.length === 0) {
    return null;
  }

  const count = bundleCount(
    live.map((part) => ({ quantity: part.line.quantity, unit: part.unit })),
  );
  const shownCount = optimisticData?.quantity || count;
  const isOptimistic =
    live.some((part) => part.line.isOptimistic) ||
    JSON.stringify(optimisticData ?? {}) !== "{}";

  // The piece named after the bundle is the kit itself; its picture and page
  // stand for the whole bundle.
  const main =
    live.find((part) => part.line.merchandise.product.title === bundle.name) ??
    live[0];
  const { image, product } = main.line.merchandise;
  const title = bundle.name || product.title;

  let paid = 0;
  let discountTotal = 0;
  const discountLabels = new Set<string>();
  for (const { line } of live) {
    paid += Number(line.cost?.totalAmount?.amount) || 0;
    const discounts = lineDiscounts(line);
    discountTotal += discounts.total;
    for (const label of discounts.labels) {
      discountLabels.add(label);
    }
  }
  const currencyCode =
    main.line.cost?.totalAmount?.currencyCode ??
    live[0].line.cost?.totalAmount?.currencyCode ??
    "USD";
  const money = (amount: number) =>
    ({ amount: amount.toFixed(2), currencyCode }) as MoneyV2;

  const lineIds = live.map((part) => part.line.id);
  const linesFor = (next: number) =>
    live.map((part) => ({ id: part.line.id, quantity: part.unit * next }));

  return (
    <li
      className="flex gap-4"
      style={{
        // Hidden, not removed, while the removal is on its way: the form
        // that sent it has to stay on the page.
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
          <div className="min-w-0">
            {product?.handle ? (
              <Link
                to={`/products/${product.handle}`}
                className="inline-block"
                onClick={closeCartDrawer}
              >
                <RevealUnderline>{title}</RevealUnderline>
              </Link>
            ) : (
              <p>{title}</p>
            )}
            <ul className="mt-1 space-y-0.5 text-gray-500 text-sm">
              {live.map(({ line, unit }) => {
                const variant = line.merchandise.title;
                const extras = (line.attributes ?? []).filter(
                  (attribute) =>
                    attribute?.key &&
                    !attribute.key.startsWith("_") &&
                    !isBundleAttribute(attribute.key),
                );
                return (
                  <li key={line.id}>
                    {unit} × {line.merchandise.product.title}
                    {variant && variant !== "Default Title" && ` (${variant})`}
                    {extras.length > 0 && (
                      <span className="block pl-4 italic">
                        {extras
                          .map(
                            (attribute) =>
                              `${attribute.key}: ${attribute.value}`,
                          )
                          .join(" · ")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {discountLabels.size > 0 && (
              <div className="mt-1.5 space-y-1">
                {[...discountLabels].map((label) => (
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
            <RemoveBundle
              lineIds={lineIds}
              optimisticId={optimisticId}
              className="-mt-1.5 -mr-2"
            />
          )}
        </div>
        <div
          className={clsx(
            "flex items-center gap-2",
            layout === "drawer" && "justify-between",
          )}
        >
          <label htmlFor={`quantity-${optimisticId}`} className="sr-only">
            Quantity, {shownCount}
          </label>
          <div className="flex min-w-30 items-center justify-evenly border border-line-subtle">
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{ lines: linesFor(Math.max(1, shownCount - 1)) }}
            >
              <button
                type="submit"
                aria-label="Decrease quantity"
                className="inline-flex size-9 items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
                disabled={shownCount <= 1 || isOptimistic}
              >
                <MinusIcon />
                <OptimisticInput
                  id={optimisticId}
                  data={{ quantity: Math.max(1, shownCount - 1) }}
                />
              </button>
            </CartForm>
            <div
              id={`quantity-${optimisticId}`}
              className="min-w-8 px-2 text-center"
              data-test="item-quantity"
            >
              {shownCount}
            </div>
            <CartForm
              route="/cart"
              action={CartForm.ACTIONS.LinesUpdate}
              inputs={{ lines: linesFor(shownCount + 1) }}
            >
              <button
                type="submit"
                aria-label="Increase quantity"
                className="inline-flex size-9 items-center justify-center transition disabled:cursor-not-allowed disabled:text-body-subtle"
                disabled={isOptimistic}
              >
                <PlusIcon />
                <OptimisticInput
                  id={optimisticId}
                  data={{ quantity: shownCount + 1 }}
                />
              </button>
            </CartForm>
          </div>
          {layout === "page" && (
            <RemoveBundle lineIds={lineIds} optimisticId={optimisticId} />
          )}
          {isOptimistic ? (
            <Skeleton as="span" className="ml-auto h-4 w-16 rounded" />
          ) : (
            <span className="ml-auto flex flex-col items-end leading-tight">
              {discountTotal > 0 && paid > 0 && (
                <Money
                  withoutTrailingZeros
                  as="span"
                  data={money(paid + discountTotal)}
                  className="strike text-(--color-compare-price-text)"
                />
              )}
              <Money withoutTrailingZeros as="span" data={money(paid)} />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function RemoveBundle({
  lineIds,
  optimisticId,
  className,
}: {
  lineIds: string[];
  optimisticId: string;
  className?: string;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{ lineIds }}
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
      <OptimisticInput id={optimisticId} data={{ action: "remove" }} />
    </CartForm>
  );
}
