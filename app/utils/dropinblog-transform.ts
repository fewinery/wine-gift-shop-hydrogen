import type { DropInBlogPost } from "~/types/dropinblog";

/**
 * Transform DropInBlog post to match ArticleFragment interface
 * Used by existing Shopify blog sections
 *
 * @param post - DropInBlog post object
 * @param locale - Locale object with language and country
 * @returns Transformed article object compatible with Shopify sections
 */
export function transformDropInBlogPost(
  post: DropInBlogPost,
  locale: { language: string; country: string },
) {
  const { language, country } = locale;

  // Safe date formatting
  let formattedDate = "";
  try {
    formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(post.publishedAt));
  } catch {
    formattedDate = post.publishedAt;
  }

  return {
    id: post.id.toString(),
    handle: post.slug,
    title: post.title,
    excerpt: post.summary,
    excerptHtml: `<p>${post.summary}</p>`,
    contentHtml: post.content || "",
    publishedAt: formattedDate,
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
    tags: [],
  };
}
