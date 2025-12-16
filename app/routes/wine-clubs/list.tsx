import { data, type LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

/**
 * Wine Clubs Listing Route
 *
 * @description Displays all available wine clubs with parallel data loading
 * Implements constitutional requirement: Parallel loading of Shopify + Weaverse data
 *
 * User Story 1 (P1): Wine Club Discovery
 * Acceptance: Navigate to /wine-clubs and verify all clubs display
 *
 * Note: This page is handled by the catchall route, so it uses CUSTOM page type in Weaverse
 * Wine clubs data is fetched in the WineClubsSection component loader
 */
export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront, weaverse } = context;

  // Parallel data loading (Constitutional Principle I)
  // Wine clubs data is fetched by the section loader
  const [shopData, weaverseData] = await Promise.all([
    storefront.query(SHOP_QUERY),
    weaverse.loadPage({ type: "CUSTOM", handle: "wine-clubs" }),
  ]);

  // Validate Weaverse data
  validateWeaverseData(weaverseData);

  return data({
    shopData,
    weaverseData,
  });
}

export default function WineClubsIndexPage() {
  return <WeaverseContent />;
}

/**
 * Shop query for basic storefront information
 */
const SHOP_QUERY = `#graphql
  query ShopQuery {
    shop {
      name
      description
    }
  }
`;

/**
 * SEO metadata for wine clubs page
 */
export function meta() {
  return [
    { title: "Wine Clubs | Explore Our Membership Options" },
    {
      name: "description",
      content:
        "Discover our curated wine club memberships. Choose from various subscription frequencies and case sizes to find the perfect wine club for you.",
    },
  ];
}
