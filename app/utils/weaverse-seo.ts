import type { MetaDescriptor } from "react-router";

/**
 * Shape of the SEO data saved in Weaverse Studio's "Marketing > SEO" panel.
 * The Weaverse API returns it on `weaverseData.page.seo`. Every field is
 * optional, and the whole object is missing when nothing was saved.
 */
type WeaverseSeo = {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  canonicalUrl?: string | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    type?: string | null;
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    cardType?: string | null;
  } | null;
};

function getKey(descriptor: MetaDescriptor): string | null {
  const d = descriptor as Record<string, unknown>;
  if ("title" in d) {
    return "title";
  }
  if (d.tagName === "link" && d.rel === "canonical") {
    return "canonical";
  }
  if (typeof d.property === "string") {
    return d.property;
  }
  if (typeof d.name === "string") {
    return d.name;
  }
  return null;
}

/**
 * Lays the Weaverse SEO panel values over the theme's default meta tags.
 * Anything left empty in the panel keeps the theme default, so pages with
 * no Weaverse SEO data render exactly as before.
 */
export function withWeaverseSeo(
  base: MetaDescriptor[],
  weaverseData: unknown,
): MetaDescriptor[] {
  const seo = (weaverseData as { page?: { seo?: WeaverseSeo | null } } | null)
    ?.page?.seo;
  if (!seo) {
    return base;
  }

  const title = seo.title?.trim();
  const description = seo.description?.trim();
  const ogTitle = seo.openGraph?.title?.trim() || title;
  const ogDescription = seo.openGraph?.description?.trim() || description;
  const ogImage = seo.openGraph?.image?.trim();
  const twTitle = seo.twitter?.title?.trim() || ogTitle;
  const twDescription = seo.twitter?.description?.trim() || ogDescription;
  const twImage = seo.twitter?.image?.trim() || ogImage;

  const overrides: MetaDescriptor[] = [];
  if (title) {
    overrides.push({ title });
  }
  if (description) {
    overrides.push({ name: "description", content: description });
  }
  if (seo.keywords?.trim()) {
    overrides.push({ name: "keywords", content: seo.keywords.trim() });
  }
  if (seo.canonicalUrl?.trim()) {
    overrides.push({
      tagName: "link",
      rel: "canonical",
      href: seo.canonicalUrl.trim(),
    });
  }
  if (ogTitle) {
    overrides.push({ property: "og:title", content: ogTitle });
  }
  if (ogDescription) {
    overrides.push({ property: "og:description", content: ogDescription });
  }
  if (ogImage) {
    overrides.push({ property: "og:image", content: ogImage });
  }
  overrides.push({
    property: "og:type",
    content: seo.openGraph?.type || "website",
  });
  overrides.push({
    property: "twitter:card",
    content:
      seo.twitter?.cardType || (twImage ? "summary_large_image" : "summary"),
  });
  if (twTitle) {
    overrides.push({ property: "twitter:title", content: twTitle });
  }
  if (twDescription) {
    overrides.push({ property: "twitter:description", content: twDescription });
  }
  if (twImage) {
    overrides.push({ property: "twitter:image", content: twImage });
  }

  const replaced = new Set(overrides.map(getKey));
  const kept = base.filter((d) => {
    const key = getKey(d);
    return !key || !replaced.has(key);
  });
  return [...kept, ...overrides];
}
