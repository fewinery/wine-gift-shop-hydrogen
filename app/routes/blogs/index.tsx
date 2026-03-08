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

export async function loader(args: LoaderFunctionArgs) {
  const { request, context } = args;
  const { storefront, weaverse, env } = context;
  const { language, country } = storefront.i18n;

  if (env.BLOG_PROVIDER === "shopify") {
    throw new Response("blog", { status: 404 });
  }

  const dropinblog = createDropInBlogClient(env);
  const [postsResponse, weaverseData] = await Promise.all([
    dropinblog.getPosts({ perPage: 16 }),
    weaverse.loadPage({ type: "BLOG", handle: "blog" }),
  ]);

  const posts = postsResponse.data?.posts || [];
  const articles = posts.map((post) =>
    transformDropInBlogPost(post, { language, country }),
  );

  const blog = {
    title: "Blog",
    handle: "blog",
    seo: { title: "Blog", description: "Read our latest articles and updates" },
  };

  const seo = seoPayload.blog({ blog, url: request.url });
  return data({ blog, articles, seo, weaverseData });
}

export function meta({ data: loaderData }: any) {
  return getSeoMeta(loaderData?.seo as SeoConfig);
}

export function BlogIndex() {
  return <WeaverseContent />;
}

export default BlogIndex;
