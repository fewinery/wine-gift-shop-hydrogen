import { data, type LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { useLoaderData } from "react-router";
import SelectionWizardContainer from "~/components/wine-clubs/selection-wizard-container";
import type { WineClubDetails } from "~/types/winehub";
import { fetchWineClubDetails, sanitizeHtml } from "~/utils/winehub";

/**
 * Wine Club Detail Route
 *
 * @description Displays detailed wine club information with selection wizard
 * Implements constitutional requirement: Parallel loading of Shopify + Winehub data
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance: Click "Get Started" on any wine club, complete 5-step selection wizard
 *
 * Route Pattern: /wine-clubs/[clubId]
 * - Fetches detailed wine club data including variants and selling plans
 * - Renders selection wizard directly (not using Weaverse for this functional page)
 */

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const { clubId } = params;
  const { storefront } = context;

  if (!clubId) {
    throw new Response("Wine club ID is required", { status: 400 });
  }

  // Check if this is a revalidation request (from fetcher submission)
  // If so, return cached data or skip expensive API calls
  const url = new URL(request.url);
  const isRevalidation = url.searchParams.has("_data");

  // Parallel data loading (Constitutional Principle I)
  const [shopData, wineClubDetails] = await Promise.all([
    storefront.query(SHOP_QUERY),
    // Skip expensive Winehub API call during revalidation
    isRevalidation
      ? Promise.resolve(null)
      : fetchWineClubDetails({ context, clubId }),
  ]);

  // Handle wine club not found (only on initial load)
  if (!wineClubDetails && !isRevalidation) {
    throw new Response("Wine club not found", { status: 404 });
  }

  return data(
    {
      shopData,
      wineClub: wineClubDetails,
      clubId,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export default function WineClubDetailPage() {
  const { wineClub } = useLoaderData<typeof loader>();

  // Handle revalidation case where wineClub is null
  if (!wineClub) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Wine club header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {wineClub.name}
          </h1>
          {wineClub.description && (
            <div
              className="text-lg text-gray-600 mb-8"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(wineClub.description),
              }}
            />
          )}
        </div>

        {/* Selection wizard */}
        <SelectionWizardContainer
          wineClub={wineClub}
          showStepNumbers={true}
          allowStepNavigation={true}
        />
      </div>
    </div>
  );
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
 * SEO metadata for wine club detail page
 */
export function meta({ data }: { data: { wineClub?: WineClubDetails } }) {
  if (!data?.wineClub) {
    return [
      { title: "Wine Club Not Found" },
      { name: "robots", content: "noindex" },
    ];
  }

  const { wineClub } = data;
  const title = `${wineClub.name} | Wine Club Membership`;
  const description = wineClub.description
    ? wineClub.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : `Join ${wineClub.name} wine club and discover curated wines delivered to your door.`;

  // Handle image field - API might return string or object
  const imageUrl = typeof wineClub.image === "string" ? wineClub.image : "";

  return [
    { title },
    { name: "description", content: description },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    { name: "og:image", content: imageUrl },
    { name: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
}
