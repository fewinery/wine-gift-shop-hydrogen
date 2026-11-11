import { CaretDownIcon } from "@phosphor-icons/react";
import { CartForm, Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { ScrollArrow, useRowScroll } from "~/components/product/add-stepper";
import { cn } from "~/utils/cn";
import type { OrderLine } from "~/utils/multi-recipient";

/** A product offered as an extra, already narrowed to what the row shows. */
export interface AddOn {
  id: string;
  title: string;
  handle: string;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  variantId: string;
  price: { amount: string; currencyCode: string };
}

function price(amount: number, currencyCode: string) {
  return { amount: amount.toFixed(2), currencyCode } as MoneyV2;
}

function sendingLabel(count: number) {
  if (count === 0) {
    return "Not assigned yet";
  }
  return count === 1
    ? "Sending to 1 recipient"
    : `Sending to ${count} recipients`;
}

function AddOnTile({ addOn }: { addOn: AddOn }) {
  return (
    <div className="flex w-56 shrink-0 snap-start flex-col gap-2 border border-neutral-300 p-3">
      <div className="h-28">
        {addOn.image && (
          <Image
            data={addOn.image}
            width={320}
            sizes="200px"
            className="[&_img]:object-contain"
            alt={addOn.image.altText || addOn.title}
          />
        )}
      </div>
      <p className="line-clamp-2 text-neutral-900 text-sm leading-snug">
        {addOn.title}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Money
          withoutTrailingZeros
          className="text-neutral-600 text-sm"
          data={addOn.price as MoneyV2}
        />
        {/* A plain cart add rather than the product card's button: that one
            opens the cart drawer, which would cover the page the shopper is
            in the middle of filling in. */}
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesAdd}
          inputs={{ lines: [{ merchandiseId: addOn.variantId, quantity: 1 }] }}
        >
          {(fetcher: FetcherWithComponents<unknown>) => (
            <Button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="px-3 py-1.5 text-sm"
            >
              {fetcher.state === "idle" ? "+ Add" : "Adding"}
            </Button>
          )}
        </CartForm>
      </div>
    </div>
  );
}

/**
 * The top of the page: what is in the cart and how many recipients each item
 * is going to, with the add-ons underneath. Add-ons sit here, before the
 * recipients, so anything added is there to hand out when the shopper gets
 * to assigning gifts.
 */
export function CartOverview({
  lines,
  addOns,
  addOnsHeading,
}: {
  lines: OrderLine[];
  addOns: AddOn[];
  addOnsHeading: string;
}) {
  const [addOnsOpen, setAddOnsOpen] = useState(true);
  // Re-measured when the row is opened as well as when its contents change:
  // while it is closed there is no row on the page to measure.
  const row = useRowScroll(`${addOns.length}-${addOnsOpen}`);
  const showArrows = row.canScrollPrev || row.canScrollNext;

  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {lines.map(({ item, recipientCount }) => (
          <li
            key={item.lineId}
            className="flex flex-col gap-2 border border-neutral-300 p-3"
          >
            <div className="h-28">
              {item.image && (
                <Image
                  data={item.image}
                  width={320}
                  sizes="200px"
                  className="[&_img]:object-contain"
                  alt={item.image.altText || item.title}
                />
              )}
            </div>
            <p className="text-neutral-900 text-sm leading-snug">
              {item.title}
            </p>
            {item.variantTitle && (
              <p className="text-neutral-500 text-xs">{item.variantTitle}</p>
            )}
            <Money
              withoutTrailingZeros
              className="text-neutral-600 text-sm"
              data={price(item.unitPrice, item.currencyCode)}
            />
            <p
              className={cn(
                "mt-auto text-xs",
                recipientCount > 0 ? "text-neutral-900" : "text-neutral-500",
              )}
            >
              {sendingLabel(recipientCount)}
            </p>
          </li>
        ))}
      </ul>

      {addOns.length > 0 && (
        <div className="space-y-3 border-neutral-200 border-t pt-4">
          <button
            type="button"
            onClick={() => setAddOnsOpen((current) => !current)}
            aria-expanded={addOnsOpen}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <span className="font-bold text-neutral-900 text-sm uppercase tracking-wide">
              {addOnsHeading}
            </span>
            <CaretDownIcon
              size={16}
              className={cn("transition-transform", addOnsOpen && "rotate-180")}
            />
          </button>
          {addOnsOpen && (
            <div className="flex min-w-0 items-center gap-2">
              {showArrows && (
                <ScrollArrow
                  direction="prev"
                  label="Previous add-ons"
                  disabled={!row.canScrollPrev}
                  onClick={() => row.scroll("prev")}
                />
              )}
              <div
                ref={row.ref}
                onScroll={row.update}
                className="flex min-w-0 flex-1 snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {addOns.map((addOn) => (
                  <AddOnTile key={addOn.id} addOn={addOn} />
                ))}
              </div>
              {showArrows && (
                <ScrollArrow
                  direction="next"
                  label="Next add-ons"
                  disabled={!row.canScrollNext}
                  onClick={() => row.scroll("next")}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
