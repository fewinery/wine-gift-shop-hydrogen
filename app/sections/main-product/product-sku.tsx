import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/products/product";

interface ProductSkuProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  label: string;
}

/**
 * The SKU of the variant currently selected, so it changes with the variant
 * picker rather than always showing the first one. Typography matches the
 * summary block so it reads as part of the same body copy.
 */
export default function ProductSku(props: ProductSkuProps) {
  const { ref, label, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const sku = selectedVariant?.sku;

  if (!sku) {
    return null;
  }

  return (
    <div ref={ref} {...rest} className="font-body text-base text-black">
      {label ? `${label} ` : ""}
      {sku}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--sku",
  title: "SKU",
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
          name: "label",
          label: "Label",
          defaultValue: "SKU:",
          placeholder: "SKU:",
          helpText: "Shown before the SKU. Leave empty for the SKU alone.",
        },
      ],
    },
  ],
  presets: {
    label: "SKU:",
  },
});
