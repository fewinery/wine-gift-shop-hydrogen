import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getB2BListingContext } from "~/.server/b2b";
import { getFeaturedProducts } from "~/utils/featured-products";

export async function loader({ context }: LoaderFunctionArgs) {
  const b2b = await getB2BListingContext(context);
  if (b2b.hidden) {
    return data({ featuredProducts: { nodes: [] } });
  }
  return data(await getFeaturedProducts(context.storefront, b2b.buyer));
}
