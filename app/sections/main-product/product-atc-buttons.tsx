import {
  getAdjacentAndFirstAvailableVariants,
  ShopPayButton,
  useOptimisticVariant,
} from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { isCombinedListing } from "~/utils/combined-listings";
import { useProductQtyStore } from "./product-quantity-selector";
import { cn } from "~/utils/cn";

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
  const [giftFields, setGiftFields] = useState<GiftFields>({
    to: "",
    from: "",
    message: "",
  });

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

  const giftProperties = isGiftPackage
    ? [
      { key: "To", value: giftFields.to },
      { key: "From", value: giftFields.from },
      { key: "Message", value: giftFields.message },
    ]
    : undefined;

  const isGiftFieldsValid =
    !isGiftPackage || (giftFields.to.trim() && giftFields.from.trim());

  return (
    <div ref={ref} {...rest} className="space-y-4 empty:hidden">
      {isGiftPackage && (
        <div className="space-y-3 border border-neutral-200 p-4">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Gift Message
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="gift-to"
                className="block text-xs font-medium uppercase tracking-wide text-neutral-500"
              >
                To <span className="text-red-500">*</span>
              </label>
              <input
                id="gift-to"
                type="text"
                placeholder="Recipient name"
                value={giftFields.to}
                onChange={(e) =>
                  setGiftFields((f) => ({ ...f, to: e.target.value }))
                }
                className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-black"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="gift-from"
                className="block text-xs font-medium uppercase tracking-wide text-neutral-500"
              >
                From <span className="text-red-500">*</span>
              </label>
              <input
                id="gift-from"
                type="text"
                placeholder="Your name"
                value={giftFields.from}
                onChange={(e) =>
                  setGiftFields((f) => ({ ...f, from: e.target.value }))
                }
                className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-black"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="gift-message"
              className="block text-xs font-medium uppercase tracking-wide text-neutral-500"
            >
              Message
            </label>
            <textarea
              id="gift-message"
              rows={3}
              placeholder="Write a personal message..."
              value={giftFields.message}
              onChange={(e) =>
                setGiftFields((f) => ({ ...f, message: e.target.value }))
              }
              className="w-full resize-none border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-black"
            />
          </div>
        </div>
      )}
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
        className={cn(
          "w-full uppercase bg-black text-white border-black text-base",
          buttonClassName
        )}
      >
        {atcButtonText}
      </AddToCartButton>
      {showSecondaryButton && (
        <Link
          to={secondaryButtonLink}
          className="flex w-full items-center justify-center border border-body bg-transparent px-4 py-3 uppercase text-body hover:bg-body hover:text-background"
        >
          {secondaryButtonText}
        </Link>
      )}
      {showShopPayButton && selectedVariant?.availableForSale && (
        <ShopPayButton
          width="100%"
          variantIdsAndQuantities={[
            {
              id: selectedVariant?.id,
              quantity,
            },
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
