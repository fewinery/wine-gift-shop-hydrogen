import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import invariant from "tiny-invariant";
import { seoPayload } from "~/.server/seo";
import {
  isVisibleToStorefront,
  resolveCtaEntry,
  storefrontKey,
} from "~/utils/blog-cta";
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

  const [{ blog }, weaverseData, themeSettings] = await Promise.all([
    storefront.query(ARTICLE_QUERY, {
      variables: { country, language, blogHandle, articleHandle },
    }),
    weaverse.loadPage({ type: "ARTICLE", handle: articleHandle }),
    weaverse.loadThemeSettings(),
  ]);

  if (!blog?.articleByHandle) {
    throw new Response("article", { status: 404 });
  }

  const article = blog.articleByHandle;
  const siteKey = storefrontKey(
    request,
    (themeSettings as { storefrontDomain?: string })?.storefrontDomain,
  );

  // A post can be written for one group of brands and not another, so a
  // storefront outside the list behaves as though the article does not exist
  // rather than rendering content meant for somebody else.
  if (!isVisibleToStorefront(article.blogStorefronts, siteKey)) {
    throw new Response("article", { status: 404 });
  }

  // The brand's own row wins even when blank - an empty row is how the CTA is
  // switched off for that brand. The product reference resolves in this
  // storefront's own catalog, so a bottle a brand does not carry comes back
  // null and nothing renders, rather than linking somewhere broken.
  const ctaEntry = resolveCtaEntry(article.blogCta, siteKey);

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
    blog: { handle: blogHandle, title: blog.title },
    relatedArticles,
    formattedDate,
    ctaEntry,
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
    $country: CountryCode
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      articleByHandle(handle: $articleHandle) {
        title
        handle
        contentHtml
        publishedAt
        tags
        blogStorefronts: metafield(
          namespace: "custom"
          key: "blog_storefronts"
        ) {
          references(first: 100) {
            nodes {
              ... on Metaobject {
                fields {
                  key
                  value
                }
              }
            }
          }
        }
        blogCta: metafield(namespace: "custom", key: "blog_cta") {
          references(first: 100) {
            nodes {
              ... on Metaobject {
                fields {
                  key
                  value
                  reference {
                    ... on Metaobject {
                      fields {
                        key
                        value
                      }
                    }
                    ... on Product {
                      id
                      title
                      handle
                      featuredImage {
                        id
                        url
                        altText
                        width
                        height
                      }
                      variants(first: 2) {
                        nodes {
                          id
                        }
                      }
                      selectedOrFirstAvailableVariant(
                        ignoreUnknownOptions: true
                      ) {
                        id
                        availableForSale
                        price {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
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
