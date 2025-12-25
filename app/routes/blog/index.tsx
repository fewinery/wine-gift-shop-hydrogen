import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { createDropInBlogClient } from "~/utils/dropinblog";
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, context } = args;
  const { storefront, weaverse } = context;
  const { language, country } = storefront.i18n;

  // Initialize DropInBlog client
  const dropinblog = createDropInBlogClient(context.env);

  // Load blog posts and Weaverse data in parallel
  const [postsResponse, weaverseData] = await Promise.all([
    dropinblog.getPosts({ perPage: 16 }),
    weaverse.loadPage({ type: "BLOG", handle: "blog" }),
  ]);

  // Transform posts to match existing ArticleFragment interface
  const posts = postsResponse.data?.posts || [];
  const articles = posts.map((post) =>
    transformDropInBlogPost(post, { language, country }),
  );

  // Create blog object for compatibility with existing sections
  const blog = {
    title: "Blog",
    handle: "blog",
    seo: {
      title: "Blog",
      description: "Read our latest articles and updates",
    },
  };

  const seo = seoPayload.blog({ blog, url: request.url });

  return data({ blog, articles, seo, weaverseData });
};

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  return getSeoMeta(loaderData?.seo as SeoConfig);
};

export default function Blog() {
  return <WeaverseContent />;
}
