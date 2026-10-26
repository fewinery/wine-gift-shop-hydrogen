import {
  createSchema,
  type HydrogenComponentProps,
  useWeaverse,
  type WeaverseCollection,
  type WeaverseProduct,
} from "@weaverse/hydrogen";
import { useLoaderData } from "react-router";
import type { loader as productRouteLoader } from "~/routes/products/product";

type ShowOn = "all" | "any" | "every";
type TextAlign = "left" | "center" | "right";

interface ProductMessageBannerProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  title?: string;
  text?: string;
  titleSize?: number;
  textSize?: number;
  backgroundColor?: string;
  titleColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number;
  textAlign?: TextAlign;
  showOn?: ShowOn;
  collections?: WeaverseCollection[];
  products?: WeaverseProduct[];
  tags?: string;
  productTypes?: string;
  wineTypes?: string;
  excludedProducts?: WeaverseProduct[];
}

interface BannerProduct {
  id: string;
  handle: string;
  tags?: string[];
  productType?: string;
  collections?: { nodes: { handle: string }[] };
  wineType?: { value?: string | null } | null;
}

/** "Red, Rosé ,  sparkling" -> ["red", "rosé", "sparkling"] */
function splitList(value?: string): string[] {
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

function numericId(gid: string): string {
  return gid.split("/").pop() || "";
}

function isSameProduct(picked: WeaverseProduct, product: BannerProduct) {
  return (
    String(picked.id) === numericId(product.id) ||
    picked.handle === product.handle
  );
}

function intersects(wanted: string[], actual: string[]): boolean {
  return wanted.some((w) => actual.includes(w));
}

/**
 * Returns true when the banner should show for this product.
 * Only rules that have a value count — an empty rule is ignored.
 */
export function matchesBannerRules(
  product: BannerProduct,
  props: ProductMessageBannerProps,
): boolean {
  const {
    showOn = "any",
    collections = [],
    products = [],
    tags,
    productTypes,
    wineTypes,
    excludedProducts = [],
  } = props;

  if (excludedProducts.some((p) => isSameProduct(p, product))) {
    return false;
  }
  if (showOn === "all") {
    return true;
  }

  const productTags = (product.tags || []).map((t) => t.toLowerCase());
  const productType = (product.productType || "").toLowerCase();
  const productCollections = (product.collections?.nodes || []).map((c) =>
    c.handle.toLowerCase(),
  );
  const productWineTypes = parseWineTypes(product.wineType?.value);

  const wantedTags = splitList(tags);
  const wantedTypes = splitList(productTypes);
  const wantedWineTypes = splitList(wineTypes);
  const wantedCollections = collections
    .map((c) => c?.handle?.toLowerCase())
    .filter(Boolean);

  const results: boolean[] = [];
  if (wantedCollections.length) {
    results.push(intersects(wantedCollections, productCollections));
  }
  if (products.length) {
    results.push(products.some((p) => isSameProduct(p, product)));
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

  // No rules configured -> show nowhere (avoids surprising sitewide banners).
  if (results.length === 0) {
    return false;
  }
  return showOn === "every" ? results.every(Boolean) : results.some(Boolean);
}

export default function ProductMessageBanner(props: ProductMessageBannerProps) {
  const {
    ref,
    title,
    text,
    titleSize = 20,
    textSize = 16,
    backgroundColor = "#f5f0e8",
    titleColor = "#000000",
    textColor = "#000000",
    borderColor,
    borderRadius = 0,
    padding = 20,
    textAlign = "left",
    showOn,
    collections,
    products,
    tags,
    productTypes,
    wineTypes,
    excludedProducts,
    ...rest
  } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();
  const { isDesignMode } = useWeaverse();

  if (!product || !(title || text)) {
    return null;
  }

  const visible = matchesBannerRules(product as BannerProduct, props);

  if (!visible) {
    if (!isDesignMode) {
      return null;
    }
    // Studio only: keep the block selectable and explain why it is hidden.
    return (
      <div
        ref={ref}
        {...rest}
        className="border border-gray-400 border-dashed p-3 text-gray-500 text-sm"
      >
        Message banner hidden on this product — its display rules don't match.
        (Only visible in the editor.)
      </div>
    );
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="w-full"
      style={{
        backgroundColor,
        borderRadius,
        padding,
        textAlign,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    >
      {title ? (
        <p
          className="font-semibold leading-tight"
          style={{ fontSize: titleSize, color: titleColor }}
        >
          {title}
        </p>
      ) : null}
      {text ? (
        <div
          className="prose max-w-none [&_a]:underline [&_p]:m-0"
          style={{
            fontSize: textSize,
            color: textColor,
            marginTop: title ? 6 : 0,
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : null}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--message-banner",
  title: "Message banner",
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Limited release",
        },
        {
          type: "richtext",
          name: "text",
          label: "Text",
          defaultValue: "<p>Only a few cases left of this vintage.</p>",
        },
        {
          type: "range",
          name: "titleSize",
          label: "Title size",
          configs: { min: 12, max: 48, step: 1, unit: "px" },
          defaultValue: 20,
        },
        {
          type: "range",
          name: "textSize",
          label: "Text size",
          configs: { min: 10, max: 32, step: 1, unit: "px" },
          defaultValue: 16,
        },
        {
          type: "toggle-group",
          name: "textAlign",
          label: "Alignment",
          configs: {
            options: [
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ],
          },
          defaultValue: "left",
        },
      ],
    },
    {
      group: "Style",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#f5f0e8",
        },
        {
          type: "color",
          name: "titleColor",
          label: "Title color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "borderColor",
          label: "Border color",
          helpText: "Leave empty for no border.",
        },
        {
          type: "range",
          name: "padding",
          label: "Padding",
          configs: { min: 0, max: 48, step: 2, unit: "px" },
          defaultValue: 20,
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Corner radius",
          configs: { min: 0, max: 32, step: 1, unit: "px" },
          defaultValue: 0,
        },
      ],
    },
    {
      group: "Display rules",
      inputs: [
        {
          type: "select",
          name: "showOn",
          label: "Show this banner on",
          configs: {
            options: [
              { value: "any", label: "Products matching ANY rule" },
              { value: "every", label: "Products matching ALL rules" },
              { value: "all", label: "All products" },
            ],
          },
          defaultValue: "any",
          helpText:
            "Empty rules are ignored. With no rules filled in, the banner shows nowhere.",
        },
        {
          type: "collection-list",
          name: "collections",
          label: "Collections",
          condition: (data: ProductMessageBannerProps) => data.showOn !== "all",
        },
        {
          type: "product-list",
          name: "products",
          label: "Specific products",
          condition: (data: ProductMessageBannerProps) => data.showOn !== "all",
        },
        {
          type: "text",
          name: "tags",
          label: "Tags",
          placeholder: "holiday, limited",
          helpText: "Comma-separated. Not case-sensitive.",
          condition: (data: ProductMessageBannerProps) => data.showOn !== "all",
        },
        {
          type: "text",
          name: "productTypes",
          label: "Product types",
          placeholder: "Wine, Gift Set",
          helpText: "Comma-separated. Must match the full product type.",
          condition: (data: ProductMessageBannerProps) => data.showOn !== "all",
        },
        {
          type: "text",
          name: "wineTypes",
          label: "Wine types",
          placeholder: "Red, Sparkling",
          helpText:
            "Comma-separated. Matches the 'Wine Type (Custom Shopify)' metafield.",
          condition: (data: ProductMessageBannerProps) => data.showOn !== "all",
        },
        {
          type: "product-list",
          name: "excludedProducts",
          label: "Never show on these products",
        },
      ],
    },
  ],
});
