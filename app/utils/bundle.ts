/**
 * Build-your-own bundles.
 *
 * A product page can add several things in one click: the package itself,
 * the wines picked for it, a wood card, merch. A product whose boolean
 * metafield custom.add_as_bundle is on asks for those pieces to stay
 * together as one bundle. Without it, nothing here applies and every piece
 * is its own item, as before.
 *
 * Shopify itself does not group them: each piece is still its own cart line,
 * and checkout, the emails and the order list them one by one. What ties
 * them together is three line attributes, read by the cart (one block, one
 * quantity, one remove button) and by the multi-recipient page (one gift
 * that is always sent whole).
 */

/** Shown on every line of the bundle, at checkout and on the order too, so
 * the warehouse can see which pieces go in one box. */
export const BUNDLE_NAME_KEY = "Bundle";
/** Hidden. The same for every line of one bundle. */
export const BUNDLE_ID_KEY = "_bundle";
/** Hidden. How many of this line one bundle holds. */
export const BUNDLE_UNIT_KEY = "_bundle_unit";

interface Attribute {
  key: string;
  value: string;
}

interface AttributeLike {
  key?: string | null;
  value?: string | null;
}

export interface BundleInfo {
  id: string;
  name: string;
  /** How many of this line one bundle holds. */
  unit: number;
}

/** FNV-1a: a short, stable fingerprint of a text. */
function fingerprint(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * The cart lines for one or more bundles of the given pieces.
 *
 * `lines` hold what ONE bundle contains; `count` is how many bundles. The
 * bundle's id is a fingerprint of its contents, so adding the very same
 * bundle again lands on the same lines and simply raises the count, while a
 * bundle with different wines, merch or message becomes a bundle of its own.
 */
export function toBundleLines<
  T extends {
    merchandiseId: string;
    quantity: number;
    attributes?: Attribute[];
  },
>(lines: T[], name: string, count: number): T[] {
  const contents = lines
    .map((line) =>
      JSON.stringify([
        line.merchandiseId,
        line.quantity,
        [...(line.attributes ?? [])]
          .map((attribute) => `${attribute.key}=${attribute.value}`)
          .sort(),
      ]),
    )
    .sort();
  const id = fingerprint(JSON.stringify([name, contents]));

  return lines.map((line) => ({
    ...line,
    quantity: line.quantity * count,
    attributes: [
      ...(line.attributes ?? []),
      { key: BUNDLE_NAME_KEY, value: name },
      { key: BUNDLE_ID_KEY, value: id },
      { key: BUNDLE_UNIT_KEY, value: String(line.quantity) },
    ],
  }));
}

/** The bundle a cart line belongs to, or null for a line on its own. */
export function bundleOf(
  attributes: AttributeLike[] | null | undefined,
): BundleInfo | null {
  const read = (key: string) =>
    attributes?.find((attribute) => attribute?.key === key)?.value ?? "";
  const id = read(BUNDLE_ID_KEY);
  if (!id) {
    return null;
  }
  const unit = Number.parseInt(read(BUNDLE_UNIT_KEY), 10);
  return {
    id,
    name: read(BUNDLE_NAME_KEY),
    unit: Number.isFinite(unit) && unit > 0 ? unit : 1,
  };
}

/** Whether an attribute is one of the bundle's own, which the bundle's
 * display already says in its own way. */
export function isBundleAttribute(key: string | null | undefined) {
  return (
    key === BUNDLE_NAME_KEY || key === BUNDLE_ID_KEY || key === BUNDLE_UNIT_KEY
  );
}

export type BundleEntry<L> =
  | { kind: "line"; line: L }
  | {
      kind: "bundle";
      bundle: BundleInfo;
      parts: Array<{ line: L; unit: number }>;
    };

/**
 * Lines in their cart order, with each bundle's lines gathered together at
 * the place its first line appears.
 */
export function groupBundles<L>(
  lines: L[],
  attributesOf: (line: L) => AttributeLike[] | null | undefined,
): BundleEntry<L>[] {
  const entries: BundleEntry<L>[] = [];
  const byId = new Map<string, Extract<BundleEntry<L>, { kind: "bundle" }>>();
  for (const line of lines) {
    const bundle = bundleOf(attributesOf(line));
    if (!bundle) {
      entries.push({ kind: "line", line });
      continue;
    }
    let entry = byId.get(bundle.id);
    if (!entry) {
      entry = { kind: "bundle", bundle, parts: [] };
      byId.set(bundle.id, entry);
      entries.push(entry);
    }
    entry.parts.push({ line, unit: bundle.unit });
  }
  return entries;
}

/**
 * How many whole bundles a set of lines holds. Normally every line agrees;
 * if Shopify ever trims one line (stock), the smallest count wins, and it
 * is never less than one so the bundle stays on screen to be fixed.
 */
export function bundleCount(
  parts: Array<{ quantity: number; unit: number }>,
): number {
  if (parts.length === 0) {
    return 0;
  }
  const counts = parts.map((part) =>
    Math.floor(part.quantity / Math.max(1, part.unit)),
  );
  return Math.max(1, Math.min(...counts));
}
