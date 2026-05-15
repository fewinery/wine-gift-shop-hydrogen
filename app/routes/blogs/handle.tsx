import type { SeoConfig } from "@shopify/hydrogen";
import { flattenConnection, getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import invariant from "tiny-invariant";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { createDropInBlogClient } from "~/utils/dropinblog";
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const { request, params, context } = args;
  const { storefront, weaverse, env } = context;
  const { language, country } = storefront.i18n;

  invariant(params.handle, "Missing handle");
  const { handle } = params;

  const blogProvider = env.BLOG_PROVIDER || "dropinblog";

  if (blogProvider === "dropinblog") {
    const dropinblog = createDropInBlogClient(env);
    let post;
    let allPostsResponse;
    let weaverseData;

    try {
      [post, allPostsResponse, weaverseData] = await Promise.all([
        dropinblog.getPostBySlug(handle),
        dropinblog.getPosts({ perPage: 20 }),
        weaverse.loadPage({ type: "ARTICLE", handle }),
      ]);
    } catch (error) {
      throw new Response("article", { status: 404 });
    }

    if (!post) throw new Response("article", { status: 404 });

    const article = transformDropInBlogPost(post, { language, country });
    const allPosts = allPostsResponse?.data?.posts || [];
    const relatedArticles = allPosts
      .filter((p) => p.slug !== handle)
        .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
      )
      .slice(0, 3)
      .map((p) => transformDropInBlogPost(p, { language, country }));

    const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(post.publishedAt));

    const seo = seoPayload.article({ article, url: request.url });
    return data({
      article,
      blog: { handle: "blog", title: "Blog" },
      relatedArticles,
      formattedDate,
      seo,
      weaverseData,
    });
  }

  const [{ blog }, weaverseData] = await Promise.all([
    storefront.query(BLOGS_QUERY, {
      variables: { blogHandle: handle, pageBy: 16, language },
    }),
    weaverse.loadPage({ type: "BLOG", handle }),
  ]);

  if (!blog?.articles) throw new Response("blog", { status: 404 });

  const articles = flattenConnection(blog.articles).map((article: any) => ({
    ...article,
    publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(article.publishedAt)),
  }));

  const seo = seoPayload.blog({ blog, url: request.url });
  return data({ blog, articles, seo, weaverseData });
}

export function meta({ data: loaderData }: any) {
  return getSeoMeta(loaderData?.seo as SeoConfig);
}

export function BlogHandle() {
  return <WeaverseContent />;
}

export default BlogHandle;

const BLOGS_QUERY = `#graphql
  query blog(
    $language: LanguageCode
    $blogHandle: String!
    $pageBy: Int!
    $cursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $pageBy,
        after: $cursor,
        sortKey: PUBLISHED_AT,
        reverse: true
      ) {
        edges {
          node {
            author: authorV2 { name }
            contentHtml
            excerpt
            excerptHtml
            handle
            id
            image {
              id
              altText
              url
              width
              height
            }
            publishedAt
            title
            tags
          }
        }
      }
    }
  }
` as const;
