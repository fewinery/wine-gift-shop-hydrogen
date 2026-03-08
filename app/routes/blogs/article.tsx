import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import invariant from "tiny-invariant";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const { request, params, context } = args;
  const { storefront, weaverse, env } = context;
  const { language, country } = storefront.i18n;

  if (env.BLOG_PROVIDER === "dropinblog") {
    throw new Response("article", { status: 404 });
  }

  invariant(params.blogHandle, "Missing blog handle");
  invariant(params.articleHandle, "Missing article handle");

  const { blogHandle, articleHandle } = params;

  const [{ blog }, weaverseData] = await Promise.all([
    storefront.query(ARTICLE_QUERY, {
      variables: { language, blogHandle, articleHandle },
    }),
    weaverse.loadPage({ type: "ARTICLE", handle: articleHandle }),
  ]);

  if (!blog?.articleByHandle) {
    throw new Response("article", { status: 404 });
  }

  const article = blog.articleByHandle;
  const relatedArticles = blog.articles.nodes.filter(
    (art: any) => art?.handle !== articleHandle,
  );

  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(article.publishedAt));

  const seo = seoPayload.article({ article, url: request.url });

  return {
    article,
    blog: { handle: blogHandle },
    relatedArticles,
    formattedDate,
    seo,
    weaverseData,
  };
}

export function meta({ data }: any) {
  return getSeoMeta(data?.seo as SeoConfig);
}

export function Article() {
  return <WeaverseContent />;
}

export default Article;

const ARTICLE_QUERY = `#graphql
  query article(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      articleByHandle(handle: $articleHandle) {
        title
        handle
        contentHtml
        publishedAt
        tags
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
      articles(first: 20) {
        nodes {
          handle
          title
          publishedAt
          image {
            id
            altText
            url
            width
            height
          }
          author: authorV2 {
            name
          }
          excerpt
          excerptHtml
          id
          contentHtml
          tags
        }
      }
    }
  }
` as const;
