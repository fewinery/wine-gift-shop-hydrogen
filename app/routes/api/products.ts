import { flattenConnection } from "@shopify/hydrogen";
import type { ProductSortKeys } from "@shopify/hydrogen/storefront-api-types";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import type { ApiAllProductsQuery } from "storefront-api.generated";
import invariant from "tiny-invariant";
import { getB2BListingContext } from "~/.server/b2b";
import { PRODUCT_CARD_FRAGMENT } from "~/graphql/fragments";
import { maybeFilterOutCombinedListingsQuery } from "~/utils/combined-listings";

/**
 * Fetch a given set of products from the storefront API
 * @param count
 * @param query
 * @param reverse
 * @param sortKey
 * @returns Product[]
 * @see https://shopify.dev/api/storefront/current/queries/products
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const { storefront } = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const query = searchParams.get("query") ?? "";
  const sortKey =
    (searchParams.get("sortKey") as null | ProductSortKeys) ?? "BEST_SELLING";
  let reverse = false;

  try {
    const _reverse = searchParams.get("reverse");
    if (_reverse === "true") {
      reverse = true;
    }
  } catch (_) {
    // noop
  }

  let count = 4;
  try {
    const _count = searchParams.get("count");
    if (typeof _count === "string") {
      count = Number.parseInt(_count, 10);
    }
  } catch (_) {
    // noop
  }

  const b2b = await getB2BListingContext(context);
  if (b2b.hidden) {
    return data({ products: [] });
  }

  const combinedQuery = [maybeFilterOutCombinedListingsQuery, query]
    .filter(Boolean)
    .join(" ");

  const { products } = await storefront.query<ApiAllProductsQuery>(
    API_ALL_PRODUCTS_QUERY,
    {
      variables: {
        count,
        query: combinedQuery,
        reverse,
        sortKey,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
        buyer: b2b.buyer,
      },
      // A buyer's catalog must never be cached for longer than a request.
      cache: b2b.buyer ? storefront.CacheNone() : storefront.CacheLong(),
    },
  );

  invariant(products, "No data returned from top products query");

  return data({ products: flattenConnection(products) });
}

const API_ALL_PRODUCTS_QUERY = `#graphql
  query ApiAllProducts(
    $query: String
    $count: Int
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
    $sortKey: ProductSortKeys
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    products(first: $count, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
` as const;
