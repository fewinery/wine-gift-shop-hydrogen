import type {
  DropInBlogListResponse,
  DropInBlogPost,
  DropInBlogSearchParams,
  DropInBlogSingleResponse,
} from "~/types/dropinblog";

const DROPINBLOG_API_BASE = "https://api.dropinblog.com/v2";

interface DropInBlogConfig {
  blogId: string;
  apiKey: string;
}

/**
 * DropInBlog API Client
 *
 * @description Class-based client for DropInBlog v2 API
 * @see https://dropinblog.readme.io/reference/api-reference
 */
export class DropInBlogClient {
  private readonly config: DropInBlogConfig;

  constructor(config: DropInBlogConfig) {
    this.config = config;
  }

  /**
   * Internal fetch helper with authentication
   */
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
        `DropInBlog API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get list of blog posts
   */
  async getPosts(
    params?: DropInBlogSearchParams,
  ): Promise<DropInBlogListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) {
      searchParams.set("page", params.page.toString());
    }
    if (params?.perPage) {
      searchParams.set("per_page", params.perPage.toString());
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.fetch<DropInBlogListResponse>(`/posts${query}`);
  }

  /**
   * Get single post by slug
   */
  async getPostBySlug(slug: string): Promise<DropInBlogPost | null> {
    const response = await this.fetch<DropInBlogSingleResponse>(
      `/posts/slug/${slug}`,
    );
    return response.data?.post || null;
  }

  /**
   * Search posts by term
   * @see https://dropinblog.readme.io/reference/posts-search
   */
  async searchPosts(
    searchTerm: string,
    params?: DropInBlogSearchParams,
  ): Promise<DropInBlogListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("search", searchTerm);
    if (params?.limit) {
      searchParams.set("per_page", params.limit.toString());
    }

    return this.fetch<DropInBlogListResponse>(
      `/posts/search?${searchParams.toString()}`,
    );
  }
}

/**
 * Factory function to create DropInBlog client
 *
 * @param env - Environment variables object
 * @returns DropInBlogClient instance
 *
 * @example
 * const dropinblog = createDropInBlogClient(context.env);
 * const posts = await dropinblog.getPosts();
 */
export function createDropInBlogClient(env: {
  DROPINBLOG_ID: string;
  DROPINBLOG_API_KEY: string;
}): DropInBlogClient {
  return new DropInBlogClient({
    blogId: env.DROPINBLOG_ID,
    apiKey: env.DROPINBLOG_API_KEY,
  });
}
