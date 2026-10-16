import { XIcon } from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import type { loader as articleLoader } from "~/routes/blogs/article.tsx";

interface BlogCtaProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  ctaLayout: "floating" | "sticky" | "inline";
  heading: string;
  addToCartText: string;
  viewProductText: string;
  showAfterPercent: number;
  dismissible: boolean;
}

const PERCENT = 100;

/** The slice of a product the CTA needs, read structurally: it arrives through
 * a generic metaobject reference, not a generated fragment type. */
interface CtaProduct {
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  variants?: { nodes?: Array<{ id: string }> } | null;
  selectedOrFirstAvailableVariant?: {
    id: string;
    availableForSale: boolean;
    price?: MoneyV2 | null;
  } | null;
}

/**
 * Reveals the CTA once the reader is some way into the article. Someone who
 * has just landed has not read anything yet, so a bar that appears instantly
 * is interruption rather than suggestion.
 */
function useRevealOnScroll(enabled: boolean, afterPercent: number) {
  const [revealed, setRevealed] = useState(!enabled || afterPercent <= 0);

  useEffect(() => {
    if (!enabled || afterPercent <= 0) {
      setRevealed(true);
      return;
    }
    function onScroll() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setRevealed(true);
        return;
      }
      const progress = (window.scrollY / scrollable) * PERCENT;
      setRevealed(progress >= afterPercent);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, afterPercent]);

  return revealed;
}

export default function BlogCta(props: BlogCtaProps) {
  const {
    ref,
    ctaLayout,
    heading,
    addToCartText,
    viewProductText,
    showAfterPercent,
    dismissible,
    ...rest
  } = props;
  const { ctaEntry } = useLoaderData<typeof articleLoader>();
  const [dismissed, setDismissed] = useState(false);
  const isFloating = ctaLayout === "floating";
  const revealed = useRevealOnScroll(isFloating, showAfterPercent);

  if (!ctaEntry || dismissed) {
    return null;
  }

  const product = ctaEntry.product as CtaProduct | null;
  // A row promotes a product or a page, never both. The product reference
  // resolves in this storefront's own catalog, so one a brand does not carry
  // arrives null and the row falls through to its link, or to nothing.
  if (!(product || ctaEntry.link)) {
    return null;
  }

  const variant = product?.selectedOrFirstAvailableVariant;
  // Add to cart only when there is nothing to choose. A gift set with options
  // would otherwise add a variant the reader never picked.
  const canAddToCart =
    (product?.variants?.nodes?.length ?? 0) === 1 &&
    Boolean(variant?.availableForSale);
  const target = product
    ? `/products/${product.handle}`
    : (ctaEntry.link ?? "");
  const image = product?.featuredImage;
  const title = product?.title ?? ctaEntry.linkText ?? "";

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(
        isFloating && [
          // z-40 deliberately: every dialog in this theme sits at z-50, so a
          // floating card must pass under the cart drawer and the popups
          // rather than over them.
          "fixed right-0 bottom-0 left-0 z-40 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80",
          "pb-[env(safe-area-inset-bottom)] lg:pb-0",
          "transition-all duration-300",
          revealed
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        ],
        ctaLayout === "sticky" && "sticky top-24",
      )}
    >
      <div
        className={clsx(
          // relative so the dismiss button below anchors to this card rather
          // than to whatever happens to be positioned further up the page.
          "relative flex gap-3 border border-line bg-background p-3",
          isFloating && "shadow-lg lg:flex-col lg:gap-4 lg:p-4",
          !isFloating && "lg:flex-col",
        )}
      >
        {dismissible && isFloating && (
          <button
            type="button"
            aria-label="Hide this suggestion"
            onClick={() => setDismissed(true)}
            className="absolute top-1 right-1 p-1.5 text-body-subtle lg:top-2 lg:right-2"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        )}
        {image?.url && (
          <Link to={target} className="shrink-0">
            <Image
              data={image}
              width={160}
              aspectRatio="1/1"
              className="size-16 object-contain lg:size-auto lg:w-full"
              alt={image.altText || title}
            />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {heading && (
            <p className="text-body-subtle text-xs uppercase tracking-wide">
              {heading}
            </p>
          )}
          {title && (
            <Link to={target} className="font-medium leading-snug">
              {title}
            </Link>
          )}
          {variant?.price && (
            <Money
              data={variant.price}
              withoutTrailingZeros
              className="text-sm"
            />
          )}
          <div className="mt-2 flex flex-col gap-2">
            {canAddToCart && variant?.id && (
              <AddToCartButton
                lines={[{ merchandiseId: variant.id, quantity: 1 }]}
                variant="primary"
                className="w-full py-2 text-sm"
              >
                {addToCartText || "Add to cart"}
              </AddToCartButton>
            )}
            <Link
              to={target}
              variant={canAddToCart ? "outline" : "primary"}
              className="w-full items-center justify-center whitespace-nowrap rounded-none py-2 text-sm"
            >
              {product
                ? viewProductText || "View product"
                : ctaEntry.linkText || viewProductText || "Learn more"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const schema = createSchema({
  type: "blog-cta",
  title: "Blog CTA",
  limit: 1,
  enabledOn: {
    pages: ["ARTICLE"],
  },
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "ctaLayout",
          label: "Placement",
          defaultValue: "floating",
          configs: {
            options: [
              { value: "floating", label: "Floating card" },
              { value: "sticky", label: "Sticky beside the post" },
              { value: "inline", label: "Below the post" },
            ],
          },
        },
        {
          type: "range",
          name: "showAfterPercent",
          label: "Appear after",
          defaultValue: 20,
          configs: { min: 0, max: 60, step: 5, unit: "%" },
          helpText:
            "How far down the article the floating card appears. 0 shows it straight away.",
          condition: (data: BlogCtaProps) => data.ctaLayout === "floating",
        },
        {
          type: "switch",
          name: "dismissible",
          label: "Let readers close it",
          defaultValue: true,
          condition: (data: BlogCtaProps) => data.ctaLayout === "floating",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Pairs beautifully with",
          placeholder: "Pairs beautifully with",
        },
        {
          type: "text",
          name: "addToCartText",
          label: "Add to cart button",
          defaultValue: "Add to cart",
          placeholder: "Add to cart",
        },
        {
          type: "text",
          name: "viewProductText",
          label: "View product button",
          defaultValue: "View product",
          placeholder: "View product",
        },
      ],
    },
  ],
  presets: {
    ctaLayout: "floating",
    heading: "Pairs beautifully with",
    addToCartText: "Add to cart",
    viewProductText: "View product",
    showAfterPercent: 20,
    dismissible: true,
  },
});
