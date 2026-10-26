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
  small: "px-2 py-1 text-xs",
  medium: "px-2.5 py-1 text-sm",
  large: "px-3 py-1.5 text-base",
};

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
}: {
  product: PromoLabelProduct | null | undefined;
  topRight?: ReactNode;
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
                  SIZE_CLASSES[label.size],
                  label.status !== "active" && "opacity-50",
                )}
                style={{
                  backgroundColor: label.backgroundColor,
                  color: label.textColor,
                  borderRadius: `${radius}px`,
                }}
              >
                {label.text}
                {isDesignMode && label.scheduleNote ? (
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
