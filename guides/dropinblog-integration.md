# DropInBlog Integration Guide

## Overview
This guide documents the integration of DropInBlog API to replace Shopify's native blog functionality in the Pilot theme.

**Date Created:** December 24, 2025  
**Status:** Implementation Plan  
**Estimated Time:** 2.5-3 hours

## Key Decisions

1. **URL Structure:** `/blog/:slug` (simpler than Shopify's `/blogs/:blogHandle/:articleHandle`)
2. **No Backward Compatibility:** No redirects from old Shopify blog URLs
3. **No Category/Author Pages:** Just main list and article detail pages
4. **Search Integration:** Integrate with existing predictive search at `/app/routes/api/predictive-search.ts`
5. **No RSS Feed:** Not needed initially
6. **No Preview Mode:** Not needed initially

## Environment Variables

Already configured in `.env.example`:
```bash
DROPINBLOG_API_KEY="your-public-api-key"
DROPINBLOG_ID="d785b79c-0891-491d-abf0-ef5284cdcffb"
```

## Architecture Overview

### Data Flow
```
User Request → React Router Loader → DropInBlog API Client → Transform Data → Weaverse Sections → UI
```

### Key Components
1. **API Client** (`app/utils/dropinblog.ts`) - Handles all API communication
2. **Type Definitions** (`app/types/dropinblog.ts`) - TypeScript interfaces
3. **Data Transformer** (`app/utils/dropinblog-transform.ts`) - Converts DropInBlog data to Shopify format
4. **Routes** (`app/routes/blog/`) - Blog list and article detail pages
5. **Sections** (`app/sections/`) - Weaverse-compatible UI components

---

## Implementation Plan

### Phase 1: Foundation (30-45 min)

#### 1.1 Create Type Definitions
**File:** `app/types/dropinblog.ts`

```typescript
export interface DropInBlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML
  published_at: string; // ISO date
  featured_image?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  author: {
    id: number;
    name: string;
    slug: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: string[];
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface DropInBlogListResponse {
  data: DropInBlogPost[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DropInBlogSearchParams {
  page?: number;
  perPage?: number;
  search?: string;
  limit?: number;
}
```

#### 1.2 Create API Client
**File:** `app/utils/dropinblog.ts`

```typescript
import type {
  DropInBlogPost,
  DropInBlogListResponse,
  DropInBlogSearchParams,
} from "~/types/dropinblog";

const DROPINBLOG_API_BASE = "https://api.dropinblog.com/v2";

interface DropInBlogConfig {
  blogId: string;
  apiKey: string;
}

export class DropInBlogClient {
  private config: DropInBlogConfig;

  constructor(config: DropInBlogConfig) {
    this.config = config;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${DROPINBLOG_API_BASE}/blog/${this.config.blogId}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `DropInBlog API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getPosts(params?: DropInBlogSearchParams): Promise<DropInBlogListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.perPage) searchParams.set("per_page", params.perPage.toString());

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.fetch<DropInBlogListResponse>(`/posts${query}`);
  }

  async getPostBySlug(slug: string): Promise<DropInBlogPost> {
    return this.fetch<DropInBlogPost>(`/posts/slug/${slug}`);
  }

  async searchPosts(
    searchTerm: string,
    params?: DropInBlogSearchParams
  ): Promise<DropInBlogListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("search", searchTerm);
    if (params?.limit) searchParams.set("per_page", params.limit.toString());

    return this.fetch<DropInBlogListResponse>(`/posts?${searchParams.toString()}`);
  }
}

// Factory function
export function createDropInBlogClient(env: {
  DROPINBLOG_ID: string;
  DROPINBLOG_API_KEY: string;
}): DropInBlogClient {
  return new DropInBlogClient({
    blogId: env.DROPINBLOG_ID,
    apiKey: env.DROPINBLOG_API_KEY,
  });
}
```

#### 1.3 Usage Pattern (No Context Injection)
Instead of injecting into the app context, we'll initialize the client directly in the loaders where needed. This keeps dependencies explicit and isolated.

**Usage Example:**
```typescript
import { createDropInBlogClient } from "~/utils/dropinblog";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  // Initialize client with env vars from context
  const dropinblog = createDropInBlogClient(context.env);
  
  const posts = await dropinblog.getPosts();
  // ...
};
```

---

### Phase 2: Data Transformation (15 min)

#### 2.1 Create Transformation Helper
**File:** `app/utils/dropinblog-transform.ts`

```typescript
import type { DropInBlogPost } from "~/types/dropinblog";

/**
 * Transform DropInBlog post to match ArticleFragment interface
 * Used by existing Shopify blog sections
 */
export function transformDropInBlogPost(
  post: DropInBlogPost,
  locale: { language: string; country: string }
) {
  const { language, country } = locale;

  return {
    id: post.id.toString(),
    handle: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    excerptHtml: `<p>${post.excerpt}</p>`,
    contentHtml: post.content,
    publishedAt: new Intl.DateTimeFormat(`${language}-${country}`, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(post.published_at)),
    author: { name: post.author.name },
    image: post.featured_image
      ? {
          id: post.id.toString(),
          altText: post.featured_image.alt || post.title,
          url: post.featured_image.url,
          width: post.featured_image.width || 800,
          height: post.featured_image.height || 600,
        }
      : null,
    tags: post.tags,
  };
}
```

---

### Phase 3: Route Migration (45-60 min)

#### 3.1 Create Blog List Route
**File:** `app/routes/blog/index.tsx`

```typescript
import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, context } = args;
  const { storefront, weaverse, env } = context;
  const { language, country } = storefront.i18n;

  // Initialize DropInBlog client
  const dropinblog = createDropInBlogClient(env);

  // Load blog posts and Weaverse data in parallel
  const [postsResponse, weaverseData] = await Promise.all([
    dropinblog.getPosts({ perPage: 16 }),
    weaverse.loadPage({ type: "BLOG", handle: "blog" }),
  ]);

  // Transform posts to match existing ArticleFragment interface
  const articles = postsResponse.data.map((post) =>
    transformDropInBlogPost(post, { language, country })
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
```

#### 3.2 Create Article Detail Route
**File:** `app/routes/blog/$slug.tsx`

```typescript
import type { SeoConfig } from "@shopify/hydrogen";
import { getSeoMeta } from "@shopify/hydrogen";
import type { RouteLoaderArgs } from "@weaverse/hydrogen";
import type { MetaFunction } from "react-router";
import invariant from "tiny-invariant";
import { seoPayload } from "~/.server/seo";
import { routeHeaders } from "~/utils/cache";
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
import { WeaverseContent } from "~/weaverse";

export const headers = routeHeaders;

export async function loader(args: RouteLoaderArgs) {
  const { request, params, context } = args;
  const { storefront, weaverse, env } = context;
  const { language, country } = storefront.i18n;

  // Initialize DropInBlog client
  const dropinblog = createDropInBlogClient(env);

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
    contentHtml: post.content,
    publishedAt: post.published_at,
    tags: post.tags,
    author: { name: post.author.name },
    image: post.featured_image
      ? {
          id: post.id.toString(),
          altText: post.featured_image.alt || post.title,
          url: post.featured_image.url,
          width: post.featured_image.width || 800,
          height: post.featured_image.height || 600,
        }
      : null,
    seo: {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt,
    },
  };

  // Get related articles (exclude current post, limit to 3)
  const relatedArticles = allPostsResponse.data
    .filter((p) => p.slug !== slug)
    .slice(0, 3)
    .map((p) => transformDropInBlogPost(p, { language, country }));

  // Format date
  const formattedDate = new Intl.DateTimeFormat(`${language}-${country}`, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.published_at));

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
```

#### 3.3 Delete Old Routes
```bash
rm app/routes/blogs/blog.tsx
rm app/routes/blogs/article.tsx
```

---

### Phase 4: Section Updates (30 min)

#### 4.1 Update Blogs Section
**File:** `app/sections/blogs.tsx`

**Changes needed:**

1. Remove `blogHandle` from `ArticleCardProps` interface (line 60):
```typescript
export interface ArticleCardProps {
  article: ArticleFragment;
  // REMOVE: blogHandle: string;
  loading?: HTMLImageElement["loading"];
  showDate: boolean;
  showExcerpt: boolean;
  showAuthor: boolean;
  showReadmore: boolean;
  imageAspectRatio: ImageAspectRatio;
  className?: string;
}
```

2. Update `ArticleCard` function signature (line 72):
```typescript
export function ArticleCard({
  // REMOVE: blogHandle,
  article,
  loading,
  showExcerpt,
  showAuthor,
  showDate,
  showReadmore,
  imageAspectRatio,
  className,
}: Omit<ArticleCardProps, "blogHandle">) {
```

3. Update all URLs in `ArticleCard` (lines 87, 101, 121):
```typescript
// CHANGE FROM:
to={`/blogs/${blogHandle}/${article.handle}`}

// CHANGE TO:
to={`/blog/${article.handle}`}
```

4. Remove `blogHandle` prop from `Blogs` component (line 43):
```typescript
<ArticleCard
  key={article.id}
  // REMOVE: blogHandle={blog.handle}
  article={article}
  loading={getImageLoadingPriority(i, 2)}
  showAuthor={showAuthor}
  showExcerpt={showExcerpt}
  showDate={showDate}
  showReadmore={showReadmore}
  imageAspectRatio={imageAspectRatio}
/>
```

5. Update interface (line 13):
```typescript
interface BlogsProps
  extends Omit<ArticleCardProps, "article" | "loading">, // REMOVE "blogHandle" from Omit
    SectionProps {
  ref: React.Ref<HTMLElement>;
  layout: "blog" | "default";
}
```

#### 4.2 Update Blog Post Section
**File:** `app/sections/blog-post.tsx`

Update URL generation (line 42):
```typescript
// CHANGE FROM:
const articleUrl = `${domain}/blogs/${blogHandle}/${handle}`;

// CHANGE TO:
const articleUrl = `${domain}/blog/${handle}`;
```

#### 4.3 Update Related Articles Section
**File:** `app/sections/related-articles.tsx`

1. Remove `blogHandle` from interface (line 11):
```typescript
interface RelatedArticlesProps
  extends Omit<ArticleCardProps, "article" | "loading">, // REMOVE "blogHandle" from Omit
    SectionProps {
  ref: React.Ref<HTMLElement>;
  heading: string;
}
```

2. Remove `blogHandle` prop (line 41):
```typescript
<ArticleCard
  key={article.id}
  // REMOVE: blogHandle={blog.handle}
  article={article}
  loading={getImageLoadingPriority(i, 2)}
  showAuthor={showAuthor}
  showExcerpt={showExcerpt}
  showDate={showDate}
  showReadmore={showReadmore}
  imageAspectRatio={imageAspectRatio}
  className="w-80 snap-start"
/>
```

---

### Phase 5: Search Integration (20-30 min)

#### 5.1 Update Predictive Search
**File:** `app/routes/api/predictive-search.ts`

Add import at top:
```typescript
import { transformDropInBlogPost } from "~/utils/dropinblog-transform";
```

Update loader function:
```typescript
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchTerm = String(url.searchParams.get("q") || "").trim();
  const { storefront, env } = context;
  const { language, country } = storefront.i18n;

  if (!searchTerm) {
    return json({ searchResults: { results: null, totalResults: 0 } });
  }

  // Initialize DropInBlog client
  const dropinblog = createDropInBlogClient(env);

  // Parallel search: Shopify + DropInBlog
  const [shopifyData, blogData] = await Promise.all([
    storefront.query<PredictiveSearchQuery>(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        limit: 6,
        limitScope: "EACH",
        searchTerm,
        language,
      },
    }),
    dropinblog.searchPosts(searchTerm, { limit: 3 }).catch(() => ({ data: [] })),
  ]);

  // Transform blog posts
  const articles = blogData.data?.map((post) =>
    transformDropInBlogPost(post, { language, country })
  ) || [];

  // Combine results
  const searchResults = {
    results: shopifyData.predictiveSearch,
    articles, // Add blog articles
    totalResults: Object.values(shopifyData.predictiveSearch).reduce(
      (total, items) => total + (Array.isArray(items) ? items.length : 0),
      articles.length
    ),
  };

  return json({ searchResults });
}
```

#### 5.2 Update Search UI Component
**File:** Check `app/hooks/use-predictive-search.ts` or your search component

Add rendering for blog articles in search results:
```typescript
{results.articles && results.articles.length > 0 && (
  <div>
    <h3>Articles</h3>
    {results.articles.map((article) => (
      <Link key={article.id} to={`/blog/${article.handle}`}>
        {article.title}
      </Link>
    ))}
  </div>
)}
```

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/blog` - should display list of blog posts
- [ ] Click on a blog post - should navigate to `/blog/{slug}`
- [ ] Verify article detail page displays correctly
- [ ] Test predictive search includes blog posts
- [ ] Verify search results link to `/blog/{slug}`
- [ ] Test Weaverse Studio editing on blog pages
- [ ] Verify SEO meta tags are correct (check page source)
- [ ] Test related articles display on article detail page
- [ ] Verify images load correctly
- [ ] Test mobile responsiveness

### Code Quality
- [ ] Run `npm run biome:fix`
- [ ] Run `npm run typecheck`
- [ ] Check for TypeScript errors
- [ ] Verify no console errors in browser

### E2E Tests (Optional)
**File:** `tests/dropinblog.test.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("DropInBlog Integration", () => {
  test("should display blog posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h4")).toContainText("Blog");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("should navigate to article detail", async ({ page }) => {
    await page.goto("/blog");
    const firstArticle = page.locator("a[href^='/blog/']").first();
    await firstArticle.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
  });

  test("should include blog posts in search", async ({ page }) => {
    await page.goto("/");
    await page.fill("input[type='search']", "test");
    await page.waitForTimeout(500);
    const searchResults = page.locator("a[href^='/blog/']");
    await expect(searchResults.first()).toBeVisible();
  });
});
```

---

## Files Summary

### New Files Created
1. `app/types/dropinblog.ts` - Type definitions
2. `app/utils/dropinblog.ts` - API client
3. `app/utils/dropinblog-transform.ts` - Data transformation
4. `app/routes/blog/index.tsx` - Blog list route
5. `app/routes/blog/$slug.tsx` - Article detail route
6. `guides/dropinblog-integration.md` - This documentation

### Modified Files
1. `app/routes/api/predictive-search.ts` - Added blog search
2. `app/sections/blogs.tsx` - Removed blogHandle, updated URLs
3. `app/sections/blog-post.tsx` - Updated URLs
4. `app/sections/related-articles.tsx` - Removed blogHandle

### Deleted Files
1. `app/routes/blogs/blog.tsx` - Replaced by `blog/index.tsx`
2. `app/routes/blogs/article.tsx` - Replaced by `blog/$slug.tsx`

---

## API Reference

### DropInBlog API Endpoints Used

**Base URL:** `https://api.dropinblog.com/v2`

#### List Posts
```
GET /blog/{blog_id}/posts?page=1&per_page=16
```

#### Get Post by Slug
```
GET /blog/{blog_id}/posts/slug/{slug}
```

#### Search Posts
```
GET /blog/{blog_id}/posts?search={query}&per_page=5
```

**Authentication:** Bearer token in `Authorization` header

**Rate Limit:** 60 requests per minute

---

## Troubleshooting

### Common Issues

**1. API Key not working**
- Verify `DROPINBLOG_API_KEY` is set in `.env`
- Ensure using **public** API key (not private)
- Check key hasn't expired in DropInBlog dashboard

**2. TypeScript errors**
- Run `npm run typecheck` to see all errors
- Ensure all imports are correct
- Verify context types are updated

**3. Posts not displaying**
- Check browser console for errors
- Verify API response in Network tab
- Check DropInBlog dashboard has published posts

**4. Search not working**
- Verify predictive search component renders articles
- Check API response includes `articles` array
- Ensure search UI is updated to display blog results

**5. Images not loading**
- Verify DropInBlog posts have featured images
- Check CORS settings if needed
- Verify image URLs are valid

### Debug Commands

```bash
# Type check
npm run typecheck

# Lint and format
npm run biome:fix

# Run dev server
npm run dev

# Check API response
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.dropinblog.com/v2/blog/YOUR_ID/posts
```

---

## Future Enhancements

### Potential Features
1. **Pagination** - Add page navigation for blog list
2. **Category Pages** - Filter posts by category
3. **Author Pages** - Filter posts by author
4. **RSS Feed** - Generate RSS/Atom feed
5. **Draft Preview** - Preview unpublished posts
6. **Related Posts by Category** - Better related article algorithm
7. **Search Filters** - Filter search by post type
8. **Caching Strategy** - Implement Redis/CDN caching
9. **Sitemap Integration** - Add blog posts to sitemap.xml
10. **Analytics** - Track blog post views

### Implementation Notes
If implementing pagination:
- Create `app/routes/blog/page/$page.tsx`
- Add pagination component to `app/components/blog-pagination.tsx`
- Update loader to accept page param

---

## Maintenance

### Regular Tasks
- Monitor DropInBlog API rate limits
- Update API key if rotated
- Check for DropInBlog API updates
- Review error logs for API failures

### Performance Optimization
- Consider caching API responses (5-10 minutes)
- Implement CDN for DropInBlog images
- Use Hydrogen's cache API for loader data
- Monitor API response times

---

## Support & Resources

- **DropInBlog API Docs:** https://dropinblog.readme.io/reference/api-reference
- **DropInBlog Dashboard:** https://app.dropinblog.com
- **React Router Docs:** https://reactrouter.com
- **Hydrogen Docs:** https://shopify.dev/docs/custom-storefronts/hydrogen

---

**Last Updated:** December 24, 2025  
**Version:** 1.0  
**Author:** AI Assistant
