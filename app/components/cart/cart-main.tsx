import { useOptimisticCart } from "@shopify/hydrogen";
import clsx from "clsx";
import { useRef } from "react";
import useScroll from "react-use/esm/useScroll";
import type { CartApiQueryFragment } from "storefront-api.generated";
import { Link } from "~/components/link";
import { ScrollArea } from "~/components/scroll-area";
import type { CartLayoutType } from "~/types/others";
import { groupBundles } from "~/utils/bundle";
import { CartBundleItem } from "./cart-bundle-item";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";

function CartEmpty({
  hidden = false,
  layout = "drawer",
  onClose,
}: {
  hidden: boolean;
  layout?: CartLayoutType;
  onClose?: () => void;
}) {
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  return (
    <div
      ref={scrollRef}
      className={clsx(
        layout === "drawer" && [
          "flex h-screen-dynamic flex-col content-start justify-center space-y-12 overflow-y-scroll px-5 pb-5 text-center transition",
          y > 0 && "border-t",
        ],
        layout === "page" && [
          "w-full gap-4 pb-12 md:items-start md:gap-8 lg:gap-12",
        ],
      )}
      hidden={hidden}
    >
      <div className={clsx(layout === "page" && "text-center")}>
        <p className="mb-4">
          Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
          started!
        </p>
        <Link
          variant="outline"
          to="/products"
          className={clsx(
            layout === "drawer" ? "w-full" : "min-w-48",
            "justify-center",
          )}
          onClick={onClose}
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

export function CartMain({
  layout,
  onClose,
  cart: originalCart,
}: {
  layout: CartLayoutType;
  onClose?: () => void;
  cart: CartApiQueryFragment;
}) {
  const scrollRef = useRef(null);
  const { y } = useScroll(scrollRef);
  const cart = useOptimisticCart<CartApiQueryFragment>(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);
  const cartHasItems = Boolean(cart) && cart.totalQuantity > 0;

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} layout={layout} />
      <div
        className={clsx(
          // min-w-0 so the column is the drawer's width, not the widest thing
          // inside it. A grid item defaults to min-width:auto, so one long
          // product name or offer label stretches the column past the drawer
          // and the totals end up printing off the right edge.
          //
          // The drawer is exactly as tall as the screen, so the two rows
          // share that height: the totals and buttons take what they need
          // and the list of items scrolls in whatever is left. min-h-0 is
          // what lets the list be shorter than its contents. On a screen too
          // short for even one item plus the buttons (a phone on its side),
          // the whole column scrolls instead, so Checkout is always reachable.
          layout === "drawer" &&
            "grid min-h-0 min-w-0 grow grid-cols-1 grid-rows-[minmax(8rem,1fr)_auto] overflow-y-auto px-4",
          layout === "page" && [
            "mx-auto w-full max-w-(--page-width) pb-12",
            "grid md:items-start lg:grid-cols-[1fr_480px]",
            "gap-8 md:gap-8 lg:gap-12",
          ],
        )}
      >
        <div
          ref={scrollRef}
          className={clsx([
            "-mx-4 min-w-0 pb-4",
            y > 0 ? "border-line-subtle border-t" : "",
            layout === "page" && "grow md:translate-y-4",
            layout === "drawer" && "flex min-h-0 flex-col transition",
          ])}
        >
          <ScrollArea
            // In the drawer the list fills its row and scrolls inside it. It
            // used to be capped at "screen height minus 312px", a guess at
            // how tall the totals and buttons were; once they grew past that
            // (discount rows, a second button) the buttons fell off the
            // bottom of the screen with no way to scroll to them.
            rootClassName={clsx(
              layout === "drawer" && "flex min-h-0 flex-1 flex-col",
            )}
            className={clsx(layout === "drawer" && "h-auto min-h-0 flex-1")}
            size="sm"
          >
            <ul
              className={clsx(
                "grid min-w-0 px-4",
                layout === "page" && "gap-9",
                layout === "drawer" && "gap-5",
              )}
            >
              {/* Pieces added together as one bundle are shown as one item;
                  every other line is shown on its own, as before. */}
              {groupBundles(
                cart?.lines?.nodes ?? [],
                (line) => line.attributes,
              ).map((entry) =>
                entry.kind === "bundle" ? (
                  <CartBundleItem
                    key={`bundle-${entry.bundle.id}`}
                    bundle={entry.bundle}
                    parts={entry.parts}
                    layout={layout}
                  />
                ) : (
                  <CartLineItem
                    key={entry.line.id}
                    line={entry.line}
                    layout={layout}
                  />
                ),
              )}
            </ul>
          </ScrollArea>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </>
  );
}
