/**
 * TypeScript type definitions for Winehub API integration
 *
 * @description Generated from OpenAPI specification (winehub-api.yaml)
 * @version 1.0.0
 * @feature Builder.io to Weaverse Migration with Winehub Integration
 *
 * Usage:
 *   Import these types in app/types/winehub.ts
 *   Use for type-safe API responses and component props
 */

// ============================================================================
// Core Wine Club Entities
// ============================================================================

/**
 * WineClub - Represents a wine club membership program
 *
 * Source: Winehub API /clubs/basic-details endpoint
 * Used in: Wine club listing page, component loaders
 */
export interface WineClub {
  /** Unique wine club identifier (API returns number, converted to string) */
  id: string;

  /** Display name of the wine club */
  name: string;

  /** HTML description (requires sanitization before rendering) */
  description: string | null;

  /** Hero image URL */
  image: string | null;

  /** Shopify product ID (GraphQL format) - API uses shopify_id */
  shopifyId: string;
  shopify_id?: string; // API field name

  /** Selection type for wine products (can be null in API response) */
  type: "Manual" | "Automatic" | null;

  /** Packaging type */
  caseType: "Bottle" | "Case" | "Mixed";

  /** Available package sizes (can be empty) */
  caseSizes: CaseSize[];

  /** Subscription frequency options (can be empty) */
  sellingPlans: SellingPlan[];

  /** Membership benefits (can be empty) */
  sellingPlanPerks: SellingPlanPerk[];

  /** Optional fields that may not exist in basic details response */
  merchant_code?: string | null;
  options?: unknown;
  position?: number | null;

  /** Additional fields from detailed API (optional for basic endpoint) */
  sellingPlanVariants?: SellingPlanVariant[];
  minimumOrderValue?: MinimumOrderValue[];
  signUpProductOffer?: SignUpProductOffer | null;
  movOnly?: boolean;
  isPlaylist?: boolean;
  useSeasons?: boolean;
}

/**
 * WineClubDetails - Extended wine club information with product data
 *
 * Source: Winehub API /club/{id}/details endpoint
 * Used in: Wine club detail page, selection wizard
 */
export interface WineClubDetails extends WineClub {
  /** Detailed product information with restrictions */
  productData: ProductData[];
}

// ============================================================================
// Case Size & Subscription
// ============================================================================

/**
 * CaseSize - Represents a packaging option with specific quantity
 *
 * Used in: Step 1 of selection wizard (case size selection)
 */
export interface CaseSize {
  /** Unique case size identifier */
  id: string;

  /** Display name (e.g., "6 Bottles", "12 Bottles") */
  title: string;

  /** Number of bottles in this case size (minimum 1) */
  quantity: number;

  /** Image representing this case size */
  image: string | null;
}

/**
 * SellingPlan - Represents a subscription frequency option with pricing
 *
 * Used in: Step 2 of selection wizard (frequency selection)
 */
export interface SellingPlan {
  /** Unique selling plan identifier */
  id: string;

  /** Display name (e.g., "Monthly", "Quarterly") */
  name: string;

  /** Detailed description of subscription */
  description: string | null;

  /** Shopify selling plan ID (GraphQL format) */
  shopifyId: string;

  /** Number of intervals between deliveries (minimum 1) */
  intervalCount: number;

  /** Interval unit */
  interval: "DAY" | "WEEK" | "MONTH" | "YEAR";

  /** Discount configuration */
  sellingPlanClubDiscount: SellingPlanClubDiscount | null;
}

/**
 * SellingPlanClubDiscount - Discount applied to subscription
 */
export interface SellingPlanClubDiscount {
  /** Discount value (percentage or fixed amount) */
  fixedAmount: number;

  /** Type of discount */
  fixedType: "PERCENTAGE" | "FIXED_AMOUNT";

  /** Human-readable discount description */
  description: string | null;
}

// ============================================================================
// Product Entities
// ============================================================================

/**
 * ProductVariant - Represents a wine product available for selection
 *
 * Used in: Step 3 (quantity selection), Step 4 (add-ons), cart line items
 */
export interface ProductVariant {
  /** Product availability status */
  active: boolean;

  /** ISO 4217 currency code (e.g., "USD") */
  currencyCode: string;

  /** Winehub product variant ID */
  id: string;

  /** Product image URL */
  image: string | null;

  /** Parent product image URL */
  productImage: string | null;

  /** Parent product name */
  productTitle: string;

  /** Regular retail price (minimum 0) */
  retailPrice: number;

  /** Shopify variant ID (GraphQL format) */
  shopifyId: string;

  /** Stock keeping unit */
  sku: string | null;

  /** Variant title (e.g., "2020 Cabernet Sauvignon") */
  title: string;

  /** Inventory quantity (minimum 0) */
  totalAvailable: number;

  /** Inventory tracking flag */
  trackQuantity: boolean;
}

/**
 * ProductData - Wine product offering with case restrictions and pricing
 *
 * Used in: Step 3 (quantity selection), Step 4 (add-ons)
 */
export interface ProductData {
  /** Current quantity in cart (minimum 0) */
  quantity: number;

  /** Whether product counts toward case minimum */
  addOnOnly: boolean;

  /** Min/max quantities per case size */
  caseRestrictions: CaseRestriction[];

  /** Display order override */
  customOrderingIndex: number | null;

  /** Visibility flag */
  hidden: boolean;

  /** Case-specific pricing overrides */
  individualPrices: IndividualPrice[];

  /** Product details */
  productVariant: ProductVariant;
}

/**
 * CaseRestriction - Quantity limits for a product based on selected case size
 *
 * Used in: Step 3 validation logic
 */
export interface CaseRestriction {
  /** Reference to case size ID */
  caseSize: string;

  /** Maximum quantity allowed (null = no limit) */
  max: number | null;

  /** Minimum quantity required (minimum 0) */
  min: number;

  /** Recommended quantity (used as default value in UI) */
  suggestedQuantity: number | null;
}

/**
 * IndividualPrice - Case-specific pricing override
 *
 * Overrides ProductVariant.retailPrice for specific case sizes
 */
export interface IndividualPrice {
  /** Reference to case size */
  caseSizeId: string;

  /** Price for this case size (minimum 0) */
  price: number;
}

// ============================================================================
// Supporting Entities
// ============================================================================

/**
 * SellingPlanPerk - Promotional benefit for wine club subscribers
 *
 * Used in: Wine club detail page to highlight membership benefits
 */
export interface SellingPlanPerk {
  /** Unique perk identifier */
  id: string;

  /** Perk name */
  title: string;

  /** Perk details */
  description: string | null;
}

/**
 * SellingPlanVariant - Junction table linking selling plans to products
 */
export interface SellingPlanVariant {
  /** Reference to selling plan */
  sellingPlanId: string;

  /** Product details and restrictions */
  productData: ProductData;
}

/**
 * MinimumOrderValue - Minimum spend requirement per case size
 *
 * Used in: Step 3 validation (enforced if WineClub.movOnly is true)
 */
export interface MinimumOrderValue {
  /** Reference to case size ID */
  caseSize: string;

  /** Minimum spend amount (minimum 0) */
  value: number;
}

/**
 * SignUpProductOffer - Promotional offer for new wine club members
 *
 * Used in: Modal display during wizard flow (FR-020)
 */
export interface SignUpProductOffer {
  /** Unique offer identifier */
  id: string;

  /** Offer title */
  title: string;

  /** Offer details */
  description: string | null;

  /** Free/discounted product */
  productVariant: ProductVariant;

  /** ISO 8601 expiry date */
  expiryDate: string | null;
}

// ============================================================================
// UI State (Selection Wizard)
// ============================================================================

/**
 * WineClubFormState - Tracks user selections through 5-step wizard flow
 *
 * Managed by: React useState in SelectionWizard component
 * State transitions: See data-model.md
 */
export interface WineClubFormState {
  /** Current wizard step (1-5) */
  step: 1 | 2 | 3 | 4 | 5;

  /** Selected case size (Step 1) */
  caseChoice: CaseSize | null;

  /** Selected subscription frequency (Step 2) */
  freqChoice: SellingPlan | null;

  /** Products with quantities (Steps 3-4) */
  selectedProducts: SelectedProduct[];

  /** Sum of all product quantities */
  totalQuantity: number;

  /** Calculated total with discounts */
  totalPrice: number;

  /** Calculated total without discounts */
  totalRetailPrice: number;

  /** Whether user accepted promotional offer */
  acceptedSignUpOffer: boolean;
}

/**
 * SelectedProduct - Product with quantity selected by user
 *
 * Used in: WineClubFormState.selectedProducts array
 */
export interface SelectedProduct {
  /** Product details */
  variant: ProductVariant;

  /** Quantity selected (minimum 0) */
  quantity: number;

  /** Whether this is an add-on product (doesn't count toward case minimum) */
  isAddOn: boolean;
}

// ============================================================================
// Cart Integration
// ============================================================================

/**
 * CartLineItem - Shopify cart line item format
 *
 * Used in: Step 5 (review) when user clicks "Checkout"
 * Transformed from WineClubFormState to Shopify cart format
 */
export interface CartLineItem {
  /** Shopify variant ID (GraphQL format) */
  merchandiseId: string;

  /** Quantity to add to cart */
  quantity: number;

  /** Shopify selling plan ID (GraphQL format) */
  sellingPlanId: string;

  /** Custom attributes (wine club metadata) */
  attributes: Array<{
    key: string;
    value: string;
  }>;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API response wrapper for error handling
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T | null;

  /** Error flag */
  error: boolean;

  /** Error message (if error is true) */
  message?: string;
}

/**
 * Error response from Winehub API
 */
export interface WinehubApiError {
  /** Error code */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Additional error context */
  details?: Record<string, unknown>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if value is a valid WineClub
 */
export function isWineClub(value: unknown): value is WineClub {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;

  // Check basic required fields that exist in API response
  // Note: API returns id as number, but we convert to string
  // Note: type can be null in API response
  return (
    (typeof obj.id === "string" || typeof obj.id === "number") &&
    typeof obj.name === "string" &&
    (typeof obj.shopifyId === "string" ||
      typeof obj.shopify_id === "string" ||
      typeof obj.shopify_id === "number") &&
    (obj.type === "Manual" || obj.type === "Automatic" || obj.type === null) &&
    (obj.caseType === "Bottle" ||
      obj.caseType === "Case" ||
      obj.caseType === "Mixed") &&
    Array.isArray(obj.caseSizes) &&
    Array.isArray(obj.sellingPlans)
    // Removed strict checks for optional fields that may not exist in API response
  );
}

/**
 * Type guard to check if value is a valid ProductVariant
 */
export function isProductVariant(value: unknown): value is ProductVariant {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.active === "boolean" &&
    typeof obj.currencyCode === "string" &&
    typeof obj.id === "string" &&
    typeof obj.productTitle === "string" &&
    typeof obj.retailPrice === "number" &&
    typeof obj.shopifyId === "string" &&
    typeof obj.title === "string" &&
    typeof obj.totalAvailable === "number" &&
    typeof obj.trackQuantity === "boolean"
  );
}

/**
 * Type guard to check if value is a valid CaseSize
 */
export function isCaseSize(value: unknown): value is CaseSize {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.quantity === "number" &&
    obj.quantity > 0
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract array element type
 *
 * Example: ArrayElement<WineClub['caseSizes']> = CaseSize
 */
export type ArrayElement<T> = T extends Array<infer U> ? U : never;

/**
 * Make specific properties required
 *
 * Example: RequireProps<WineClub, 'description' | 'image'>
 */
export type RequireProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 *
 * Example: OptionalProps<WineClubFormState, 'caseChoice' | 'freqChoice'>
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// ============================================================================
// Constants
// ============================================================================

/**
 * Wizard step constants
 */
export const WIZARD_STEPS = {
  CASE_SIZE: 1,
  FREQUENCY: 2,
  QUANTITY: 3,
  ADD_ONS: 4,
  REVIEW: 5,
} as const;

/**
 * Step labels for UI display
 */
export const WIZARD_STEP_LABELS: Record<number, string> = {
  [WIZARD_STEPS.CASE_SIZE]: "Case Size",
  [WIZARD_STEPS.FREQUENCY]: "Frequency",
  [WIZARD_STEPS.QUANTITY]: "Select Wines",
  [WIZARD_STEPS.ADD_ONS]: "Add-ons",
  [WIZARD_STEPS.REVIEW]: "Review",
};

/**
 * Cache configuration for Winehub API responses
 */
export const WINEHUB_CACHE_CONFIG = {
  /** Fresh cache duration (30 minutes) */
  maxAge: 1800,

  /** Stale-while-revalidate duration (1 hour) */
  staleWhileRevalidate: 3600,

  /** Cache-Control header value */
  get header(): string {
    return `public, max-age=${this.maxAge}, stale-while-revalidate=${this.staleWhileRevalidate}`;
  },
} as const;
