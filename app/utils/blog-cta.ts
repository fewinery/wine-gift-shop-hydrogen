/**
 * Per-storefront blog CTA configuration.
 *
 * One article is shared by many brands, but the bottle is not: a pairing post
 * promotes a Brut on one storefront and a Blanc de Noirs on another, because
 * the first brand's bottle does not exist in the second brand's catalog.
 *
 * Two list metafields on the article carry that, both pointing at metaobject
 * entries so the people writing posts get dropdowns and product pickers
 * rather than typed handles:
 *
 *   custom.blog_storefronts  - where the post appears. Empty means everywhere.
 *   custom.blog_cta          - rows of { storefront, product | link }.
 *
 * Storefront entries hold a single field, the brand's domain, because that is
 * the one thing a running site can recognise itself by without a setting
 * being filled in by hand on all 65 storefronts.
 */

interface MetaobjectField {
  key: string;
  value?: string | null;
  reference?: unknown;
}

interface MetaobjectNode {
  fields?: MetaobjectField[] | null;
}

interface MetafieldWithReferences {
  references?: { nodes?: Array<MetaobjectNode | null> | null } | null;
}

export interface CtaEntry {
  domain: string | null;
  product: unknown;
  link: string | null;
  linkText: string | null;
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

/**
 * Field lookup that forgives how the key was spelled in the admin. Shopify
 * derives a key from whatever name someone typed, so "Link Text" may arrive
 * as link_text, linkText or link-text. A silent miss here would turn a whole
 * feature off with nothing to explain why.
 */
function field(node: MetaobjectNode | null | undefined, key: string) {
  const wanted = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return node?.fields?.find(
    (entry) => entry?.key?.replace(/[^a-z0-9]/gi, "").toLowerCase() === wanted,
  );
}

/**
 * The domain held by a Storefront metaobject entry.
 *
 * Tolerant about the field key on purpose. The definition carries a single
 * field, so if whoever set it up ended with a key other than "domain" the
 * only value present is still the domain - and a silent mismatch here would
 * mean every storefront quietly stops matching, which is a miserable thing
 * to debug.
 */
function domainOf(node: unknown) {
  const fields = (node as MetaobjectNode)?.fields ?? [];
  const named = fields.find(
    (entry) => entry?.key?.toLowerCase() === "domain",
  )?.value;
  const value = named ?? fields.find((entry) => entry?.value)?.value;
  return value ? normalizeDomain(value) : null;
}

/**
 * The storefront's own domain. The theme setting wins when it is filled in,
 * because on an Oxygen preview the hostname is the deployment slug rather
 * than the brand domain, and every row would miss while someone is testing.
 */
export function storefrontKey(request: Request, configured?: string | null) {
  const fromSetting = configured?.trim();
  if (fromSetting) {
    return normalizeDomain(fromSetting);
  }
  return normalizeDomain(new URL(request.url).hostname);
}

/**
 * Whether this storefront shows the article at all. An empty list means every
 * storefront, so a post is visible by default and only exceptions are listed.
 */
export function isVisibleToStorefront(
  metafield: MetafieldWithReferences | null | undefined,
  key: string,
) {
  const nodes = metafield?.references?.nodes ?? [];
  const domains = nodes.map(domainOf).filter(Boolean) as string[];
  if (domains.length === 0) {
    return true;
  }
  return domains.includes(key);
}

function toEntry(node: MetaobjectNode | null): CtaEntry {
  const storefront = field(node, "storefront");
  const product = field(node, "product");
  return {
    domain: storefront?.reference ? domainOf(storefront.reference) : null,
    product: product?.reference ?? null,
    link: field(node, "link")?.value?.trim() || null,
    linkText: field(node, "link_text")?.value?.trim() || null,
  };
}

/**
 * The row that applies to this storefront, or null for none.
 *
 * A brand's own row always wins, even when it is blank: an empty row is how
 * someone switches the CTA off for that brand, so it must not quietly fall
 * back to the default. Only a brand with no row of its own inherits one.
 */
export function resolveCtaEntry(
  metafield: MetafieldWithReferences | null | undefined,
  key: string,
) {
  const entries = (metafield?.references?.nodes ?? []).map(toEntry);

  const own = entries.find((entry) => entry.domain === key);
  const chosen = own ?? entries.find((entry) => !entry.domain);

  if (!chosen) {
    return null;
  }
  if (!(chosen.product || chosen.link)) {
    return null;
  }
  return chosen;
}
