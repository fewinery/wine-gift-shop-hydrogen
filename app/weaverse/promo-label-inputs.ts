/**
 * Theme Settings inputs for the "Promo labels" group (3 label slots).
 * Rendered by ~/components/product/promo-labels.tsx; matching rules live in
 * ~/utils/promo-labels.ts.
 *
 * The slots are written out in full on purpose: Weaverse sends each
 * `condition` to Studio as source text (fn.toString()), so a condition may
 * only reference its own `theme` argument — no shared helpers or variables.
 */

import type { HydrogenThemeSchema } from "@weaverse/hydrogen";

type ThemeInputs = HydrogenThemeSchema["settings"][number]["inputs"];

const POSITION_OPTIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const SHOW_ON_OPTIONS = [
  { value: "any", label: "Products matching ANY rule" },
  { value: "every", label: "Products matching ALL rules" },
  { value: "all", label: "All products" },
];

const RULES_HELP =
  "Rules are comma-separated and not case-sensitive. Empty rules are ignored.";
const COLLECTION_HELP =
  "The last part of the collection URL: /collections/<strong>handle</strong>";
const PRODUCT_HELP =
  "The last part of the product URL: /products/<strong>handle</strong>";
const WINE_TYPE_HELP =
  "Matches the 'Wine Type (Custom Shopify)' product metafield.";

export const promoLabelInputs: ThemeInputs = [
  {
    type: "heading",
    label: "General",
    helpText:
      "Text labels over product images on every product grid (home, collections, search, related products).",
  },
  {
    type: "switch",
    name: "promoLabelsOnProductPage",
    label: "Also show on the product page image",
    defaultValue: true,
  },
  {
    type: "range",
    name: "promoLabelBorderRadius",
    label: "Corner radius",
    configs: { min: 0, max: 20, step: 1, unit: "px" },
    defaultValue: 0,
  },
  // ---------- Label 1 ----------
  {
    type: "heading",
    label: "Label 1",
  },
  {
    type: "switch",
    name: "promoLabel1Enabled",
    label: "Enable",
    defaultValue: false,
  },
  {
    type: "text",
    name: "promoLabel1Text",
    label: "Text",
    defaultValue: "",
    placeholder: "Sparkling Week - up to 35% OFF",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "select",
    name: "promoLabel1Position",
    label: "Position",
    configs: { options: POSITION_OPTIONS },
    defaultValue: "top-left",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "select",
    name: "promoLabel1Size",
    label: "Size",
    configs: { options: SIZE_OPTIONS },
    defaultValue: "small",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "color",
    name: "promoLabel1BgColor",
    label: "Background color",
    defaultValue: "#000000",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "color",
    name: "promoLabel1TextColor",
    label: "Text color",
    defaultValue: "#ffffff",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "select",
    name: "promoLabel1ShowOn",
    label: "Show on",
    configs: { options: SHOW_ON_OPTIONS },
    defaultValue: "any",
    helpText: RULES_HELP,
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  {
    type: "text",
    name: "promoLabel1Collections",
    label: "Collection handles",
    defaultValue: "",
    placeholder: "shop-sparkling-wine",
    helpText: COLLECTION_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel1Enabled) && theme.promoLabel1ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel1Products",
    label: "Product handles",
    defaultValue: "",
    placeholder: "my-product-handle",
    helpText: PRODUCT_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel1Enabled) && theme.promoLabel1ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel1Tags",
    label: "Tags",
    defaultValue: "",
    placeholder: "holiday, limited",
    condition: (theme: any) =>
      Boolean(theme.promoLabel1Enabled) && theme.promoLabel1ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel1ProductTypes",
    label: "Product types",
    defaultValue: "",
    placeholder: "Wine",
    condition: (theme: any) =>
      Boolean(theme.promoLabel1Enabled) && theme.promoLabel1ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel1WineTypes",
    label: "Wine types",
    defaultValue: "",
    placeholder: "Sparkling",
    helpText: WINE_TYPE_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel1Enabled) && theme.promoLabel1ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel1Excluded",
    label: "Never show on (product handles)",
    defaultValue: "",
    condition: (theme: any) => Boolean(theme.promoLabel1Enabled),
  },
  // ---------- Label 2 ----------
  {
    type: "heading",
    label: "Label 2",
  },
  {
    type: "switch",
    name: "promoLabel2Enabled",
    label: "Enable",
    defaultValue: false,
  },
  {
    type: "text",
    name: "promoLabel2Text",
    label: "Text",
    defaultValue: "",
    placeholder: "Sparkling Week - up to 35% OFF",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "select",
    name: "promoLabel2Position",
    label: "Position",
    configs: { options: POSITION_OPTIONS },
    defaultValue: "top-left",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "select",
    name: "promoLabel2Size",
    label: "Size",
    configs: { options: SIZE_OPTIONS },
    defaultValue: "small",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "color",
    name: "promoLabel2BgColor",
    label: "Background color",
    defaultValue: "#000000",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "color",
    name: "promoLabel2TextColor",
    label: "Text color",
    defaultValue: "#ffffff",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "select",
    name: "promoLabel2ShowOn",
    label: "Show on",
    configs: { options: SHOW_ON_OPTIONS },
    defaultValue: "any",
    helpText: RULES_HELP,
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  {
    type: "text",
    name: "promoLabel2Collections",
    label: "Collection handles",
    defaultValue: "",
    placeholder: "shop-sparkling-wine",
    helpText: COLLECTION_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel2Enabled) && theme.promoLabel2ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel2Products",
    label: "Product handles",
    defaultValue: "",
    placeholder: "my-product-handle",
    helpText: PRODUCT_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel2Enabled) && theme.promoLabel2ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel2Tags",
    label: "Tags",
    defaultValue: "",
    placeholder: "holiday, limited",
    condition: (theme: any) =>
      Boolean(theme.promoLabel2Enabled) && theme.promoLabel2ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel2ProductTypes",
    label: "Product types",
    defaultValue: "",
    placeholder: "Wine",
    condition: (theme: any) =>
      Boolean(theme.promoLabel2Enabled) && theme.promoLabel2ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel2WineTypes",
    label: "Wine types",
    defaultValue: "",
    placeholder: "Sparkling",
    helpText: WINE_TYPE_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel2Enabled) && theme.promoLabel2ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel2Excluded",
    label: "Never show on (product handles)",
    defaultValue: "",
    condition: (theme: any) => Boolean(theme.promoLabel2Enabled),
  },
  // ---------- Label 3 ----------
  {
    type: "heading",
    label: "Label 3",
  },
  {
    type: "switch",
    name: "promoLabel3Enabled",
    label: "Enable",
    defaultValue: false,
  },
  {
    type: "text",
    name: "promoLabel3Text",
    label: "Text",
    defaultValue: "",
    placeholder: "Sparkling Week - up to 35% OFF",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "select",
    name: "promoLabel3Position",
    label: "Position",
    configs: { options: POSITION_OPTIONS },
    defaultValue: "top-left",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "select",
    name: "promoLabel3Size",
    label: "Size",
    configs: { options: SIZE_OPTIONS },
    defaultValue: "small",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "color",
    name: "promoLabel3BgColor",
    label: "Background color",
    defaultValue: "#000000",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "color",
    name: "promoLabel3TextColor",
    label: "Text color",
    defaultValue: "#ffffff",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "select",
    name: "promoLabel3ShowOn",
    label: "Show on",
    configs: { options: SHOW_ON_OPTIONS },
    defaultValue: "any",
    helpText: RULES_HELP,
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
  {
    type: "text",
    name: "promoLabel3Collections",
    label: "Collection handles",
    defaultValue: "",
    placeholder: "shop-sparkling-wine",
    helpText: COLLECTION_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel3Enabled) && theme.promoLabel3ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel3Products",
    label: "Product handles",
    defaultValue: "",
    placeholder: "my-product-handle",
    helpText: PRODUCT_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel3Enabled) && theme.promoLabel3ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel3Tags",
    label: "Tags",
    defaultValue: "",
    placeholder: "holiday, limited",
    condition: (theme: any) =>
      Boolean(theme.promoLabel3Enabled) && theme.promoLabel3ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel3ProductTypes",
    label: "Product types",
    defaultValue: "",
    placeholder: "Wine",
    condition: (theme: any) =>
      Boolean(theme.promoLabel3Enabled) && theme.promoLabel3ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel3WineTypes",
    label: "Wine types",
    defaultValue: "",
    placeholder: "Sparkling",
    helpText: WINE_TYPE_HELP,
    condition: (theme: any) =>
      Boolean(theme.promoLabel3Enabled) && theme.promoLabel3ShowOn !== "all",
  },
  {
    type: "text",
    name: "promoLabel3Excluded",
    label: "Never show on (product handles)",
    defaultValue: "",
    condition: (theme: any) => Boolean(theme.promoLabel3Enabled),
  },
];
