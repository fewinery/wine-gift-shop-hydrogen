import { Money, mapSelectedProductOptionToObject } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useState } from "react";
import { useViewTransitionState } from "react-router";
import type {
  ProductCardFragment,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import { Spinner } from "~/components/spinner";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import JudgemeStarsRating from "~/sections/main-product/judgeme-stars-rating";
import { isCombinedListing } from "~/utils/combined-listings";
import { calculateAspectRatio } from "~/utils/image";
import {
  BestSellerBadge,
  BundleBadge,
  NewBadge,
  SaleBadge,
  SoldOutBadge,
} from "./badges";
import { ClubMemberPrice } from "./club-member-price";
import { ProductCardAddToCart } from "./product-card-add-to-cart";
import { ProductCardOptions } from "./product-card-options";
import { VariantPrices } from "./variant-prices";

type CardAlignment = "left" | "center" | "right";

// Lookup tables rather than chains of conditionals: the card reads the same
// alignment in four places, and spelling it out each time is what pushes this
// component past the complexity ceiling.
const TEXT_ALIGNMENT: Record<CardAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const ITEMS_ALIGNMENT: Record<CardAlignment, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

const JUSTIFY_ALIGNMENT: Record<CardAlignment, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function ProductCard({
  product,
  className,
  titlePricesAlignment,
  contentAlignment,
  showViewProductButton,
}: {
  product: ProductCardFragment;
  className?: string;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}) {
  const {
    pcardBorderRadius,
    pcardBackgroundColor,
    pcardShowImageOnHover,
    pcardImageRatio,
    pcardTitlePricesAlignment,
    pcardAlignment,
    pcardShowVendor,
    pcardShowReviews,
    pcardShowLowestPrice,
    pcardShowSalePrice,
    pcardEnableQuickShop,
    pcardShowQuickShopOnHover,
    pcardQuickShopButtonPlacement,
    pcardQuickShopButtonType,
    pcardQuickShopButtonText,
    pcardShowSaleBadge,
    pcardShowBundleBadge,
    pcardShowBestSellerBadge,
    pcardShowNewBadge,
    pcardShowOutOfStockBadge,
    productTitleFontFamily,
  } = useThemeSettings();

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const productPageHref = usePrefixPathWithLocale(
    `/products/${product.handle}`,
  );
  const isTransitioning = useViewTransitionState(productPageHref);

  const { images, badges, priceRange } = product;
  const { minVariantPrice, maxVariantPrice } = priceRange;

  const firstVariant = product.selectedOrFirstAvailableVariant;
  const params = new URLSearchParams(
    mapSelectedProductOptionToObject(
      (selectedVariant || firstVariant)?.selectedOptions || [],
    ),
  );

  const isVertical =
    (titlePricesAlignment ?? pcardTitlePricesAlignment) === "vertical";
  const alignment = contentAlignment ?? pcardAlignment;
  const isBestSellerProduct = badges
    .filter(Boolean)
    .some(({ key, value }) => key === "best_seller" && value === "true");
  const isBundle = Boolean(product?.isBundle?.requiresComponents);

  // The variant the card is currently showing: whatever the shopper picked
  // from the option swatches, otherwise the product's first available one.
  // This is the variant the "Add to cart" button adds.
  const activeVariant = selectedVariant || firstVariant;
  const combinedListing = isCombinedListing(product);
  const cardSearch = params.toString() ? `?${params.toString()}` : "";
  // The price the club member figure is derived from is the one on screen, so
  // the two never disagree.
  const displayedPrice =
    pcardShowLowestPrice || combinedListing
      ? minVariantPrice
      : activeVariant?.price;

  let [image, secondImage] = images.nodes;
  if (selectedVariant?.image) {
    image = selectedVariant.image;
    const imageUrl = image.url;
    const imageIndex = images.nodes.findIndex(({ url }) => url === imageUrl);
    if (imageIndex > 0 && imageIndex < images.nodes.length - 1) {
      secondImage = images.nodes[imageIndex + 1];
    }
  }

  return (
    <div
      className={clsx(
        "flex h-full flex-col rounded-(--pcard-radius)",
        className,
      )}
      style={
        {
          backgroundColor: pcardBackgroundColor,
          "--pcard-radius": `${pcardBorderRadius}px`,
          "--pcard-image-ratio": calculateAspectRatio(image, pcardImageRatio),
        } as React.CSSProperties
      }
    >
      <div className="group relative">
        {image && (
          <Link
            to={`/products/${product.handle}?${params.toString()}`}
            prefetch="intent"
            className="group relative block aspect-(--pcard-image-ratio) overflow-hidden bg-transparent p-8"
          >
            {/* Loading skeleton overlay */}
            {isImageLoading && <Spinner />}
            <Image
              className={clsx([
                "absolute inset-0",
                pcardShowImageOnHover &&
                secondImage &&
                "transition-opacity duration-300 group-hover:opacity-0",
                isTransitioning &&
                "[&_img]:[view-transition-name:image-expand]",
              ])}
              sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
              data={image}
              width={700}
              alt={image.altText || `Picture of ${product.title}`}
              loading="lazy"
              onLoad={() => setIsImageLoading(false)}
            />
            {pcardShowImageOnHover && secondImage && (
              <Image
                className={clsx([
                  "absolute inset-0",
                  "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                ])}
                sizes="auto"
                width={700}
                data={secondImage}
                alt={
                  secondImage.altText || `Second picture of ${product.title}`
                }
                loading="lazy"
              />
            )}
          </Link>
        )}
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          {isBundle && pcardShowBundleBadge && <BundleBadge />}
          {pcardShowSaleBadge && (
            <SaleBadge
              price={minVariantPrice as MoneyV2}
              compareAtPrice={maxVariantPrice as MoneyV2}
            />
          )}
          {pcardShowBestSellerBadge && isBestSellerProduct && (
            <BestSellerBadge />
          )}
          {pcardShowNewBadge && <NewBadge publishedAt={product.publishedAt} />}
          {pcardShowOutOfStockBadge && <SoldOutBadge />}
        </div>
        {pcardEnableQuickShop && pcardQuickShopButtonPlacement === "image" && (
          <ProductCardAddToCart
            variant={activeVariant}
            productHandle={product.handle}
            productSearch={cardSearch}
            buttonText={pcardQuickShopButtonText}
            buttonType={pcardQuickShopButtonType}
            placement="image"
            showOnHover={pcardShowQuickShopOnHover}
            needsProductPage={combinedListing}
          />
        )}
      </div>
      <div
        className={clsx(
          "flex flex-1 flex-col",
          pcardBackgroundColor && "px-2",
          isVertical && TEXT_ALIGNMENT[alignment as CardAlignment],
        )}
      >
        {pcardShowVendor && (
          <div className="text-body-subtle uppercase">{product.vendor}</div>
        )}
        {pcardShowReviews && (
          <JudgemeStarsRating
            productHandle={product.handle}
            ratingText="{{rating}} ({{total_reviews}} reviews)"
            errorText=""
          />
        )}
        <div
          className={clsx(
            "flex",
            isVertical
              ? ["flex-col", ITEMS_ALIGNMENT[alignment as CardAlignment]]
              : "justify-between gap-4",
          )}
        >
          <Link
            to={`/products/${product.handle}?${params.toString()}`}
            prefetch="intent"
            className={clsx(
              "inline-block uppercase py-4",
              productTitleFontFamily === "heading"
                ? "font-heading"
                : "font-body",
            )}
          >
            <RevealUnderline className="bg-position-[left_calc(1em+3px)] leading-normal">
              {product.title}
            </RevealUnderline>
          </Link>
          <div
            className={clsx(
              "flex flex-col gap-1",
              // The price and the club line are two stacked rows inside one
              // flex item, so they need their own alignment — otherwise they
              // sit flush left inside a block the card has centred.
              isVertical
                ? ITEMS_ALIGNMENT[alignment as CardAlignment]
                : "items-end",
            )}
          >
            {pcardShowLowestPrice || combinedListing ? (
              <div className="flex gap-1 font-body">
                <span>From</span>
                <Money withoutTrailingZeros data={minVariantPrice} />
                {combinedListing && (
                  <>
                    <span>–</span>
                    <Money withoutTrailingZeros data={maxVariantPrice} />
                  </>
                )}
              </div>
            ) : (
              <VariantPrices
                variant={activeVariant}
                showCompareAtPrice={pcardShowSalePrice}
                className="text-base font-body"
              />
            )}
            <ClubMemberPrice price={displayedPrice} />
          </div>
        </div>
        <ProductCardOptions
          product={product}
          selectedVariant={selectedVariant}
          setSelectedVariant={(variant: ProductVariantFragment) => {
            // Only show loading if variant has a different image
            if (variant.image?.url !== selectedVariant?.image?.url) {
              setIsImageLoading(true);
            }
            setSelectedVariant(variant);
          }}
          className={clsx(
            isVertical && JUSTIFY_ALIGNMENT[pcardAlignment as CardAlignment],
          )}
        />
      </div>
      {(showViewProductButton ||
        (pcardEnableQuickShop &&
          pcardQuickShopButtonPlacement === "bottom")) && (
          <div className="mt-4 flex flex-col gap-2.5">
            {showViewProductButton && (
              <Link
                to={`/products/${product.handle}?${params.toString()}`}
                prefetch="intent"
                variant="outline"
                className="w-full"
              >
                View Product
              </Link>
            )}
            {pcardEnableQuickShop &&
              pcardQuickShopButtonPlacement === "bottom" && (
                <ProductCardAddToCart
                  variant={activeVariant}
                  productHandle={product.handle}
                  productSearch={cardSearch}
                  buttonText={pcardQuickShopButtonText}
                  buttonType={pcardQuickShopButtonType}
                  placement="bottom"
                  showOnHover={pcardShowQuickShopOnHover}
                  needsProductPage={combinedListing}
                />
              )}
          </div>
        )}
    </div>
  );
}
