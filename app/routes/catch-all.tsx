import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { seoPayload } from "~/.server/seo";
import { withWeaverseSeo } from "~/utils/weaverse-seo";
import { validateWeaverseData, WeaverseContent } from "~/weaverse";

export async function loader({ context }: LoaderFunctionArgs) {
  const weaverseData = await context.weaverse.loadPage({
    type: "CUSTOM",
  });
  validateWeaverseData(weaverseData);

  const seo = seoPayload.home({ pageName: weaverseData?.page?.name });

  return {
    weaverseData,
    seo,
  };
}

// Custom Weaverse pages start from the store-wide defaults in the root
// loader, then apply this page's Weaverse SEO panel.
export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  return withWeaverseSeo(
    getSeoMeta(
      ...matches.map((match) => (match?.data as any)?.seo).filter(Boolean),
    ),
    data?.weaverseData,
  );
};

export default function Component() {
  return <WeaverseContent />;
}
