import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
import {
  getPromoLabels,
  type PromoLabelPosition,
  type PromoLabelProduct,
  type PromoLabelSize,
} from "~/utils/promo-labels";

const CORNER_CLASSES: Record<PromoLabelPosition, string> = {
  "top-left": "top-2.5 left-2.5 items-start",
  "top-right": "top-2.5 right-2.5 items-end",
  "bottom-left": "bottom-2.5 left-2.5 items-start",
  "bottom-right": "bottom-2.5 right-2.5 items-end",
};

const SIZE_CLASSES: Record<PromoLabelSize, string> = {
  xsmall: "px-1.5 py-0.5 text-[11px]",
  small: "px-2 py-1 text-xs",
  medium: "px-2.5 py-1 text-sm",
  large: "px-3 py-1.5 text-base",
};

// The same sizes from tablet up, written out in full so Tailwind sees them.
const MD_SIZE_CLASSES: Record<PromoLabelSize, string> = {
  xsmall: "md:px-1.5 md:py-0.5 md:text-[11px]",
  small: "md:px-2 md:py-1 md:text-xs",
  medium: "md:px-2.5 md:py-1 md:text-sm",
  large: "md:px-3 md:py-1.5 md:text-base",
};

/**
 * Product cards are much smaller than the product page image, so Theme
 * Settings can override the size there, with its own value for phones.
 * Left on "auto" / "same", a label keeps its own size, as before.
 */
function sizeClasses(
  labelSize: PromoLabelSize,
  context: "card" | "product",
  settings: Record<string, any>,
) {
  if (context !== "card") {
    return SIZE_CLASSES[labelSize];
  }
  const cardSize: string = settings?.promoLabelCardSize || "auto";
  const mobileSize: string = settings?.promoLabelCardMobileSize || "same";
  const desktop = (
    cardSize in SIZE_CLASSES ? cardSize : labelSize
  ) as PromoLabelSize;
  const mobile = (
    mobileSize in SIZE_CLASSES ? mobileSize : desktop
  ) as PromoLabelSize;
  if (mobile === desktop) {
    return SIZE_CLASSES[desktop];
  }
  return clsx(SIZE_CLASSES[mobile], MD_SIZE_CLASSES[desktop]);
}

const CORNERS: PromoLabelPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/**
 * Draws the promo labels that apply to `product` in the image's corners.
 * Must be placed inside a `relative` container.
 *
 * `topRight` is rendered first in the top-right corner, so the existing
 * Sale / New / Sold out badges and a top-right promo label stack instead
 * of overlapping.
 */
export function PromoLabels({
  product,
  topRight,
  context = "product",
}: {
  product: PromoLabelProduct | null | undefined;
  topRight?: ReactNode;
  context?: "card" | "product";
}) {
  const settings = useThemeSettings();
  const isDesignMode = useWeaverseStudioCheck();
  // In Studio, scheduled/expired labels are still drawn (faded, with a note)
  // so editors can check the dates. Shoppers only ever see active ones.
  const labels = getPromoLabels(product, settings, Boolean(isDesignMode));
  const radius = settings?.promoLabelBorderRadius ?? 0;

  return (
    <>
      {CORNERS.map((corner) => {
        const inCorner = labels.filter((l) => l.position === corner);
        const extra = corner === "top-right" ? topRight : null;
        if (!(inCorner.length || extra)) {
          return null;
        }
        return (
          <div
            key={corner}
            className={clsx(
              "pointer-events-none absolute z-1 flex max-w-[calc(100%-20px)] flex-col gap-1",
              CORNER_CLASSES[corner],
            )}
          >
            {extra}
            {inCorner.map((label) => (
              <span
                key={label.key}
                className={clsx(
                  "promo-label font-medium leading-tight",
                  sizeClasses(label.size, context, settings),
                  label.status !== "active" && "opacity-50",
                )}
                style={{
                  backgroundColor: label.backgroundColor,
                  color: label.textColor,
                  borderRadius: `${radius}px`,
                }}
              >
                {label.text}
                {isDesignMode && label.status !== "active" ? (
                  <span className="mt-0.5 block font-normal text-[10px] normal-case">
                    {label.scheduleNote}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        );
      })}
    </>
  );
}
