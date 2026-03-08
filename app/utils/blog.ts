/**
 * Get the base URL for a blog based on the blog handle.
 * @param handle - The blog handle (e.g. "blog" for DropInBlog or "news" for Shopify)
 * @returns The base URL for the blog (e.g. "/blogs" or "/blogs/news")
 */
export function getBlogBaseUrl(handle: string): string {
  if (handle === "blog") {
    return "/blogs";
  }
  return `/blogs/${handle}`;
}
