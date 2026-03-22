import {
  ArrowLeftIcon,
  FacebookLogoIcon,
  PinterestLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { createSchema, isBrowser } from "@weaverse/hydrogen";
import { Link, useLoaderData, useRouteLoaderData } from "react-router";
import {
  FacebookShareButton,
  PinterestShareButton,
  TwitterShareButton,
} from "react-share";
import { Image } from "~/components/image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import type { RootLoader } from "~/root";
import { getBlogBaseUrl } from "~/utils/blog";

// Local type for article data (compatible with DropInBlog)
interface ArticleData {
  title: string;
  handle: string;
  contentHtml: string;
  publishedAt?: string;
  tags?: string[];
  author?: { name: string };
  image?: {
    id?: string;
    altText?: string;
    url: string;
    width?: number;
    height?: number;
  } | null;
  seo?: {
    title?: string;
    description?: string;
  };
}

interface BlogPostProps extends SectionProps {
  ref: React.Ref<HTMLElement>;
  showTags: boolean;
  showShareButtons: boolean;
  showBackButton: boolean;
}

export function BlogPost(props: BlogPostProps) {
  const {
    ref,
    showTags,
    showShareButtons,
    showBackButton = true,
    ...rest
  } = props;
  const { layout } = useRouteLoaderData<RootLoader>("root");
  const { article, blog, formattedDate } = useLoaderData<{
    article: ArticleData;
    blog: { handle: string; title: string };
    formattedDate: string;
  }>();
  const { title, handle, image, contentHtml, author, tags = [] } = article;
  if (article) {
    let domain = layout.shop.primaryDomain.url;
    if (isBrowser) {
      const origin = window.location.origin;
      if (!origin.includes("localhost")) {
        domain = origin;
      }
    }
    const { handle: blogHandle } = blog;
    // DropInBlog: /blogs/article-slug
    // Shopify:    /blogs/blog-handle/article-slug
    const articleBaseUrl = getBlogBaseUrl(blogHandle);
    const articleUrl = `${domain}${articleBaseUrl}/${handle}`;
    return (
      <Section ref={ref} {...rest}>
        {image && (
          <div className="h-[520px]">
            <Image data={image} sizes="90vw" />
          </div>
        )}
        <div className="space-y-5 py-4 text-center lg:py-16">
          <div className="text-body-subtle">{formattedDate}</div>
          <h1 className="h3 leading-tight!">{title}</h1>
          {author?.name && (
            <div className="font-medium uppercase">
              by <span>{author.name}</span>
            </div>
          )}
          {showBackButton && (
            <nav className="flex justify-center font-medium opacity-60">
              <Link to="/" className="hover:underline">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/blogs" className="hover:underline">Blogs</Link>
              <span className="mx-2">/</span>
              <Link to={articleBaseUrl} className="hover:underline">{blog.handle === 'blog' ? 'News' : blog.handle}</Link>
              <span className="mx-2">/</span>
              <span className="max-w-[200px] truncate">{title}</span>
            </nav>
          )}
        </div>
        <div className="mx-auto w-1/3 border-line-subtle border-t" />
        <article className="prose mx-auto py-4 lg:max-w-4xl lg:py-10">
          <div className="mx-auto space-y-8 md:space-y-16">
            <div
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            <div className="mx-auto w-1/3 border-line-subtle border-t" />
            {showBackButton && (
              <div className="flex justify-center">
                <Link
                  to={articleBaseUrl}
                  className="inline-flex items-center gap-2 border border-black px-8 py-3 text-sm font-medium uppercase tracking-widest transition-all hover:bg-black hover:text-white"
                >
                  <ArrowLeftIcon size={16} />
                  <span>Back to Blog</span>
                </Link>
              </div>
            )}
            <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
              {showTags && (
                <div>
                  <strong>Tags:</strong>
                  <span className="ml-2">{tags.join(", ")}</span>
                </div>
              )}
              {showShareButtons && (
                <div className="flex items-center gap-2">
                  <strong>Share:</strong>
                  <FacebookShareButton url={articleUrl}>
                    <FacebookLogoIcon size={24} />
                  </FacebookShareButton>
                  <PinterestShareButton url={articleUrl} media={image?.url}>
                    <PinterestLogoIcon size={24} />
                  </PinterestShareButton>
                  <TwitterShareButton url={articleUrl} title={title}>
                    <XLogoIcon size={24} />
                  </TwitterShareButton>
                </div>
              )}
            </div>
          </div>
        </article>
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
}

export default BlogPost;

export const schema = createSchema({
  type: "blog-post",
  title: "Blog post",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((input) => input.name !== "borderRadius"),
    },
    {
      group: "Article",
      inputs: [
        {
          type: "switch",
          label: "Show back button",
          name: "showBackButton",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show tags",
          name: "showTags",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show share buttons",
          name: "showShareButtons",
          defaultValue: true,
        },
      ],
    },
  ],
});
