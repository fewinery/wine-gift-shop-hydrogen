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
import { ClubMemberPrice } from "~/components/product/club-member-price";
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
import type { loader as articleLoader } from "~/routes/blogs/article.tsx";

interface BlogCtaProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  ctaLayout: "floating" | "sticky" | "inline";
  showBelowPost: boolean;
  heading: string;
  addToCartText: string;
  viewProductText: string;
  showAfterPercent: number;
  dismissible: boolean;
}

/** Which of the three shapes a card is drawn in. A section can draw two of
 * them at once: a pinned card the reader can close, and a permanent one at
 * the end of the article to fall back on. */
type CardShape = "floating" | "bar" | "inline";

const PERCENT = 100;

/** Stamped on the cart line and on the product link, so a sale can be traced
 * back to the article that suggested the bottle. */
const CTA_SOURCE = "blog-cta";

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

/**
 * The band the card sits in. Pinned shapes hover over the page; the inline
 * shape takes the article's own column so it lines up with the post above it.
 */
function bandClass(shape: CardShape) {
  if (shape === "inline") {
    return "mx-auto w-full max-w-(--page-width) px-3 py-10 md:px-4 lg:px-6";
  }
  return clsx(
    // z-40 deliberately: every dialog in this theme sits at z-50, so a pinned
    // card must pass under the cart drawer and the popups rather than over
    // them.
    //
    // The padding is on this band, not the card: an edge-to-edge panel glued
    // to the bottom of a phone reads as page chrome, and the home indicator
    // sits on top of it.
    "fixed inset-x-0 bottom-0 z-40 p-3",
    "pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]",
    "transition-all duration-300",
    shape === "floating" &&
      "lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-80 lg:p-0",
  );
}

/**
 * text-left is explicit because the article column around this section is
 * centred, and a product name centred under a left-aligned label reads as a
 * mistake.
 */
function cardClass(shape: CardShape) {
  return clsx(
    // relative so the dismiss button anchors to this card rather than to
    // whatever happens to be positioned further up the page.
    "relative mx-auto flex items-stretch gap-3 border border-line bg-background p-3 text-left",
    shape !== "inline" && "shadow-lg",
    shape === "floating" && "lg:flex-col lg:gap-4 lg:p-4",
    shape === "bar" && "max-w-(--page-width)",
    shape === "inline" && "max-w-xl gap-4 p-4",
  );
}

/**
 * On a phone the image runs the full height of the card and the text column
 * gives up the width for it: a bottle two inches tall sells, a thumbnail does
 * not. On a wide screen the floating card stacks instead, so the image takes
 * the card's full width as a square.
 */
function imageClass(shape: CardShape) {
  return clsx(
    "h-full object-contain",
    shape === "floating" && "w-24 lg:h-auto lg:w-full",
    shape === "bar" && "w-16",
    shape === "inline" && "w-24 sm:w-28",
  );
}

export default function BlogCta(props: BlogCtaProps) {
  const {
    ref,
    ctaLayout,
    showBelowPost,
    heading,
    addToCartText,
    viewProductText,
    showAfterPercent,
    dismissible,
    ...rest
  } = props;
  const { article, ctaEntry } = useLoaderData<typeof articleLoader>();
  const isDesignMode = useWeaverseStudioCheck();
  const [dismissed, setDismissed] = useState(false);

  // "Below the post" is both a placement of its own and a companion to the
  // pinned card: a reader who closes the floating card still meets the bottle
  // at the end of the article.
  const pinnedShape: CardShape | null =
    ctaLayout === "floating"
      ? "floating"
      : ctaLayout === "sticky"
        ? "bar"
        : null;
  const showInline = ctaLayout === "inline" || Boolean(showBelowPost);
  const revealed = useRevealOnScroll(pinnedShape !== null, showAfterPercent);

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
    const shape: CardShape = showInline ? "inline" : (pinnedShape ?? "inline");
    return (
      <div ref={ref} {...rest}>
        <div className={bandClass(shape)}>
          <div className="mx-auto flex max-w-lg flex-col gap-1.5 border border-line border-dashed bg-background p-4 text-left text-body-subtle">
            <p className="font-medium text-xs uppercase tracking-wide">
              {heading || "Blog CTA"}
            </p>
            <p className="text-sm leading-snug">
              Nothing to show on this storefront yet. On the article, add a
              "blog cta" row for this domain pointing at a product this
              storefront sells.
            </p>
            <p className="text-xs">Only visible here. Readers see nothing.</p>
          </div>
        </div>
      </div>
    );
  }

  const variant = product?.selectedOrFirstAvailableVariant;
  // Add to cart only when there is nothing to choose. A gift set with options
  // would otherwise add a variant the reader never picked.
  const canAddToCart =
    (product?.variants?.nodes?.length ?? 0) === 1 &&
    Boolean(variant?.availableForSale);
  // ?ref= is the only trace a click leaves, since the reader lands on an
  // ordinary product page afterwards. It is ignored by the PDP itself.
  const target = product
    ? `/products/${product.handle}?ref=${CTA_SOURCE}`
    : (ctaEntry.link ?? "");
  const image = product?.featuredImage;
  const title = product?.title ?? ctaEntry.linkText ?? "";
  const linkLabel = product
    ? viewProductText || "View product"
    : ctaEntry.linkText || viewProductText || "Learn more";

  // Rides the line through checkout and lands on the order, so "what did the
  // blog actually sell" is answerable from orders rather than from clicks.
  // The leading underscore is Shopify's convention for a property the buyer
  // never sees - it still reaches the admin, the Admin API and webhooks.
  const ctaAttributes = [
    { key: "_blog_cta", value: article?.handle ?? CTA_SOURCE },
  ];

  function actions(shape: CardShape) {
    return (
      <>
        {canAddToCart && variant?.id && (
          <AddToCartButton
            lines={[
              {
                merchandiseId: variant.id,
                quantity: 1,
                attributes: ctaAttributes,
              },
            ]}
            variant="primary"
            className="w-full py-2 text-sm"
          >
            {addToCartText || "Add to cart"}
          </AddToCartButton>
        )}
        <Link
          to={target}
          variant={canAddToCart ? "outline" : "primary"}
          className={clsx(
            "w-full items-center justify-center whitespace-nowrap rounded-none py-2 text-sm",
            shape === "inline" && "sm:whitespace-normal",
          )}
        >
          {linkLabel}
        </Link>
      </>
    );
  }

  // Not a component: inlining the tree keeps the two cards from remounting -
  // and taking the add-to-cart fetcher's state with them - on every render.
  function card(shape: CardShape) {
    const stacked = shape === "floating";
    return (
      <div className={cardClass(shape)}>
        {dismissible && shape !== "inline" && (
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
          <Link
            to={target}
            className="flex shrink-0 items-center self-stretch justify-start"
          >
            <Image
              data={image}
              // The card is at most 320px wide, so a 160px source was being
              // blown up fourfold on a retina screen. Ask for what is painted.
              width={640}
              sizes="(min-width: 64em) 320px, 112px"
              aspectRatio="1/1"
              className={imageClass(shape)}
              alt={image.altText || title}
            />
          </Link>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          {heading && (
            <p className="text-body-subtle text-xs uppercase tracking-wide">
              {heading}
            </p>
          )}
          {title && (
            <Link
              to={target}
              className="justify-start text-left font-medium leading-snug"
            >
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
          <ClubMemberPrice price={variant?.price} className="justify-start" />
          {stacked && (
            <div className="mt-2 flex flex-col gap-2">{actions(shape)}</div>
          )}
        </div>
        {!stacked && (
          <div className="flex shrink-0 flex-col justify-center gap-2 sm:w-44">
            {actions(shape)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} {...rest}>
      {pinnedShape && !dismissed && (
        <div
          className={clsx(
            bandClass(pinnedShape),
            revealed
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
        >
          {card(pinnedShape)}
        </div>
      )}
      {showInline && (
        <div className={bandClass("inline")}>{card("inline")}</div>
      )}
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
          type: "switch",
          name: "showBelowPost",
          label: "Also show below the post",
          defaultValue: false,
          helpText:
            "Repeats the card at the end of the article, always visible, so a reader who closes the floating card can still find the product.",
          condition: (data: BlogCtaProps) => data.ctaLayout !== "inline",
        },
        {
          type: "range",
          name: "showAfterPercent",
          label: "Appear after",
          defaultValue: 20,
          configs: { min: 0, max: 60, step: 5, unit: "%" },
          helpText:
            "How far down the article the card appears. 0 shows it straight away. The copy below the post is always visible.",
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
    showBelowPost: false,
    heading: "Pairs beautifully with",
    addToCartText: "Add to cart",
    viewProductText: "View product",
    showAfterPercent: 20,
    dismissible: true,
  },
});
