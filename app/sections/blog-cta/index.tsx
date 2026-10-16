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
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
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
  const isDesignMode = useWeaverseStudioCheck();
  const [dismissed, setDismissed] = useState(false);
  const isFloating = ctaLayout === "floating";
  const isBar = ctaLayout === "sticky";
  const isInline = ctaLayout === "inline";
  // Both pinned layouts sit over the page, so both get the scroll reveal and
  // the close button. Only the inline card sits in the article's own flow.
  const isPinned = isFloating || isBar;
  const revealed = useRevealOnScroll(isPinned, showAfterPercent);

  const product = (ctaEntry?.product ?? null) as CtaProduct | null;
  // A row promotes a product or a page, never both. The product reference
  // resolves in this storefront's own catalog, so one a brand does not carry
  // arrives null and the row falls through to its link, or to nothing.
  const hasCta = Boolean(ctaEntry && (product || ctaEntry.link));

  // Silence is correct on a live site and useless in the editor: the article
  // Studio previews usually carries no CTA metafields of its own, and a bottle
  // the storefront does not sell resolves to null, so the section would look
  // like it had failed to install. The placeholder is editor-only.
  if (!hasCta) {
    if (!isDesignMode) {
      return null;
    }
    return (
      <div
        ref={ref}
        {...rest}
        className={clsx(
          isPinned && "fixed inset-x-0 bottom-0 z-40 p-3",
          isFloating && "lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-80 lg:p-0",
          isInline &&
            "mx-auto w-full max-w-(--page-width) px-3 py-10 md:px-4 lg:px-6",
        )}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-1.5 border border-line border-dashed bg-background p-4 text-body-subtle">
          <p className="font-medium text-xs uppercase tracking-wide">
            {heading || "Blog CTA"}
          </p>
          <p className="text-sm leading-snug">
            Nothing to show on this storefront yet. On the article, add a "blog
            cta" row for this domain pointing at a product this storefront
            sells.
          </p>
          <p className="text-xs">Only visible here. Readers see nothing.</p>
        </div>
      </div>
    );
  }

  if (dismissed) {
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

  const actions = (
    <div
      className={clsx(
        "flex flex-col gap-2",
        isFloating ? "mt-2" : "shrink-0 sm:w-44",
      )}
    >
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
  );

  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(
        isPinned && [
          // z-40 deliberately: every dialog in this theme sits at z-50, so a
          // pinned card must pass under the cart drawer and the popups rather
          // than over them.
          //
          // The padding is on this wrapper, not the card: an edge-to-edge
          // panel glued to the bottom of a phone reads as part of the page
          // chrome, and the home indicator sits on top of it.
          "fixed inset-x-0 bottom-0 z-40 p-3",
          "pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]",
          "transition-all duration-300",
          isFloating && "lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-80 lg:p-0",
          revealed
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        ],
        // Inline sits in the article's own flow, so it takes the page column
        // rather than spanning the full browser width.
        isInline &&
          "mx-auto w-full max-w-(--page-width) px-3 py-10 md:px-4 lg:px-6",
      )}
    >
      <div
        className={clsx(
          // relative so the dismiss button below anchors to this card rather
          // than to whatever happens to be positioned further up the page.
          "relative mx-auto flex items-center gap-3 border border-line bg-background p-3",
          isPinned && "shadow-lg",
          isFloating && "lg:flex-col lg:items-stretch lg:gap-4 lg:p-4",
          isBar && "max-w-(--page-width)",
          isInline && "max-w-xl gap-4 p-4",
        )}
      >
        {dismissible && isPinned && (
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
              // The card is at most 320px wide, so a 160px source was being
              // blown up four times over on a retina screen. Ask for the size
              // the layout actually paints.
              width={640}
              sizes="(min-width: 64em) 320px, 112px"
              aspectRatio="1/1"
              className={clsx(
                "object-contain",
                isFloating && "size-20 lg:size-auto lg:w-full",
                isBar && "size-14",
                isInline && "size-24",
              )}
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
          {isFloating && actions}
        </div>
        {!isFloating && actions}
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
              { value: "sticky", label: "Bar across the bottom" },
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
            "How far down the article the card appears. 0 shows it straight away.",
          condition: (data: BlogCtaProps) => data.ctaLayout !== "inline",
        },
        {
          type: "switch",
          name: "dismissible",
          label: "Let readers close it",
          defaultValue: true,
          condition: (data: BlogCtaProps) => data.ctaLayout !== "inline",
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
