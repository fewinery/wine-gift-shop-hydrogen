import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import invariant from "tiny-invariant";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { createDropInBlogClient } from "~/utils/dropinblog";
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const { request, params, context } = args;
  const { storefront, weaverse } = context;
  const { language, country } = storefront.i18n;

  // Initialize DropInBlog client
  const dropinblog = createDropInBlogClient(context.env);

  invariant(params.slug, "Missing article slug");

  const { slug } = params;

  // Load post data, related posts, and Weaverse data in parallel
  const [post, allPostsResponse, weaverseData] = await Promise.all([
    dropinblog.getPostBySlug(slug),
    dropinblog.getPosts({ perPage: 20 }), // For related articles
    weaverse.loadPage({
      type: "ARTICLE",
      handle: slug,
    }),
  ]);

  if (!post) {
    throw new Response(null, { status: 404 });
  }

  // Transform main article
  const article = {
    title: post.title,
    handle: post.slug,
    contentHtml: post.content || "",
    publishedAt: post.publishedAt,
    tags: [],
    author: { name: post.author?.name || "Unknown" },
    image: post.featuredImage
      ? {
          id: post.id.toString(),
          altText: post.title,
          url: post.featuredImage,
          width: 800,
          height: 600,
        }
      : null,
    seo: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.summary,
    },
  };

  // Get related articles (exclude current post, limit to 3)
  const allPosts = allPostsResponse.data?.posts || [];
  const relatedArticles = allPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) => transformDropInBlogPost(p, { language, country }));

  // Format date
  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.publishedAt));

  // Blog info for compatibility
  const blog = {
    handle: "blog",
  };

  const seo = seoPayload.article({ article, url: request.url });

  return {
    article,
    blog,
    relatedArticles,
    formattedDate,
    seo,
    weaverseData,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return getSeoMeta(data?.seo as SeoConfig);
};

export default function Article() {
  return <WeaverseContent />;
}
