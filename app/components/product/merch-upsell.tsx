import {
  AddStepper,
  ScrollArrow,
  useRowScroll,
} from "~/components/product/add-stepper";
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

/**
 * productId → which variant was chosen and how many of it. Merch is counted
 * rather than toggled, so a shopper who wants three salamis can say so.
 */
export type MerchSelection = Record<
  string,
  { variantId: string; quantity: number }
>;

/** Cart lines for whatever merch is currently selected. */
export function getMerchLines(
  products: MerchProduct[],
  selection: MerchSelection,
) {
  return Object.entries(selection)
    .filter(
      ([productId, entry]) =>
        entry?.quantity > 0 && products.some((p) => p.id === productId),
    )
    .map(([, entry]) => ({
      merchandiseId: entry.variantId,
      quantity: entry.quantity,
    }));
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
  entry,
  addLabel,
  onQuantity,
  onPickVariant,
}: {
  product: MerchProduct;
  entry: { variantId: string; quantity: number } | undefined;
  addLabel: string;
  onQuantity: (next: number) => void;
  onPickVariant: (variantId: string) => void;
}) {
  const variants = (product.variants?.nodes ?? []).filter(
    (variant) => variant.availableForSale,
  );
  const activeVariant =
    variants.find((variant) => variant.id === entry?.variantId) ??
    firstAvailableVariant(product);
  const quantity = entry?.quantity ?? 0;
  const isSelected = quantity > 0;
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
        // border-2 on every state, selected or not, so picking a tile never
        // nudges the row by a pixel. The selected stroke uses the Add to cart
        // button's own colour.
        "flex w-[150px] shrink-0 snap-start flex-col border-2 p-2 transition-colors sm:w-[170px]",
        isSelected
          ? "border-(--btn-primary-bg)"
          : "border-neutral-300 hover:border-neutral-600",
        isSoldOut && "opacity-50",
      )}
    >
      {image?.url && (
        <img
          src={image.url}
          alt={image.altText ?? product.title}
          className="mb-2 aspect-square w-full object-cover"
        />
      )}
      <p className="font-semibold text-neutral-900 text-sm">{product.title}</p>
      {activeVariant?.price && (
        <p className="mt-1 text-neutral-600 text-sm">
          ${activeVariant.price.amount}
        </p>
      )}

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
                  "size-5 border-2 transition-all",
                  isActive
                    ? "border-(--btn-primary-bg) ring-2 ring-(--btn-primary-bg) ring-offset-1"
                    : "border-neutral-300 hover:border-neutral-600",
                  !color && "w-auto px-1 text-[10px] leading-5",
                )}
                style={color ? { backgroundColor: color } : undefined}
              >
                {color ? null : label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-auto pt-2">
        {isSoldOut ? (
          <p className="py-2 text-neutral-500 text-sm">Sold out</p>
        ) : (
          <AddStepper
            quantity={quantity}
            canAdd={true}
            onChange={onQuantity}
            addLabel={addLabel}
          />
        )}
      </div>
    </div>
  );
}

/**
 * The merch row above the wood cards. Several items can be chosen at once and
 * each carries its own quantity; picking a swatch chooses the colour without
 * disturbing the count.
 */
export function MerchUpsellPicker({
  heading,
  addLabel = "Add",
  products,
  selection,
  onChange,
}: {
  heading: string;
  addLabel?: string;
  products: MerchProduct[];
  selection: MerchSelection;
  onChange: (next: MerchSelection) => void;
}) {
  const row = useRowScroll(products.length);

  function setQuantity(product: MerchProduct, next: number) {
    const updated = { ...selection };
    if (next <= 0) {
      delete updated[product.id];
      onChange(updated);
      return;
    }
    const variantId =
      selection[product.id]?.variantId ?? firstAvailableVariant(product)?.id;
    if (!variantId) {
      return;
    }
    updated[product.id] = { variantId, quantity: next };
    onChange(updated);
  }

  function pickVariant(product: MerchProduct, variantId: string) {
    // Choosing a colour on an untouched tile clearly means "this one, in this
    // colour", so it also puts one in the box. On a tile already counted it
    // only swaps the colour and leaves the count alone.
    const quantity = selection[product.id]?.quantity ?? 1;
    onChange({ ...selection, [product.id]: { variantId, quantity } });
  }

  if (!products.length) {
    return null;
  }

  const showArrows = row.canScrollPrev || row.canScrollNext;

  return (
    <div className="space-y-4">
      <p className="font-bold text-neutral-900 text-sm uppercase tracking-wide">
        {heading}
      </p>
      <div className="flex min-w-0 items-center gap-2">
        {showArrows && (
          <ScrollArrow
            direction="prev"
            label="Previous merch"
            disabled={!row.canScrollPrev}
            onClick={() => row.scroll("prev")}
          />
        )}
        <div
          ref={row.ref}
          onScroll={row.update}
          className="flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <MerchTile
              key={product.id}
              product={product}
              entry={selection[product.id]}
              addLabel={addLabel}
              onQuantity={(next) => setQuantity(product, next)}
              onPickVariant={(variantId) => pickVariant(product, variantId)}
            />
          ))}
        </div>
        {showArrows && (
          <ScrollArrow
            direction="next"
            label="Next merch"
            disabled={!row.canScrollNext}
            onClick={() => row.scroll("next")}
          />
        )}
      </div>
    </div>
  );
}
