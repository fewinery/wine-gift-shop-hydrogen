import type { BuyerInput } from "@shopify/hydrogen/storefront-api-types";
import type { LoaderFunctionArgs } from "react-router";
import type { FeaturedProductsQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";

export async function getFeaturedProducts(
  storefront: LoaderFunctionArgs["context"]["storefront"],
  buyer?: BuyerInput,
) {
  const featuredProductsData = await storefront.query<FeaturedProductsQuery>(
    FEATURED_PRODUCTS_QUERY,
    {
      variables: {
        pageBy: 8,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        query: maybeFilterOutCombinedListingsQuery,
        buyer,
      },
    },
  );

  invariant(
    featuredProductsData,
    "No featured products data returned from Shopify API",
  );

  return featuredProductsData;
}

export type FeaturedProductsData = Awaited<
  ReturnType<typeof getFeaturedProducts>
>;

export const FEATURED_PRODUCTS_QUERY = `#graphql
  query featuredProducts(
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int = 8
    $query: String
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    featuredProducts: products(first: $pageBy, sortKey: BEST_SELLING, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;
