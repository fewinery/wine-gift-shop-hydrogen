import {
  getAdjacentAndFirstAvailableVariants,
  ShopPayButton,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import {
  createSchema,
  type HydrogenComponentProps,
  useThemeSettings,
} from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { cn } from "~/utils/cn";
import { isCombinedListing } from "~/utils/combined-listings";
import { useProductQtyStore } from "./product-quantity-selector";

const GIFT_PACKAGE_TAG = "gift-package";

interface GiftFields {
  to: string;
  from: string;
  message: string;
}

interface ProductATCButtonsProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  addToCartText: string;
  addBundleToCartText: string;
  soldOutText: string;
  showShopPayButton: boolean;
  showSecondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  buttonClassName?: string;
}

export default function ProductATCButtons(props: ProductATCButtonsProps) {
  const {
    ref,
    addToCartText,
    addBundleToCartText,
    soldOutText,
    showShopPayButton,
    showSecondaryButton,
    secondaryButtonText,
    secondaryButtonLink,
    buttonClassName,
    ...rest
  } = props;
  const { product, storeDomain } = useLoaderData<typeof productRouteLoader>();
  const { quantity } = useProductQtyStore();
  const themeSettings = useThemeSettings();
  const { giftNoteText = "" } = themeSettings;

  const [isGift, setIsGift] = useState(false);
  const [giftFields, setGiftFields] = useState<GiftFields>({
    to: "",
    from: "",
    message: "",
  });

  const upsellFields = product?.upsellConfiguration?.reference?.fields ?? [];

  const upsellActive =
    upsellFields.find((field) => field.key === "active")?.value === "true";

  const woodCards =
    upsellFields
      .find((field) => field.key === "wood_cards")
      ?.references?.nodes ?? [];

  const hasWoodCardsUpsell = upsellActive && woodCards.length > 0;

  const [selectedWoodCardId, setSelectedWoodCardId] = useState<string | null>(
    null,
  );

  const selectedWoodCard = woodCards.find(
    (woodCard) => woodCard.id === selectedWoodCardId,
  );

  const selectedWoodCardVariant = selectedWoodCard?.variants?.nodes?.find(
    (variant) => variant.availableForSale,
  );

  const selectedVariant = useOptimisticVariant(
    product?.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  const combinedListing = isCombinedListing(product);
  const isBundle = Boolean(product?.isBundle?.requiresComponents);
  const isGiftPackage = product?.tags?.includes(GIFT_PACKAGE_TAG);

  if (!product || combinedListing) {
    return null;
  }

  let atcButtonText = "Add to cart";
  if (selectedVariant.availableForSale) {
    atcButtonText = isBundle ? addBundleToCartText : addToCartText;
  } else {
    atcButtonText = soldOutText;
  }

  const giftProperties =
    !hasWoodCardsUpsell && isGiftPackage && isGift
      ? [
          { key: "To", value: giftFields.to },
          { key: "From", value: giftFields.from },
          { key: "Message", value: giftFields.message },
        ]
      : undefined;

  const woodCardGiftProperties =
    hasWoodCardsUpsell && selectedWoodCardId
      ? [
          { key: "To", value: giftFields.to },
          { key: "From", value: giftFields.from },
          { key: "Message", value: giftFields.message },
        ]
      : undefined;

  const isGiftFieldsValid = hasWoodCardsUpsell
    ? !selectedWoodCardId ||
      Boolean(
        giftFields.to.trim() &&
          giftFields.from.trim() &&
          giftFields.message.trim(),
      )
    : !isGiftPackage ||
      !isGift ||
      Boolean(
        giftFields.to.trim() &&
          giftFields.from.trim() &&
          giftFields.message.trim(),
      );

  const giftNote =
    !hasWoodCardsUpsell && isGiftPackage && isGift && isGiftFieldsValid
      ? `[${product.title}] Gift - To: ${giftFields.to.trim()}, From: ${giftFields.from.trim()}, Message: ${giftFields.message.trim()}`
      : undefined;

  return (
    <div ref={ref} {...rest} className="space-y-4 empty:hidden">
      {hasWoodCardsUpsell && (
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            ADD A WOOD CARD
          </p>

          <div className="flex snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {woodCards.map((woodCard) => {
              const isSelected = selectedWoodCardId === woodCard.id;
              const variant = woodCard.variants?.nodes?.find(
                (item) => item.availableForSale,
              );

              return (
                <button
                  key={woodCard.id}
                  type="button"
                  onClick={() =>
                    setSelectedWoodCardId(isSelected ? null : woodCard.id)
                  }
                  disabled={!variant}
                  className={cn(
                    "w-[31%] shrink-0 snap-start border p-2 text-left transition-colors sm:w-[45%] lg:w-[30%] xl:w-[24%]",
                    isSelected
                      ? "border-black"
                      : "border-neutral-300 hover:border-neutral-600",
                    !variant && "cursor-not-allowed opacity-50",
                  )}
                >
                  {woodCard.featuredImage?.url && (
                    <img
                      src={woodCard.featuredImage.url}
                      alt={woodCard.featuredImage.altText ?? woodCard.title}
                      className="mb-2 aspect-square w-full object-cover"
                    />
                  )}

                  <p className="text-sm font-semibold text-neutral-900">
                    {woodCard.title}
                  </p>

                  {variant && (
                    <p className="mt-1 text-sm text-neutral-600">
                      ${variant.price.amount}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasWoodCardsUpsell && selectedWoodCardId && (
        <div className="space-y-4 border border-neutral-400 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            GIFT MESSAGE
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="wood-card-gift-to"
                className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
              >
                TO <span className="text-red-500">*</span>
              </label>
              <input
                id="wood-card-gift-to"
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
                htmlFor="wood-card-gift-from"
                className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
              >
                FROM <span className="text-red-500">*</span>
              </label>
              <input
                id="wood-card-gift-from"
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
              htmlFor="wood-card-gift-message"
              className="block text-xs font-bold uppercase tracking-wide text-neutral-900"
            >
              MESSAGE <span className="text-red-500">*</span>
            </label>
            <textarea
              id="wood-card-gift-message"
              rows={4}
              maxLength={100}
              placeholder="Write a personal message..."
              value={giftFields.message}
              onChange={(e) =>
                setGiftFields((f) => ({ ...f, message: e.target.value }))
              }
              className="w-full resize-none border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black placeholder:text-neutral-500"
            />
            <div className="text-right text-sm text-neutral-500">
              {giftFields.message.length}/100
            </div>
          </div>

          {giftNoteText && (
            <div className="border-t border-neutral-200 pt-3 italic text-neutral-700">
              {giftNoteText}
            </div>
          )}
        </div>
      )}

      {isGiftPackage && !hasWoodCardsUpsell && (
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
                  rows={4}
                  maxLength={100}
                  placeholder="Write a personal message..."
                  value={giftFields.message}
                  onChange={(e) =>
                    setGiftFields((f) => ({ ...f, message: e.target.value }))
                  }
                  className="w-full resize-none border border-neutral-400 px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black placeholder:text-neutral-500"
                />
                <div className="text-right text-sm text-neutral-500">
                  {giftFields.message.length}/100
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
      <AddToCartButton
        disabled={
          !selectedVariant?.availableForSale ||
          !isGiftFieldsValid ||
          Boolean(selectedWoodCardId && !selectedWoodCardVariant)
        }
        lines={[
          {
            merchandiseId: selectedVariant?.id,
            quantity,
            selectedVariant,
            ...(giftProperties && {
              attributes: giftProperties,
            }),
          },
          ...(selectedWoodCardVariant
            ? [
                {
                  merchandiseId: selectedWoodCardVariant.id,
                  quantity: 1,
                  ...(woodCardGiftProperties && {
                    attributes: woodCardGiftProperties,
                  }),
                },
              ]
            : []),
        ]}
        data-test="add-to-cart"
        note={giftNote}
        variant="primary"
        className={cn("w-full", buttonClassName)}
      >
        {atcButtonText}
      </AddToCartButton>
      {showSecondaryButton && (
        <Link
          to={secondaryButtonLink}
          variant="secondary"
          className="w-full"
        >
          {secondaryButtonText}
        </Link>
      )}
      {showShopPayButton && selectedVariant?.availableForSale && (
        <ShopPayButton
          width="100%"
          variantIdsAndQuantities={[
            {
              id: selectedVariant?.id ?? "",
              quantity,
            },
            ...(selectedWoodCardVariant
              ? [
                  {
                    id: selectedWoodCardVariant.id,
                    quantity: 1,
                  },
                ]
              : []),
          ]}
          storeDomain={storeDomain}
        />
      )}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--atc-buttons",
  title: "Buy buttons",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "text",
          label: "Add to cart text",
          name: "addToCartText",
          defaultValue: "Add to cart",
          placeholder: "Add to cart",
        },
        {
          type: "text",
          label: "Bundle add to cart text",
          name: "addBundleToCartText",
          defaultValue: "Add bundle to cart",
          placeholder: "Add bundle to cart",
          helpText:
            "Apply if the product is a bundled product. Learn more about <a href='https://shopify.dev/docs/apps/build/product-merchandising/bundles' target='_blank'>Shopify product bundles</a>.",
        },
        {
          type: "text",
          label: "Sold out text",
          name: "soldOutText",
          defaultValue: "Sold out",
          placeholder: "Sold out",
        },
        {
          type: "switch",
          label: "Show Shop Pay button",
          name: "showShopPayButton",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Secondary button",
      inputs: [
        {
          type: "switch",
          label: "Show secondary button",
          name: "showSecondaryButton",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Button text",
          name: "secondaryButtonText",
          defaultValue: "Join our wine club and save",
          placeholder: "Join our wine club and save",
          condition: (data: ProductATCButtonsProps) => data.showSecondaryButton,
        },
        {
          type: "text",
          label: "Button link",
          name: "secondaryButtonLink",
          defaultValue: "/pages/wine-club",
          placeholder: "/pages/wine-club",
          condition: (data: ProductATCButtonsProps) => data.showSecondaryButton,
        },
      ],
    },
  ],
});
