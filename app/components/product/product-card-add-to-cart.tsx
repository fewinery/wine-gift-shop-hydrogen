import { HandbagSimpleIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import type { ProductVariantFragment } from "storefront-api.generated";
import { Link } from "~/components/link";
import { AddToCartButton } from "~/components/product/add-to-cart-button";

/**
 * The card's "Add to cart" button. It adds the variant on screen straight to
 * the cart and opens the cart drawer; it does not open the quick view.
 *
 * The class list is deliberately identical to the trigger it replaces, so the
 * cards look exactly as they do today on every storefront.
 */
function buttonClassName({
  placement,
  buttonType,
  showOnHover,
}: {
  placement: "image" | "bottom";
  buttonType: "icon" | "text";
  showOnHover: boolean;
}) {
  return clsx(
    // Repeated from the Button base so the combined-listing fallback below,
    // which renders a Link rather than a button, lines up with it exactly.
    "items-center whitespace-nowrap rounded-none text-base leading-tight",
    "font-medium",
    placement === "image" && [
      "group/quick-shop absolute bottom-4 h-10.5 p-3 leading-4",
      buttonType === "icon"
        ? "right-4 rounded-full shadow-xl"
        : "inset-x-4 shadow-xs",
      showOnHover && "opacity-0 transition-opacity group-hover:opacity-100",
    ],
    placement === "bottom" && "w-full py-[10px]",
  );
}

function ButtonLabel({
  buttonType,
  buttonText,
  placement,
}: {
  buttonType: "icon" | "text";
  buttonText: string;
  placement: "image" | "bottom";
}) {
  if (buttonType === "icon") {
    return (
      <>
        <HandbagSimpleIcon size={16} className="h-4 w-4" />
        <span className="w-0 overflow-hidden pl-0 text-base transition-all group-hover/quick-shop:w-9.5 group-hover/quick-shop:pl-2">
          Add
        </span>
      </>
    );
  }
  return (
    <span className={placement === "image" ? "px-2" : ""}>{buttonText}</span>
  );
}

export function ProductCardAddToCart({
  variant,
  productHandle,
  productSearch,
  buttonText = "Add to cart",
  buttonType = "text",
  placement = "bottom",
  showOnHover = false,
  needsProductPage = false,
}: {
  variant?: ProductVariantFragment | null;
  productHandle: string;
  productSearch: string;
  buttonText?: string;
  buttonType?: "icon" | "text";
  placement?: "image" | "bottom";
  showOnHover?: boolean;
  needsProductPage?: boolean;
}) {
  const className = buttonClassName({ placement, buttonType, showOnHover });
  const label = (
    <ButtonLabel
      buttonType={buttonType}
      buttonText={buttonText}
      placement={placement}
    />
  );

  // A combined listing has no single variant to add — its "variants" are other
  // products — so the button keeps its look and sends the customer to the
  // product page to choose.
  if (needsProductPage || !variant?.id) {
    return (
      <Link
        to={`/products/${productHandle}${productSearch}`}
        prefetch="intent"
        variant="primary"
        className={className}
      >
        {label}
      </Link>
    );
  }

  if (!variant.availableForSale) {
    return (
      <AddToCartButton
        disabled
        lines={[{ merchandiseId: variant.id, quantity: 1 }]}
        variant="primary"
        className={className}
      >
        <span className={placement === "image" ? "px-2" : ""}>SOLD OUT</span>
      </AddToCartButton>
    );
  }

  return (
    <AddToCartButton
      lines={[
        {
          merchandiseId: variant.id,
          quantity: 1,
          selectedVariant: variant,
        },
      ]}
      data-test="add-to-cart"
      variant="primary"
      className={className}
    >
      {label}
    </AddToCartButton>
  );
}
