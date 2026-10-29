import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useState } from "react";
import { Image } from "~/components/image";
import { ClubMemberPrice } from "~/components/product/club-member-price";
import { cn } from "~/utils/cn";

/**
 * The wine add-on picker used by the prebuilt packages.
 *
 * A package product carries two metafields: one naming a Wine picker
 * metaobject (its tabs, and the bottles in each) and one saying how many
 * bottles the shopper has to choose. The bottles are ordinary products sold
 * at their own price, so this adds cart lines rather than swapping bundle
 * components - which is also why the same wine can be chosen twice.
 */

/** The slice of a wine this picker needs. It arrives through a generic
 * metaobject reference, so it is read structurally rather than through one of
 * the generated fragment types. */
export interface WinePickerProduct {
  id: string;
  title: string;
  handle?: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  variants?: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price?: Pick<MoneyV2, "amount" | "currencyCode"> | null;
    }>;
  } | null;
}

export interface WinePickerTab {
  id: string;
  title: string;
  wines: WinePickerProduct[];
}

export interface WinePickerConfig {
  active: boolean;
  tabs: WinePickerTab[];
}

/** productId → how many of that bottle are chosen. */
export type WineSelection = Record<string, number>;

interface MetaobjectField {
  key?: string | null;
  value?: string | null;
  references?: { nodes?: unknown[] | null } | null;
}

interface MetaobjectNode {
  id?: string;
  fields?: MetaobjectField[] | null;
}

/**
 * Field lookup that forgives how the key was spelled in the admin, the same
 * way the blog CTA reader does. Shopify derives a key from whatever name
 * someone typed, and a silent miss here would turn the whole picker off with
 * nothing on screen to explain why.
 */
function field(node: MetaobjectNode | null | undefined, key: string) {
  const wanted = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return node?.fields?.find(
    (entry) => entry?.key?.replace(/[^a-z0-9]/gi, "").toLowerCase() === wanted,
  );
}

function toTab(node: MetaobjectNode | null, index: number): WinePickerTab {
  const wines = (field(node, "wines")?.references?.nodes ??
    []) as WinePickerProduct[];
  return {
    id: node?.id ?? `tab-${index}`,
    title: field(node, "title")?.value?.trim() ?? "",
    wines: wines.filter(Boolean),
  };
}

/**
 * Reads the Wine picker metaobject off the product.
 *
 * A tab with no title or no bottles is dropped rather than rendered: nothing
 * is marked required in the admin, so a half-built entry is a normal state
 * and should simply not show up yet.
 */
export function parseWinePicker(metafield: unknown): WinePickerConfig {
  const node = (metafield as { reference?: MetaobjectNode })?.reference;
  if (!node) {
    return { active: false, tabs: [] };
  }
  const tabs = (
    (field(node, "tabs")?.references?.nodes ?? []) as MetaobjectNode[]
  )
    .map(toTab)
    .filter((tab) => tab.title && tab.wines.length > 0);

  return {
    active: field(node, "active")?.value === "true",
    tabs,
  };
}

/** How many bottles this package asks for. 0 means it is not a package. */
export function parseBottlesRequired(metafield: unknown) {
  const raw = (metafield as { value?: string | null })?.value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function firstSellableVariant(wine: WinePickerProduct) {
  return wine.variants?.nodes?.find((variant) => variant.availableForSale);
}

/** Total bottles chosen across every tab, not just the one on screen. */
export function countSelected(selection: WineSelection) {
  return Object.values(selection).reduce((total, qty) => total + qty, 0);
}

/**
 * Cart lines for the chosen bottles. One line per distinct wine carrying its
 * quantity, so two Cabernets and a Chardonnay read as two lines rather than
 * three.
 */
export function getWineLines(
  tabs: WinePickerTab[],
  selection: WineSelection,
  attributes?: Array<{ key: string; value: string }>,
) {
  const wines = new Map<string, WinePickerProduct>();
  for (const tab of tabs) {
    for (const wine of tab.wines) {
      wines.set(wine.id, wine);
    }
  }

  return Object.entries(selection)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const variant = firstSellableVariant(
        wines.get(productId) ?? ({} as WinePickerProduct),
      );
      if (!variant) {
        return null;
      }
      return {
        merchandiseId: variant.id,
        quantity: qty,
        ...(attributes?.length ? { attributes } : {}),
      };
    })
    .filter(Boolean) as Array<{
    merchandiseId: string;
    quantity: number;
    attributes?: Array<{ key: string; value: string }>;
  }>;
}

/**
 * Everything the product page needs to render and gate the picker, in one
 * call. Kept here rather than in the buy-buttons section so that section
 * stays readable - it already carries the merch and wood card upsells.
 */
export function useWinePicker(product: unknown, packageHandle?: string) {
  const [selection, setSelection] = useState<WineSelection>({});
  const owner = product as
    | { winePicker?: unknown; winePickerBottles?: unknown }
    | undefined;
  const config = parseWinePicker(owner?.winePicker);
  const required = parseBottlesRequired(owner?.winePickerBottles);
  const enabled = config.active && config.tabs.length > 0 && required > 0;
  const chosen = countSelected(selection);
  const remaining = Math.max(required - chosen, 0);
  // Ties the loose bottle lines to the package they belong in. The warehouse
  // otherwise receives a box and three unrelated bottles and has to guess.
  // Underscore-prefixed, so the shopper never sees it.
  const attributes = enabled
    ? [{ key: "_package", value: packageHandle ?? "" }]
    : undefined;

  return {
    enabled,
    tabs: config.tabs,
    required,
    selection,
    setSelection,
    remaining,
    complete: !enabled || chosen === required,
    attributes,
    lines: enabled ? getWineLines(config.tabs, selection, attributes) : [],
    gateLabel:
      remaining === 1
        ? "Choose 1 more bottle"
        : `Choose ${remaining} more bottles`,
  };
}

function Stepper({
  quantity,
  canAdd,
  onChange,
  addLabel,
}: {
  quantity: number;
  canAdd: boolean;
  onChange: (next: number) => void;
  addLabel: string;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => onChange(1)}
        className={cn(
          "w-full border border-neutral-400 px-3 py-2 text-sm transition-colors",
          canAdd
            ? "hover:border-black hover:bg-neutral-50"
            : "cursor-not-allowed opacity-40",
        )}
      >
        {addLabel}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between border border-black">
      <button
        type="button"
        aria-label="Remove one"
        onClick={() => onChange(quantity - 1)}
        className="px-3 py-2 text-base leading-none transition-colors hover:bg-neutral-100"
      >
        &minus;
      </button>
      <span className="text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Add one more"
        disabled={!canAdd}
        onClick={() => onChange(quantity + 1)}
        className={cn(
          "px-3 py-2 text-base leading-none transition-colors",
          canAdd ? "hover:bg-neutral-100" : "cursor-not-allowed opacity-40",
        )}
      >
        +
      </button>
    </div>
  );
}

function WineCard({
  wine,
  quantity,
  canAdd,
  onChange,
  addLabel,
}: {
  wine: WinePickerProduct;
  quantity: number;
  canAdd: boolean;
  onChange: (next: number) => void;
  addLabel: string;
}) {
  const variant = firstSellableVariant(wine);
  const image = wine.featuredImage;

  return (
    <div className="flex w-40 shrink-0 flex-col gap-2 text-left">
      <div className="flex h-32 items-center justify-center">
        {image?.url && (
          <Image
            data={image}
            width={320}
            sizes="160px"
            className="h-full w-auto object-contain"
            alt={image.altText || wine.title}
          />
        )}
      </div>
      <p className="line-clamp-3 text-sm leading-snug">{wine.title}</p>
      {variant?.price && (
        <Money data={variant.price} withoutTrailingZeros className="text-sm" />
      )}
      <ClubMemberPrice price={variant?.price} className="justify-start" />
      <div className="mt-auto pt-1">
        {variant ? (
          <Stepper
            quantity={quantity}
            canAdd={canAdd}
            onChange={onChange}
            addLabel={addLabel}
          />
        ) : (
          <p className="py-2 text-neutral-500 text-sm">Sold out</p>
        )}
      </div>
    </div>
  );
}

export function WinePicker({
  heading,
  addLabel,
  tabs,
  required,
  selection,
  onChange,
}: {
  heading: string;
  addLabel: string;
  tabs: WinePickerTab[];
  required: number;
  selection: WineSelection;
  onChange: (next: WineSelection) => void;
}) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const chosen = countSelected(selection);
  // The count is across every tab, so switching from Red to White keeps what
  // is already in the box rather than starting again.
  const canAdd = chosen < required;

  if (!activeTab) {
    return null;
  }

  function setQuantity(productId: string, next: number) {
    const updated = { ...selection };
    if (next <= 0) {
      delete updated[productId];
    } else {
      updated[productId] = next;
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-bold text-neutral-900 text-sm uppercase tracking-wide">
          {heading}
        </p>
        <span
          className={cn(
            "text-sm",
            chosen === required ? "text-neutral-900" : "text-neutral-500",
          )}
          aria-live="polite"
        >
          {chosen} of {required} chosen
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto border-neutral-200 border-b pb-px"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-black font-medium text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900",
              )}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {activeTab.wines.map((wine) => (
          <WineCard
            key={wine.id}
            wine={wine}
            quantity={selection[wine.id] ?? 0}
            canAdd={canAdd}
            onChange={(next) => setQuantity(wine.id, next)}
            addLabel={addLabel}
          />
        ))}
      </div>
    </div>
  );
}
