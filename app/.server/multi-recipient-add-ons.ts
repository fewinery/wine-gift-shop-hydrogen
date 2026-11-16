import type { LoaderFunctionArgs } from "react-router";
import { adminGraphql } from "~/.server/admin-api";
import type { AddOn } from "~/components/multi-recipient/cart-overview";

/**
 * The extras offered on the multi-recipient page, including unlisted ones.
 *
 * Shopify leaves unlisted products out of a collection's product list on the
 * storefront, so a collection holding, say, a gift ornament that is only for
 * sale alongside certain wines would show up empty there. The Admin API does
 * list them, so the collection's products are read there, then fetched one
 * by one from the storefront. Fetched that way, a product appears only if
 * this storefront may sell it: drafts, and products not available to this
 * brand's sales channel, still stay hidden.
 */

const MAX_ADD_ONS = 12;

// Not tagged #graphql: codegen checks tagged queries under app/ against the
// Storefront schema, and this one is for the Admin API.
const COLLECTION_PRODUCTS = `
  query multiRecipientAddOnIds($handle: String!, $first: Int!) {
    collectionByIdentifier(identifier: { handle: $handle }) {
      products(first: $first, sortKey: COLLECTION_DEFAULT) {
        nodes {
          id
          status
        }
      }
    }
  }
`;

const ADD_ON_FIELDS = `
  id
  title
  handle
  featuredImage {
    url
    altText
    width
    height
  }
  selectedOrFirstAvailableVariant(
    selectedOptions: []
    ignoreUnknownOptions: true
    caseInsensitiveMatch: true
  ) {
    id
    availableForSale
    price {
      amount
      currencyCode
    }
  }
`;

export interface AddOnNode {
  id: string;
  title: string;
  handle: string;
  featuredImage?: AddOn["image"];
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
  } | null;
}

/** The products that can be added straight from the page: in stock, and
 * with nothing to choose first. */
export function toAddOns(nodes: Array<AddOnNode | null | undefined>): AddOn[] {
  const addOns: AddOn[] = [];
  for (const node of nodes) {
    const variant = node?.selectedOrFirstAvailableVariant;
    if (node && variant?.availableForSale) {
      addOns.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        image: node.featuredImage?.url ? node.featuredImage : null,
        variantId: variant.id,
        price: variant.price,
      });
    }
  }
  return addOns;
}

/**
 * The collection's add-ons, unlisted ones included, or null when the Admin
 * API cannot list the collection (no access to products yet, or no such
 * collection). On null the page falls back to the storefront's own
 * collection list, which simply leaves the unlisted ones out.
 */
export async function loadAddOnsWithUnlisted(
  context: LoaderFunctionArgs["context"],
  handle: string,
): Promise<AddOn[] | null> {
  const listed = await adminGraphql<{
    collectionByIdentifier?: {
      products?: { nodes?: Array<{ id: string; status?: string | null }> };
    } | null;
  }>(context.env, COLLECTION_PRODUCTS, { handle, first: MAX_ADD_ONS });
  if (listed.ok === false) {
    // Most often the app has not been given access to products yet.
    console.error("Multi-recipient add-ons via Admin API:", listed.detail);
    return null;
  }
  const collection = listed.data.collectionByIdentifier;
  if (!collection) {
    return null;
  }
  const ids = (collection.products?.nodes ?? [])
    .filter((node) => node.status === "ACTIVE" || node.status === "UNLISTED")
    .map((node) => node.id);
  if (ids.length === 0) {
    return [];
  }

  // One field per product, each asked for by its id: the only way the
  // storefront returns an unlisted product.
  const { storefront } = context;
  const query = `
    query multiRecipientAddOnsById(
      ${ids.map((_, index) => `$id${index}: ID!`).join("\n      ")}
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      ${ids
        .map(
          (_, index) =>
            `p${index}: product(id: $id${index}) { ${ADD_ON_FIELDS} }`,
        )
        .join("\n      ")}
    }
  `;
  const variables: Record<string, string> = {};
  ids.forEach((id, index) => {
    variables[`id${index}`] = id;
  });
  const result = (await storefront.query(query, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  })) as Record<string, AddOnNode | null>;

  return toAddOns(ids.map((_, index) => result?.[`p${index}`]));
}
