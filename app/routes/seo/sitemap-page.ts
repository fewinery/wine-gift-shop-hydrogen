import { getSitemap } from "@shopify/hydrogen";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({
  request,
  params,
  context: { storefront },
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // No hreflang alternates: the stores sell in English to the US only, and
    // "/FR-CA/..." or "/EN-CA/..." would list duplicate or untranslated pages.
    locales: [],
    getLink: ({ type, baseUrl, handle }) => `${baseUrl}/${type}/${handle}`,
  });

  response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

  return response;
}
