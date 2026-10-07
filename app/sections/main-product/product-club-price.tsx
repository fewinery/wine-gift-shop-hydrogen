import {
  getAdjacentAndFirstAvailableVariants,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import { ClubMemberPrice } from "~/components/product/club-member-price";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";

interface ProductClubPriceProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
}

/**
 * The club member price on the product page. It reads the same theme settings
 * as the product cards, so the label and the discount are set once and apply
 * everywhere.
 */
export default function ProductClubPrice(props: ProductClubPriceProps) {
  const { ref, ...rest } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  if (!product) {
    return null;
  }

  // A combined listing has no single variant price, so the figure is derived
  // from the lowest price in the range — which is what "as low as" means.
  const price = isCombinedListing(product)
    ? product.priceRange.minVariantPrice
    : selectedVariant?.price;

  return (
    <div ref={ref} {...rest}>
      <ClubMemberPrice price={price} />
    </div>
  );
}

export const schema = createSchema({
  type: "mp--club-price",
  title: "Club member price",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [],
});
