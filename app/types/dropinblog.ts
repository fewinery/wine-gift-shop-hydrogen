/**
 * Type definitions for DropInBlog API v2
 * Based on actual API response
 */

/**
 * DropInBlog post data structure
 */
export interface DropInBlogPost {
  id: number;
  slug: string;
  title: string;
  url: string;
  summary: string;
  featuredImage: string | null;
  publishedAt: string;
  modifiedAt: string;
  updatedAt: string;
  seoTitle: string;
  seoDescription: string;
  readtime: string;
  status: string;
  pinned: number;
  noindex: number;
  author: {
    id: number;
    name: string;
    slug: string;
    photo: string | null;
    bio: string | null;
  };
  categories: Array<{
    id: number;
    title: string;
    slug: string;
  }>;
  content?: string;
}

/**
 * DropInBlog v2 API list response
 */
export interface DropInBlogListResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    posts: DropInBlogPost[];
    pagination?: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  };
}

/**
 * DropInBlog v2 API single post response
 */
export interface DropInBlogSingleResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    post: DropInBlogPost;
  };
}

/**
 * Search parameters for DropInBlog API
 */
export interface DropInBlogSearchParams {
  page?: number;
  perPage?: number;
  search?: string;
  limit?: number;
}
