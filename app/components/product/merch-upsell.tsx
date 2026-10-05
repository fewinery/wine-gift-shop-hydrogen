import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { cn } from "~/utils/cn";

/**
 * The slice of a product the merch metaobject gives us. Deliberately loose:
 * the data comes back from a generic metaobject field, so it is not one of
 * the generated fragment types.
 */
export interface MerchProduct {
  id: string;
  title: string;
  handle?: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  options?: Array<{
    name: string;
    optionValues?: Array<{
      name: string;
      swatch?: {
        color?: string | null;
        image?: { previewImage?: { url: string } | null } | null;
      } | null;
    }> | null;
  }> | null;
  variants?: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price?: { amount: string; currencyCode: string } | null;
      image?: { url: string; altText?: string | null } | null;
      selectedOptions?: Array<{ name: string; value: string }> | null;
    }>;
  } | null;
}

/** productId → the variant id chosen for it. A key present means selected. */
export type MerchSelection = Record<string, string>;

/** Cart lines for whatever merch is currently selected. */
export function getMerchLines(
  products: MerchProduct[],
  selection: MerchSelection,
) {
  return Object.entries(selection)
    .filter(([productId]) => products.some((p) => p.id === productId))
    .map(([, variantId]) => ({ merchandiseId: variantId, quantity: 1 }));
}

function firstAvailableVariant(product: MerchProduct) {
  const nodes = product.variants?.nodes ?? [];
  return nodes.find((variant) => variant.availableForSale) ?? nodes[0];
}

/**
 * Finds the colour for a variant by matching its option value against the
 * product's option swatches. Falls back to null, in which case the value's
 * name is shown as text instead of a colour box.
 */
function swatchColorFor(
  product: MerchProduct,
  variant: NonNullable<MerchProduct["variants"]>["nodes"][number],
): { color: string | null; label: string } {
  const selected = variant.selectedOptions?.[0];
  const label = selected?.value || variant.title;
  for (const option of product.options ?? []) {
    for (const value of option.optionValues ?? []) {
      if (value.name === selected?.value) {
        return { color: value.swatch?.color ?? null, label };
      }
    }
  }
  return { color: null, label };
}

function MerchTile({
  product,
  selectedVariantId,
  onToggle,
  onPickVariant,
}: {
  product: MerchProduct;
  selectedVariantId: string | undefined;
  onToggle: () => void;
  onPickVariant: (variantId: string) => void;
}) {
  const variants = (product.variants?.nodes ?? []).filter(
    (variant) => variant.availableForSale,
  );
  const activeVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    firstAvailableVariant(product);
  const isSelected = Boolean(selectedVariantId);
  const isSoldOut = variants.length === 0;
  const image = activeVariant?.image ?? product.featuredImage;
  // Most merch has a single variant; the swatch row only earns its space
  // when there is a real choice.
  const showSwatches = variants.length > 1;

  return (
    <div
      className={cn(
        // A fixed width, not a percentage: a single merch item should look
        // the same size as one of ten, rather than shrinking to a lonely
        // sliver or stretching across the row.
        "w-[150px] shrink-0 snap-start border p-2 transition-colors sm:w-[170px]",
        isSelected
          ? "border-black"
          : "border-neutral-300 hover:border-neutral-600",
        isSoldOut && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isSoldOut}
        className="block w-full text-left disabled:cursor-not-allowed"
      >
        {image?.url && (
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            className="mb-2 aspect-square w-full object-cover"
          />
        )}
        <p className="text-sm font-semibold text-neutral-900">
          {product.title}
        </p>
        {activeVariant?.price && (
          <p className="mt-1 text-sm text-neutral-600">
            ${activeVariant.price.amount}
          </p>
        )}
      </button>

      {showSwatches && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {variants.map((variant) => {
            const { color, label } = swatchColorFor(product, variant);
            const isActive = activeVariant?.id === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                title={label}
                aria-label={`${product.title}, ${label}`}
                aria-pressed={isActive}
                onClick={() => onPickVariant(variant.id)}
                className={cn(
                  "size-5 border transition-all",
                  isActive
                    ? "border-black ring-1 ring-black ring-offset-1"
                    : "border-neutral-300 hover:border-neutral-600",
                  !color && "px-1 w-auto text-[10px] leading-5",
                )}
                style={color ? { backgroundColor: color } : undefined}
              >
                {color ? null : label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The merch row above the wood cards. Several items can be selected at once;
 * picking a swatch both chooses the colour and selects the item.
 */
export function MerchUpsellPicker({
  heading,
  products,
  selection,
  onChange,
}: {
  heading: string;
  products: MerchProduct[];
  selection: MerchSelection;
  onChange: (next: MerchSelection) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  function updateScrollState() {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    setCanScrollPrev(container.scrollLeft > 4);
    setCanScrollNext(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 4,
    );
  }

  // Measured on mount and on resize, so a row that already fits knows it has
  // nowhere to scroll and hides its arrows instead of offering dead buttons.
  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => {
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products.length]);

  function scroll(direction: "prev" | "next") {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const amount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "prev" ? -amount : amount,
      behavior: "smooth",
    });
  }

  function toggle(product: MerchProduct) {
    const next = { ...selection };
    if (next[product.id]) {
      delete next[product.id];
    } else {
      const variant = firstAvailableVariant(product);
      if (!variant) {
        return;
      }
      next[product.id] = variant.id;
    }
    onChange(next);
  }

  function pickVariant(product: MerchProduct, variantId: string) {
    // Choosing a colour also selects the item: tapping a swatch on an
    // unselected tile clearly means "this one, in this colour".
    onChange({ ...selection, [product.id]: variantId });
  }

  if (!products.length) {
    return null;
  }

  const showArrows = canScrollPrev || canScrollNext;

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">
        {heading}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        {showArrows && (
          <button
            type="button"
            aria-label="Previous merch"
            onClick={() => scroll("prev")}
            disabled={!canScrollPrev}
            className="flex shrink-0 items-center justify-center rounded-full border border-black bg-white p-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <MerchTile
              key={product.id}
              product={product}
              selectedVariantId={selection[product.id]}
              onToggle={() => toggle(product)}
              onPickVariant={(variantId) => pickVariant(product, variantId)}
            />
          ))}
        </div>
        {showArrows && (
          <button
            type="button"
            aria-label="Next merch"
            onClick={() => scroll("next")}
            disabled={!canScrollNext}
            className="flex shrink-0 items-center justify-center rounded-full border border-black bg-white p-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}
