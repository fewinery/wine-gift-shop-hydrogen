import type { WineClubFormState } from "~/components/wine-clubs/selection-wizard";
import type { WineClubDetails } from "~/types/winehub";

/**
 * Cart Utilities for Wine Club Selection
 *
 * @description Formats wine club selections into Shopify cart line items
 * Handles merchandise IDs, selling plan IDs, and subscription configuration
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Features: Cart line item formatting, subscription setup, add-on handling
 */

// ============================================================================
// Cart Line Item Interfaces
// ============================================================================

export interface CartLineItem {
  /** Product variant merchandise ID (Shopify GraphQL format) */
  merchandiseId: string;

  /** Quantity of this item */
  quantity: number;

  /** Selling plan ID for subscription items */
  sellingPlanId?: string;

  /** Custom attributes for the line item */
  attributes?: CartAttribute[];
}

export interface CartAttribute {
  /** Attribute key */
  key: string;

  /** Attribute value */
  value: string;
}

export interface CartInput {
  /** Line items to add to cart */
  lines: CartLineItem[];

  /** Custom attributes for the entire cart */
  attributes?: CartAttribute[];

  /** Cart note */
  note?: string;
}

export interface WineClubCartData {
  /** Formatted cart input for Shopify API */
  cartInput: CartInput;

  /** Metadata about the wine club selection */
  metadata: {
    wineClubId: string;
    wineClubName: string;
    caseSizeId?: string;
    sellingPlanId?: string;
    totalItems: number;
    subscriptionItems: number;
    addOnItems: number;
  };

  /** Summary of selected items */
  summary: {
    wines: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
    addOns: Array<{
      title: string;
      quantity: number;
      price: number;
    }>;
  };
}

// ============================================================================
// Cart Formatting Functions
// ============================================================================

/**
 * Format wine club selections into Shopify cart line items
 *
 * @param wineClub - Wine club data with product information
 * @param state - Current wizard state with selections
 * @returns Formatted cart data ready for Shopify API
 */
export function formatWineClubCart(
  wineClub: WineClubDetails,
  state: WineClubFormState,
): WineClubCartData {
  const {
    selectedCaseSize,
    selectedSellingPlan,
    selectedProducts,
    selectedAddOns,
  } = state;

  // Validate required selections
  if (
    !(selectedCaseSize && selectedSellingPlan) ||
    selectedProducts.length === 0
  ) {
    throw new Error("Missing required selections for cart formatting");
  }

  // Format subscription items (main wine selections)
  const subscriptionLines: CartLineItem[] = selectedProducts.map((product) => ({
    merchandiseId: formatMerchandiseId(
      product.productVariant.shopifyId || product.productVariant.id,
    ),
    quantity: product.quantity,
    sellingPlanId: formatSellingPlanId(
      selectedSellingPlan.shopifyId || selectedSellingPlan.id,
    ),
    attributes: [
      {
        key: "_wineClubId",
        value: String(wineClub.id),
      },
      {
        key: "_wineClubName",
        value: wineClub.name,
      },
      {
        key: "_caseSize",
        value: selectedCaseSize.title,
      },
      {
        key: "_caseSizeId",
        value: String(selectedCaseSize.id),
      },
      {
        key: "_subscriptionFrequency",
        value: selectedSellingPlan.name,
      },
      {
        key: "_deliveryType",
        value: "subscription",
      },
    ],
  }));

  // Format add-on items (one-time purchases)
  const addOnLines: CartLineItem[] = selectedAddOns.map((addOn) => ({
    merchandiseId: formatMerchandiseId(
      addOn.productVariant.shopifyId || addOn.productVariant.id,
    ),
    quantity: addOn.quantity,
    attributes: [
      {
        key: "_wineClubId",
        value: String(wineClub.id),
      },
      {
        key: "_wineClubName",
        value: wineClub.name,
      },
      {
        key: "_addOn",
        value: "true",
      },
      {
        key: "_deliveryType",
        value: "add-on",
      },
    ],
  }));

  // Combine all line items
  const allLines = [...subscriptionLines, ...addOnLines];

  // Create cart input
  const cartInput: CartInput = {
    lines: allLines,
    attributes: [
      {
        key: "_isWineClubOrder",
        value: "true",
      },
      {
        key: "_wineClubId",
        value: String(wineClub.id),
      },
      {
        key: "_orderType",
        value: "wine_club_subscription",
      },
    ],
    note: `Wine Club Subscription: ${wineClub.name} - ${selectedCaseSize.title} with ${selectedSellingPlan.name.toLowerCase()} delivery`,
  };

  // Create metadata
  const metadata = {
    wineClubId: wineClub.id,
    wineClubName: wineClub.name,
    caseSizeId: selectedCaseSize.id,
    sellingPlanId: selectedSellingPlan.id,
    totalItems: allLines.reduce((sum, line) => sum + line.quantity, 0),
    subscriptionItems: subscriptionLines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    ),
    addOnItems: addOnLines.reduce((sum, line) => sum + line.quantity, 0),
  };

  // Create summary
  const summary = {
    wines: selectedProducts.map((product) => ({
      title: product.productVariant.productTitle,
      quantity: product.quantity,
      price: product.calculatedPrice || 0,
    })),
    addOns: selectedAddOns.map((addOn) => ({
      title: addOn.productVariant.productTitle,
      quantity: addOn.quantity,
      price: addOn.calculatedPrice || 0,
    })),
  };

  return {
    cartInput,
    metadata,
    summary,
  };
}

/**
 * Format merchandise ID for Shopify API
 *
 * @param shopifyId - Raw Shopify product ID
 * @returns Formatted merchandise ID (gid://shopify/ProductVariant/ID)
 */
export function formatMerchandiseId(shopifyId: string): string {
  // If already in GID format, return as-is
  if (shopifyId.startsWith("gid://")) {
    return shopifyId;
  }

  // If numeric ID, convert to GID format
  if (/^\d+$/.test(shopifyId)) {
    return `gid://shopify/ProductVariant/${shopifyId}`;
  }

  // Fallback: assume it's already in correct format
  return shopifyId;
}

/**
 * Format selling plan ID for Shopify API
 *
 * @param sellingPlanId - Raw selling plan ID (string or number)
 * @returns Formatted selling plan ID
 */
export function formatSellingPlanId(sellingPlanId: string | number): string {
  // Convert to string if it's a number
  const idStr = String(sellingPlanId);

  // If already in GID format, return as-is
  if (idStr.startsWith("gid://")) {
    return idStr;
  }

  // If numeric ID, convert to GID format
  if (/^\d+$/.test(idStr)) {
    return `gid://shopify/SellingPlan/${idStr}`;
  }

  // Fallback: assume it's already in correct format
  return idStr;
}

// ============================================================================
// Cart Mutation Functions
// ============================================================================

/**
 * Generate GraphQL mutation for adding items to cart
 *
 * @param cartInput - Cart input data
 * @returns GraphQL mutation string
 */
export function generateCartAddMutation(cartInput: CartInput): string {
  const lines = cartInput.lines
    .map(
      (line) => `
    {
      merchandiseId: "${line.merchandiseId}"
      quantity: ${line.quantity}
      ${line.sellingPlanId ? `sellingPlanId: "${line.sellingPlanId}"` : ""}
      ${
        line.attributes && line.attributes.length > 0
          ? `
      attributes: [
        ${line.attributes
          .map(
            (attr) => `
        {
          key: "${attr.key}"
          value: "${attr.value}"
        }
        `,
          )
          .join("")}
      ]
      `
          : ""
      }
    }
  `,
    )
    .join(",");

  const attributes =
    cartInput.attributes && cartInput.attributes.length > 0
      ? `
    attributes: [
      ${cartInput.attributes
        .map(
          (attr) => `
      {
        key: "${attr.key}"
        value: "${attr.value}"
      }
      `,
        )
        .join("")}
    ]
  `
      : "";

  return `
    mutation cartAdd($cartId: ID!) {
      cartLinesAdd(
        cartId: $cartId
        lines: [${lines}]
        ${attributes ? `${attributes}` : ""}
      ) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
                sellingPlanAllocation {
                  sellingPlan {
                    id
                    name
                  }
                }
                attributes {
                  key
                  value
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
}

/**
 * Generate GraphQL mutation for creating a new cart
 *
 * @param cartInput - Cart input data
 * @returns GraphQL mutation string
 */
export function generateCartCreateMutation(cartInput: CartInput): string {
  const lines = cartInput.lines
    .map(
      (line) => `
    {
      merchandiseId: "${line.merchandiseId}"
      quantity: ${line.quantity}
      ${line.sellingPlanId ? `sellingPlanId: "${line.sellingPlanId}"` : ""}
      ${
        line.attributes && line.attributes.length > 0
          ? `
      attributes: [
        ${line.attributes
          .map(
            (attr) => `
        {
          key: "${attr.key}"
          value: "${attr.value}"
        }
        `,
          )
          .join("")}
      ]
      `
          : ""
      }
    }
  `,
    )
    .join(",");

  const attributes =
    cartInput.attributes && cartInput.attributes.length > 0
      ? `
    attributes: [
      ${cartInput.attributes
        .map(
          (attr) => `
      {
        key: "${attr.key}"
        value: "${attr.value}"
      }
      `,
        )
        .join("")}
    ]
  `
      : "";

  const note = cartInput.note ? `note: "${cartInput.note}"` : "";

  return `
    mutation cartCreate {
      cartCreate(
        input: {
          lines: [${lines}]
          ${attributes ? `${attributes}` : ""}
          ${note ? `${note}` : ""}
        }
      ) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    product {
                      title
                    }
                  }
                }
                sellingPlanAllocation {
                  sellingPlan {
                    id
                    name
                  }
                }
                attributes {
                  key
                  value
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
}

// ============================================================================
// Validation and Error Handling
// ============================================================================

/**
 * Validate cart data before submission
 *
 * @param cartData - Cart data to validate
 * @returns Validation result with errors if any
 */
export function validateCartData(cartData: WineClubCartData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required fields
  if (!cartData.cartInput.lines.length) {
    errors.push("No items in cart");
  }

  // Check each line item
  cartData.cartInput.lines.forEach((line, index) => {
    if (!line.merchandiseId) {
      errors.push(`Line ${index + 1}: Missing merchandise ID`);
    }
    if (!line.quantity || line.quantity < 1) {
      errors.push(`Line ${index + 1}: Invalid quantity`);
    }
    // Note: Subscription items should have sellingPlanId, but we can't validate
    // without the isSubscription flag. The Shopify API will reject invalid requests.
  });

  // Check for wine club metadata
  if (!cartData.metadata.wineClubId) {
    errors.push("Missing wine club ID");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
