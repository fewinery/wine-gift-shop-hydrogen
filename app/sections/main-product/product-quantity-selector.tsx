import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useEffect } from "react";
import { useLoaderData } from "react-router";
import { create } from "zustand";
import { Quantity } from "~/components/product/quantity";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";

// Shared between the quantity selector and the add-to-cart buttons. It lives
// for the whole visit (client-side navigation keeps it), so it remembers which
// product the quantity was chosen for.
export const useProductQtyStore = create<{
  quantity: number;
  handle: string | null;
  setQuantity: (qty: number, handle: string | null) => void;
}>()((set) => ({
  quantity: 1,
  handle: null,
  setQuantity: (qty, handle) => set({ quantity: qty, handle }),
}));

/**
 * The quantity for this product. A quantity picked on a different product
 * reads as 1 straight away (no flash of the old number), and the store is
 * then reset to this product, so every product page starts at 1.
 */
export function useProductQuantity(handle?: string | null) {
  const { quantity, handle: storedHandle, setQuantity } = useProductQtyStore();
  const key = handle ?? null;
  const isThisProduct = storedHandle === key;

  useEffect(() => {
    if (!isThisProduct) {
      setQuantity(1, key);
    }
  }, [isThisProduct, key, setQuantity]);

  return [
    isThisProduct ? quantity : 1,
    (qty: number) => setQuantity(qty, key),
  ] as const;
}

interface ProductQuantitySelectorProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  labelText: string;
}

export default function ProductQuantitySelector(
  props: ProductQuantitySelectorProps,
) {
  const { ref, labelText, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();
  const [quantity, setQuantity] = useProductQuantity(product?.handle);

  const combinedListing = isCombinedListing(product);

  if (!product || combinedListing) {
    return null;
  }

  return (
    <div ref={ref} {...rest} className="empty:hidden">
      <Quantity value={quantity} onChange={setQuantity} label={labelText} />
    </div>
  );
}

export const schema = createSchema({
  type: "mp--quantity-selector",
  title: "Quantity selector",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "text",
          label: "Label text",
          name: "labelText",
          defaultValue: "Quantity",
          placeholder: "Quantity",
        },
      ],
    },
  ],
});
