import { InfoIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useRef, useState } from "react";
import { Link } from "~/components/link";
import { cn } from "~/utils/cn";

const DEFAULT_LABEL = "Club & Loyalty from";
// Earlier defaults. A storefront that never edited the label can still have
// one of these saved, and a saved value beats the code default - so treat
// them as "not set" and show the current wording instead.
const RETIRED_LABELS = new Set([
  "Club Member Price as Low as",
  "Club or Loyalty Pricing from",
]);

const PERCENT = 100;
const CENTS = 100;
// Long enough for the pointer to cross the gap between the icon and the
// message without the message closing under it.
const HOVER_CLOSE_DELAY_MS = 150;

const DEFAULT_INFO_TEXT =
  "If you join our club or loyalty program, you can get up to {discount}% off all your purchases, free shipping, and special offers.";
const DEFAULT_INFO_LINK_TEXT = "Click here to check out club options.";
const DEFAULT_INFO_LINK = "/club";

/**
 * The "i" next to the club price. One behaviour for every device: a mouse
 * opens it on hover, a finger or the keyboard opens it on tap / Enter. Phones
 * have no hover, so a hover-only tooltip would be invisible there; a popover
 * that also opens on tap keeps the same message on both, and the link inside
 * it is what takes the shopper to the club page.
 */
function ClubPriceInfo({ discount }: { discount: number }) {
  const { clubInfoText, clubInfoLinkText, clubInfoLink } = useThemeSettings();
  const [open, setOpen] = useState(false);
  const hovering = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openFromHover(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") {
      return;
    }
    hovering.current = true;
    cancelClose();
    setOpen(true);
  }

  function closeFromHover(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") {
      return;
    }
    hovering.current = false;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  }

  // Clear a pending close if the card unmounts (filters, pagination).
  useEffect(
    () => () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    },
    [],
  );

  const text = (clubInfoText || DEFAULT_INFO_TEXT).replaceAll(
    "{discount}",
    String(discount),
  );
  const linkText = clubInfoLinkText || DEFAULT_INFO_LINK_TEXT;
  const link = clubInfoLink || DEFAULT_INFO_LINK;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="About club and loyalty pricing"
          className="inline-flex shrink-0 cursor-pointer items-center self-center text-body-subtle transition-colors hover:text-body"
          onPointerEnter={openFromHover}
          onPointerLeave={closeFromHover}
          onClick={(event) => {
            // A mouse already opened it on hover. Without this the click
            // that follows would toggle it shut again.
            if (hovering.current) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <InfoIcon className="size-4" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={12}
          // Hover must not pull focus into the message or scroll the page.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerEnter={openFromHover}
          onPointerLeave={closeFromHover}
          className="z-1000 max-w-[min(18rem,calc(100vw-24px))] bg-body px-3 py-2 text-left font-body text-background text-sm leading-snug shadow-xs"
        >
          <p>{text}</p>
          {link && (
            <Link
              to={link}
              variant="underline"
              className="mt-1 text-current after:bg-current"
              onClick={() => setOpen(false)}
            >
              {linkText}
            </Link>
          )}
          <Popover.Arrow asChild>
            <span className="border-x-6 border-x-transparent border-t-6 border-t-body" />
          </Popover.Arrow>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * The club member price derived from whatever price is on screen, so the
 * figure always tracks the price shown directly above it rather than drifting
 * to a different variant.
 *
 * Off unless a storefront switches it on. This theme is shared by brands with
 * no wine club at all — corporate gifting among them — and a club discount
 * shown there is not a cosmetic slip, it is a wrong price on a live site. So
 * the default is silence, and a brand opts in.
 */
export function ClubMemberPrice({
  price,
  className,
}: {
  price?: Pick<MoneyV2, "amount" | "currencyCode"> | null;
  className?: string;
}) {
  // Read from clubPricingLabel, not the original clubPriceLabel: storefronts
  // that switched this on before the wording changed still have the old text
  // saved under the old name, and a saved value beats the code default.
  const {
    clubPriceEnabled,
    clubPricingLabel,
    clubPriceDiscount,
    clubInfoEnabled,
  } = useThemeSettings();

  if (!clubPriceEnabled) {
    return null;
  }

  const amount = Number(price?.amount);
  const discount = Number(clubPriceDiscount);

  // A missing price, a zero price or a nonsense discount means there is
  // nothing honest to show, so show nothing rather than "$NaN".
  if (!(price?.currencyCode && Number.isFinite(amount)) || amount <= 0) {
    return null;
  }
  if (!Number.isFinite(discount) || discount <= 0 || discount >= PERCENT) {
    return null;
  }

  const memberAmount =
    Math.round(amount * (1 - discount / PERCENT) * CENTS) / CENTS;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-1 font-body leading-tight",
        className,
      )}
    >
      <span className="text-body-subtle text-sm">
        {clubPricingLabel && !RETIRED_LABELS.has(clubPricingLabel.trim())
          ? clubPricingLabel
          : DEFAULT_LABEL}
      </span>
      {/* Price and icon wrap together, so the "i" never sits alone on a line. */}
      <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
        <Money
          as="span"
          withoutTrailingZeros
          data={
            {
              amount: memberAmount.toFixed(2),
              currencyCode: price.currencyCode,
            } as MoneyV2
          }
        />
        {clubInfoEnabled && <ClubPriceInfo discount={discount} />}
      </span>
    </div>
  );
}
