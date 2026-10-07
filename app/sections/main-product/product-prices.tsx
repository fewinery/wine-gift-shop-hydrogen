import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import { ClubMemberPrice } from "~/components/product/club-member-price";
import { VariantPrices } from "~/components/product/variant-prices";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";

interface ProductPricesProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  showCompareAtPrice: boolean;
}

export default function ProductPrices(props: ProductPricesProps) {
  const { ref, showCompareAtPrice, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const combinedListing = isCombinedListing(product);

  if (!product) {
    return null;
  }

  // "As low as" means the lowest price on offer, so a combined listing takes
  // the bottom of its range rather than one arbitrary child product.
  const clubBasePrice = combinedListing
    ? product.priceRange.minVariantPrice
    : selectedVariant?.price;

  return (
    <div ref={ref} {...rest} className="space-y-2">
      {combinedListing ? (
        <div className="flex gap-2 font-body text-[20px]/none">
          <span className="flex gap-1">
            From
            <VariantPrices
              variant={{ price: product.priceRange.minVariantPrice }}
              showCompareAtPrice={false}
            />
          </span>
          <span className="flex gap-1">
            To
            <VariantPrices
              variant={{ price: product.priceRange.maxVariantPrice }}
              showCompareAtPrice={false}
            />
          </span>
        </div>
      ) : (
        <VariantPrices
          variant={selectedVariant}
          showCompareAtPrice={showCompareAtPrice}
          className="font-body text-[20px]/none"
        />
      )}
      <ClubMemberPrice price={clubBasePrice} />
    </div>
  );
}

export const schema = createSchema({
  type: "mp--prices",
  title: "Prices",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "switch",
          label: "Show compare at price",
          name: "showCompareAtPrice",
          defaultValue: true,
        },
      ],
    },
  ],
});
