/**
 * Promo labels: small text tags drawn over product images (cards + PDP).
 * Configured in Theme Settings -> "Promo labels" (up to PROMO_LABEL_SLOTS).
 * Every label is off by default, so storefronts that never enable one
 * render nothing new.
 */

export const PROMO_LABEL_SLOTS = 3;

export type PromoLabelPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type PromoLabelSize = "small" | "medium" | "large";
type PromoLabelShowOn = "any" | "every" | "all";

export interface PromoLabel {
  key: string;
  text: string;
  size: PromoLabelSize;
  position: PromoLabelPosition;
  backgroundColor: string;
  textColor: string;
}

/** The product fields the rules look at. All optional: missing = no match. */
export interface PromoLabelProduct {
  id?: string;
  handle?: string;
  tags?: string[] | null;
  productType?: string | null;
  collections?: { nodes: { handle: string }[] } | null;
  wineType?: { value?: string | null } | null;
}

/** "Red, Rosé ,  sparkling" -> ["red", "rosé", "sparkling"] */
function splitList(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** Wine Type is a list metafield, stored as a JSON array string. */
function parseWineTypes(value?: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  } catch {
    return splitList(value);
  }
}

function intersects(wanted: string[], actual: string[]): boolean {
  return wanted.some((w) => actual.includes(w));
}

interface LabelRules {
  showOn?: PromoLabelShowOn;
  collections?: string;
  products?: string;
  tags?: string;
  productTypes?: string;
  wineTypes?: string;
  excluded?: string;
}

/**
 * True when the label should show for this product.
 * Empty rules are ignored; with no rules at all the label shows nowhere
 * (unless "All products" is chosen).
 */
export function matchesLabelRules(
  product: PromoLabelProduct,
  rules: LabelRules,
): boolean {
  const handle = (product.handle || "").toLowerCase();
  if (handle && splitList(rules.excluded).includes(handle)) {
    return false;
  }
  if (rules.showOn === "all") {
    return true;
  }

  const productTags = (product.tags || []).map((t) => t.toLowerCase());
  const productType = (product.productType || "").toLowerCase();
  const productCollections = (product.collections?.nodes || []).map((c) =>
    c.handle.toLowerCase(),
  );
  const productWineTypes = parseWineTypes(product.wineType?.value);

  const wantedCollections = splitList(rules.collections);
  const wantedProducts = splitList(rules.products);
  const wantedTags = splitList(rules.tags);
  const wantedTypes = splitList(rules.productTypes);
  const wantedWineTypes = splitList(rules.wineTypes);

  const results: boolean[] = [];
  if (wantedCollections.length) {
    results.push(intersects(wantedCollections, productCollections));
  }
  if (wantedProducts.length) {
    results.push(Boolean(handle) && wantedProducts.includes(handle));
  }
  if (wantedTags.length) {
    results.push(intersects(wantedTags, productTags));
  }
  if (wantedTypes.length) {
    results.push(wantedTypes.includes(productType));
  }
  if (wantedWineTypes.length) {
    results.push(intersects(wantedWineTypes, productWineTypes));
  }

  if (results.length === 0) {
    return false;
  }
  return rules.showOn === "every"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/** Reads the label slots out of theme settings and returns those that apply. */
export function getPromoLabels(
  product: PromoLabelProduct | null | undefined,
  settings: Record<string, any>,
): PromoLabel[] {
  if (!(product && settings)) {
    return [];
  }
  const labels: PromoLabel[] = [];
  for (let i = 1; i <= PROMO_LABEL_SLOTS; i += 1) {
    const p = `promoLabel${i}`;
    const text = (settings[`${p}Text`] || "").trim();
    if (!(settings[`${p}Enabled`] && text)) {
      continue;
    }
    const matches = matchesLabelRules(product, {
      showOn: settings[`${p}ShowOn`],
      collections: settings[`${p}Collections`],
      products: settings[`${p}Products`],
      tags: settings[`${p}Tags`],
      productTypes: settings[`${p}ProductTypes`],
      wineTypes: settings[`${p}WineTypes`],
      excluded: settings[`${p}Excluded`],
    });
    if (matches) {
      labels.push({
        key: p,
        text,
        size: settings[`${p}Size`] || "small",
        position: settings[`${p}Position`] || "top-left",
        backgroundColor: settings[`${p}BgColor`] || "#000000",
        textColor: settings[`${p}TextColor`] || "#ffffff",
      });
    }
  }
  return labels;
}
