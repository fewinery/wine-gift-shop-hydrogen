import type { SeoConfig } from "@shopify/hydrogen";
import type {
  Article,
  Blog,
  Page,
  Product,
  ShopPolicy,
} from "@shopify/hydrogen/storefront-api-types";
import type { BreadcrumbList, CollectionPage, Offer } from "schema-dts";
import type {
  CollectionsQuery,
  ProductQuery,
  ShopFragment,
} from "storefront-api.generated";

/**
 * Store-wide defaults, used wherever a page has nothing better.
 *
 * Many storefronts share one Shopify store, so the Shopify store name,
 * description and logo belong to that shared store, not to this brand.
 * The defaults therefore come from the Weaverse theme settings (Branding),
 * which are set per storefront.
 */
function root({
  shop,
  url,
  siteTitle,
  siteDescription,
  shareImage,
}: {
  shop: ShopFragment;
  url: Request["url"];
  siteTitle?: string;
  siteDescription?: string;
  shareImage?: string;
}): SeoConfig {
  const brand = siteTitle || shop?.name || "";
  return {
    title: brand,
    titleTemplate: `%s | ${brand}`,
    description: truncate(siteDescription ?? ""),
    media: shareImage || undefined,
    url,
    robots: {
      noIndex: false,
      noFollow: false,
    },
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brand,
      url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}search?q={search_term}`,
        query: "required name='search_term'",
      },
    },
  };
}

/**
 * Home page and Weaverse custom pages (/club, /loyalty, ...). Description and
 * image come from the store-wide defaults; the Weaverse SEO panel is applied
 * on top of this in the route's meta function.
 */
function home({
  siteTitle,
  pageName,
}: {
  siteTitle?: string;
  pageName?: string;
} = {}): SeoConfig {
  if (pageName) {
    // "Club | 1883 Reserve"
    return {
      title: pageName,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: pageName,
      },
    };
  }
  // The home page is just the brand name, not "Brand | Brand".
  return {
    title: siteTitle,
    titleTemplate: "%s",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Home page",
    },
  };
}

function productJsonLd({
  product: productData,
  selectedVariant,
  url,
}: {
  product: ProductQuery["product"];
  selectedVariant: ProductQuery["product"]["selectedOrFirstAvailableVariant"];
  url: Request["url"];
}): SeoConfig["jsonLd"] {
  const origin = new URL(url).origin;
  const description = truncate(
    productData?.seo?.description ?? productData?.description,
  );

  // Create offers array from adjacent variants
  const offers: Offer[] = [];
  if (productData?.adjacentVariants) {
    for (const variant of productData.adjacentVariants) {
      const variantUrl = new URL(url);
      for (const option of variant.selectedOptions) {
        variantUrl.searchParams.set(option.name, option.value);
      }
      const availability = variant.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

      offers.push({
        "@type": "Offer",
        availability,
        price: Number.parseFloat(variant.price.amount),
        priceCurrency: variant.price.currencyCode,
        sku: variant?.sku ?? "",
        url: variantUrl.toString(),
      });
    }
  }

  // If no adjacent variants, add the selected variant
  if (offers.length === 0 && selectedVariant) {
    const availability = selectedVariant.availableForSale
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

    offers.push({
      "@type": "Offer",
      availability,
      price: Number.parseFloat(selectedVariant.price.amount),
      priceCurrency: selectedVariant.price.currencyCode,
      sku: selectedVariant?.sku ?? "",
      url,
    });
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Products",
          item: `${origin}/products`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: productData.title,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      brand: {
        "@type": "Brand",
        name: productData.vendor,
      },
      description,
      image: [selectedVariant?.image?.url ?? ""],
      name: productData.title,
      offers,
      sku: selectedVariant?.sku ?? "",
      url,
    },
  ];
}

function product({
  product: productData,
  url,
}: {
  product: ProductQuery["product"];
  url: Request["url"];
}): SeoConfig {
  const description = truncate(
    productData?.seo?.description ?? productData?.description ?? "",
  );
  const selectedVariant = productData?.selectedOrFirstAvailableVariant;
  return {
    title: productData?.seo?.title ?? productData?.title,
    description,
    media: selectedVariant?.image,
    jsonLd: productJsonLd({ product: productData, selectedVariant, url }),
  };
}

type CollectionRequiredFields = {
  id: string;
  handle: string;
  title: string;
  description?: string;
  seo: {
    title?: string;
    description?: string;
  };
  image?: {
    url: string;
    height?: number;
    width?: number;
    altText?: string;
  } | null;
  products: { nodes: Pick<Product, "handle">[] };
};

function collectionJsonLd({
  url,
  collection: collectionData,
}: {
  url: Request["url"];
  collection: CollectionRequiredFields;
}): SeoConfig["jsonLd"] {
  const siteUrl = new URL(url);
  const itemListElement: CollectionPage["mainEntity"] =
    collectionData.products.nodes.map((prod, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `/products/${prod.handle}`,
      };
    });

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Collections",
          item: `${siteUrl.host}/collections`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: collectionData.title,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: collectionData?.seo?.title ?? collectionData?.title ?? "",
      description: truncate(
        collectionData?.seo?.description ?? collectionData?.description ?? "",
      ),
      image: collectionData?.image?.url,
      url: `/collections/${collectionData.handle}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement,
      },
    },
  ];
}

function collection({
  collection: collectionData,
  url,
}: {
  collection: CollectionRequiredFields;
  url: Request["url"];
}): SeoConfig {
  return {
    title: collectionData?.seo?.title || collectionData?.title,
    // Collections are shared by every storefront on the Shopify store, so an
    // empty description falls back to this brand's default, not the store's.
    description:
      truncate(
        collectionData?.seo?.description || collectionData?.description || "",
      ) || undefined,
    url,
    media: collectionData?.image?.url
      ? {
          type: "image",
          url: collectionData.image.url,
          height: collectionData.image.height,
          width: collectionData.image.width,
          altText: collectionData.image.altText,
        }
      : undefined,
    jsonLd: collectionJsonLd({ collection: collectionData, url }),
  };
}

type CollectionListRequiredFields = CollectionsQuery["collections"];

function collectionsJsonLd({
  url,
  collections,
}: {
  url: Request["url"];
  collections: CollectionListRequiredFields;
}): SeoConfig["jsonLd"] {
  const itemListElement: CollectionPage["mainEntity"] = collections.nodes.map(
    (col, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `/collections/${col.handle}`,
      };
    },
  );

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Collections",
    description: "All collections",
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement,
    },
  };
}

function listCollections({
  collections,
  url,
}: {
  collections: CollectionListRequiredFields;
  url: Request["url"];
}): SeoConfig {
  return {
    title: "Collections",
    description: "All collections",
    url,
    jsonLd: collectionsJsonLd({ collections, url }),
  };
}

function article({
  article: articleData,
  url,
}: {
  article: Pick<
    Article,
    "title" | "contentHtml" | "seo" | "publishedAt" | "excerpt"
  > & {
    image?: null | Pick<
      NonNullable<Article["image"]>,
      "url" | "height" | "width" | "altText"
    >;
  };
  url: Request["url"];
}): SeoConfig {
    return {
    title: articleData?.seo?.title || articleData?.title,
    description: truncate(
      articleData?.seo?.description || articleData?.excerpt || "",
    ),
    url,
    media: articleData?.image?.url
      ? {
          type: "image",
          url: articleData.image.url,
          height: articleData.image.height,
          width: articleData.image.width,
          altText: articleData.image.altText,
        }
      : undefined,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      alternativeHeadline: articleData.title,
      articleBody: articleData.contentHtml,
      datePublished: articleData?.publishedAt,
      description: truncate(
        articleData?.seo?.description || articleData?.excerpt || "",
      ),
      headline: articleData?.seo?.title || "",
      image: articleData?.image?.url,
      url,
    },
  };
}

function blog({
  blog: blogData,
  url,
}: {
  blog: Pick<Blog, "seo" | "title">;
  url: Request["url"];
}): SeoConfig {
  return {
    title: blogData?.seo?.title || blogData?.title,
    description: truncate(blogData?.seo?.description || ""),
    url,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: blogData?.seo?.title || blogData?.title || "",
      description: blogData?.seo?.description || "",
      url,
    },
  };
}

function page({
  page: pageData,
  url,
}: {
  page: Pick<Page, "title" | "seo">;
  url: Request["url"];
}): SeoConfig {
  return {
    description: truncate(pageData?.seo?.description || ""),
    title: pageData?.seo?.title || pageData?.title,
    url,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: pageData.title,
    },
  };
}

function policy({
  policy: policyData,
  url,
}: {
  policy: Pick<ShopPolicy, "title" | "body">;
  url: Request["url"];
}): SeoConfig {
  return {
    description: truncate(policyData?.body ?? ""),
    title: policyData?.title,
    url,
  };
}

function policies({
  policies: policiesData,
  url,
}: {
  policies: Pick<ShopPolicy, "title" | "handle">[];
  url: Request["url"];
}): SeoConfig {
  const origin = new URL(url).origin;
  const itemListElement: BreadcrumbList["itemListElement"] = policiesData
    .filter(Boolean)
    .map((pol, index) => {
      return {
        "@type": "ListItem",
        position: index + 1,
        name: pol.title,
        item: `${origin}/policies/${pol.handle}`,
      };
    });
  return {
    title: "Policies",
    description: "Store policies",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        description: "Store policies",
        name: "Policies",
        url,
      },
    ],
  };
}

export const seoPayload = {
  article,
  blog,
  collection,
  home,
  listCollections,
  page,
  policies,
  policy,
  product,
  root,
};

/**
 * Truncate a string to a given length, adding an ellipsis if it was truncated
 * @param str - The string to truncate
 * @param num - The maximum length of the string
 * @returns The truncated string
 * @example
 * ```js
 * truncate('Hello world', 5) // 'Hello...'
 * ```
 */
function truncate(str: string, num = 155): string {
  if (typeof str !== "string") {
    return "";
  }
  if (str.length <= num) {
    return str;
  }
  return `${str.slice(0, num - 3)}...`;
}
