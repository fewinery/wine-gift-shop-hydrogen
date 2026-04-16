import {
  HandbagSimpleIcon,
  ImageIcon,
  ShoppingCartIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ShopPayButton } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type {
  ProductQuery,
  ProductVariantFragment,
} from "storefront-api.generated";
import { Button } from "~/components/button";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import { ProductMedia } from "~/components/product/product-media";
import { Quantity } from "~/components/product/quantity";
import { Skeleton } from "~/components/skeleton";
import JudgemeStarsRating from "~/sections/main-product/judgeme-stars-rating";
import { ProductBadges } from "./badges";
import { VariantPrices } from "./variant-prices";
import { VariantSelector } from "./variant-selector";

interface QuickViewData {
  product: NonNullable<ProductQuery["product"]>;
  storeDomain: string;
}

const GIFT_PACKAGE_TAG = "gift-package";

interface GiftFields {
  to: string;
  from: string;
  message: string;
}

export function QuickShop({
  data,
  panelType = "modal",
}: {
  data: QuickViewData;
  panelType?: "modal" | "drawer";
}) {
  const { product, storeDomain } = data || {};
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantFragment>(product?.selectedOrFirstAvailableVariant);
  const themeSettings = useThemeSettings();
  const { giftNoteText = "" } = themeSettings;

  const [isGift, setIsGift] = useState(false);
  const [giftFields, setGiftFields] = useState<GiftFields>({
    to: "",
    from: "",
    message: "",
  });

  const isGiftPackage = product?.tags?.includes(GIFT_PACKAGE_TAG);

  const giftProperties =
    isGiftPackage && isGift
      ? [
          { key: "To", value: giftFields.to },
          { key: "From", value: giftFields.from },
          { key: "Message", value: giftFields.message },
        ]
      : undefined;

  const isGiftFieldsValid =
    !isGiftPackage ||
    !isGift ||
    (giftFields.to.trim() &&
      giftFields.from.trim() &&
      giftFields.message.trim());

  const giftNote =
    isGiftPackage && isGift && isGiftFieldsValid
      ? `[${product.title}] Gift - To: ${giftFields.to.trim()}, From: ${giftFields.from.trim()}, Message: ${giftFields.message.trim()}`
      : undefined;

  return (
    <div className="bg-background">
      <div
        className={clsx(
          "grid grid-cols-1 items-start gap-5 p-6",
          panelType === "modal" ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        <ProductMedia
          mediaLayout="slider"
          media={product?.media.nodes}
          selectedVariant={selectedVariant}
          showThumbnails={false}
        />
        <div className="flex flex-col justify-start gap-5">
          <div className="space-y-4">
            <ProductBadges
              product={product}
              selectedVariant={selectedVariant}
            />
            <div className="flex flex-col gap-2">
              <h5 className="font-body">{product.title}</h5>
            </div>
            <VariantPrices variant={selectedVariant} />
            <JudgemeStarsRating
              productHandle={product.handle}
              ratingText="{{rating}} ({{total_reviews}} reviews)"
              errorText=""
            />
            {product.summary && (
              <p className="leading-relaxed line-clamp-6">{product.summary}</p>
            )}
            <VariantSelector
              product={product}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
            />
          </div>
          {isGiftPackage && (
            <div className="space-y-4">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="h-4 w-4 rounded-none border border-neutral-400 accent-black focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                  Is this a gift?
                </span>
              </label>
              {isGift && (
                <div className="space-y-4 border border-neutral-400 p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">
                    GIFT MESSAGE
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="gift-to"
                        className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
                      >
                        TO <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="gift-to"
                        type="text"
                        maxLength={20}
                        placeholder="Recipient name"
                        value={giftFields.to}
                        onChange={(e) =>
                          setGiftFields((f) => ({ ...f, to: e.target.value }))
                        }
                        className="w-full border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black placeholder:text-neutral-500"
                      />
                      <div className="text-right text-sm text-neutral-500">
                        {giftFields.to.length}/20
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="gift-from"
                        className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
                      >
                        FROM <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="gift-from"
                        type="text"
                        maxLength={20}
                        placeholder="Your name"
                        value={giftFields.from}
                        onChange={(e) =>
                          setGiftFields((f) => ({ ...f, from: e.target.value }))
                        }
                        className="w-full border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black placeholder:text-neutral-500"
                      />
                      <div className="text-right text-sm text-neutral-500">
                        {giftFields.from.length}/20
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="gift-message"
                      className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
                    >
                      MESSAGE <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="gift-message"
                      rows={3}
                      maxLength={25}
                      placeholder="Write a personal message..."
                      value={giftFields.message}
                      onChange={(e) =>
                        setGiftFields((f) => ({
                          ...f,
                          message: e.target.value,
                        }))
                      }
                      className="w-full resize-none border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black placeholder:text-neutral-500"
                    />
                    <div className="text-right text-sm text-neutral-500">
                      <span>{giftFields.message.length}/25</span>
                    </div>
                  </div>
                  {giftNoteText && (
                    <div className="border-t border-neutral-200 pt-3 italic text-neutral-700">
                      {giftNoteText}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <Quantity value={quantity} onChange={setQuantity} />
          {/* TODO: fix quick-shop modal & cart drawer overlap each other */}
          <AddToCartButton
            disabled={!selectedVariant?.availableForSale || !isGiftFieldsValid}
            lines={[
              {
                merchandiseId: selectedVariant?.id,
                quantity,
                selectedVariant,
                ...(giftProperties && {
                  attributes: giftProperties,
                }),
              },
            ]}
            data-test="add-to-cart"
            note={giftNote}
            className="w-full transition-all duration-300 disabled:bg-neutral-500 disabled:opacity-50 disabled:border-neutral-500 disabled:cursor-not-allowed uppercase bg-black text-white border-black text-base"
          >
            {selectedVariant?.availableForSale ? "Add to cart" : "Sold out"}
          </AddToCartButton>
          {selectedVariant?.availableForSale && (
            <ShopPayButton
              width="100%"
              variantIdsAndQuantities={[
                {
                  id: selectedVariant?.id,
                  quantity,
                },
              ]}
              storeDomain={storeDomain}
              className="-mt-2"
            />
          )}
          <Link
            to={`/products/${product.handle}`}
            prefetch="intent"
            variant="underline"
            className="w-fit"
          >
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function QuickShopTrigger({
  productHandle,
  showOnHover = false,
  buttonType = "text",
  buttonText = "Quick shop",
  panelType = "modal",
  placement = "bottom",
  backgroundColor,
  textColor,
  availableForSale = true,
}: {
  productHandle: string;
  showOnHover?: boolean;
  buttonType?: "icon" | "text";
  buttonText?: string;
  panelType?: "modal" | "drawer";
  placement?: "image" | "bottom";
  backgroundColor?: string;
  textColor?: string;
  availableForSale?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { load, data } = useFetcher<{ product: ProductQuery["product"] }>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: open and state are intentionally excluded
  useEffect(() => {
    if (open && !data) {
      load(`/api/product/${productHandle}`);
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          animate={false}
          variant="primary"
          className={clsx(
            "font-medium",
            !availableForSale && "pointer-events-none",
            placement === "image" && [
              "group/quick-shop absolute bottom-4 h-10.5 p-3 leading-4",
              buttonType === "icon"
                ? "right-4 rounded-full shadow-xl"
                : "inset-x-4 shadow-xs",
              showOnHover &&
                "opacity-0 transition-opacity group-hover:opacity-100",
            ],
            placement === "bottom" && "w-full py-[10px]",
          )}
        >
          {buttonType === "icon" ? (
            <>
              <HandbagSimpleIcon size={16} className="h-4 w-4" />
              <span className="w-0 overflow-hidden pl-0 text-base transition-all group-hover/quick-shop:w-9.5 group-hover/quick-shop:pl-2">
                Add
              </span>
            </>
          ) : (
            <span className={placement === "image" ? "px-2" : ""}>
              {availableForSale ? buttonText : "SOLD OUT"}
            </span>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-gray-900/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={clsx(
            "quick-shop-dialog-content",
            "fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-8 lg:items-center lg:py-0",
            "backdrop-blur-xs",
            "[--slide-up-from:20px]",
            "data-[state=open]:animate-slide-up",
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("quick-shop-dialog-content")) {
              setOpen(false);
            }
          }}
          aria-describedby={undefined}
        >
          <Dialog.Close asChild>
            <Button
              className="absolute top-3 right-3 rounded-full p-2"
              variant="secondary"
            >
              <XIcon size={18} />
            </Button>
          </Dialog.Close>
          <div
            className={clsx(
              "relative mx-auto h-fit w-full max-w-(--breakpoint-xl)",
              "animate-slide-up bg-white shadow-sm",
              panelType === "drawer" &&
                "mr-0 ml-auto min-h-screen max-w-md p-4",
            )}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Quick shop modal</Dialog.Title>
            </VisuallyHidden.Root>
            {data?.product ? (
              <QuickShop data={data as QuickViewData} panelType={panelType} />
            ) : (
              <div
                className={clsx(
                  "grid grid-cols-1 items-start gap-5",
                  panelType === "modal" ? "lg:grid-cols-2" : "grid-cols-1",
                )}
              >
                <Skeleton className="flex h-183 items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-body-subtle" />
                </Skeleton>
                <div className="flex flex-col justify-start gap-5 py-6 pr-5">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="flex h-10 w-1/2 items-center justify-center">
                    <ShoppingCartIcon className="h-5 w-5 text-body-subtle" />
                  </Skeleton>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
