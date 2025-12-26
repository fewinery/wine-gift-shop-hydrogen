import type { ProductData, ProductVariant } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";

/**
 * Step 3: Quantity Selection Component
 *
 * @description Allows users to select quantities for wines within case restrictions
 * Enforces minimum/maximum quantities based on selected case size
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance Scenario 3: Step 3 enforces min/max quantity restrictions (FR-017)
 */

export interface Step3QuantityProps extends WizardStepProps {
  /** Custom quantity change handler */
  onQuantityChange?: (product: ProductVariant, quantity: number) => void;
}

export default function Step3Quantity({
  state,
  wineClub,
  updateState,
  onQuantityChange,
}: Step3QuantityProps) {
  const selectedCaseSize = state.selectedCaseSize;
  const selectedProducts = state.selectedProducts;
  const errors = state.errors;

  // Handle quantity changes
  const handleQuantityChange = (product: ProductVariant, quantity: number) => {
    onQuantityChange?.(product, quantity);
    updateState({
      selectedProducts: updateProductQuantity(
        state.selectedProducts,
        product,
        quantity,
      ),
    });
  };

  // Get case restrictions for a product
  const getCaseRestrictions = (productData: ProductData) => {
    if (!selectedCaseSize) return null;

    return productData.caseRestrictions?.find(
      (restriction) => restriction.caseSize === selectedCaseSize.id,
    );
  };

  // Check if product has reached maximum quantity
  const isAtMaxQuantity = (
    productData: ProductData,
    currentQuantity: number,
  ) => {
    const restrictions = getCaseRestrictions(productData);
    if (!restrictions || restrictions.max === null) return false;
    return currentQuantity >= restrictions.max;
  };

  // Check if product is at minimum quantity
  const isAtMinQuantity = (
    productData: ProductData,
    currentQuantity: number,
  ) => {
    const restrictions = getCaseRestrictions(productData);
    if (!restrictions) return currentQuantity <= 0;
    return currentQuantity <= restrictions.min;
  };

  // Calculate total selected items
  const totalSelectedItems = selectedProducts.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const caseSizeCapacity = selectedCaseSize?.quantity || 12;

  // Get available products for this wine club
  // Use sellingPlanVariants (contains actual product data from Winehub API)
  const availableProducts = (
    wineClub.sellingPlanVariants ||
    wineClub.productData ||
    []
  ).map((spv) => ({
    productVariant: {
      ...(spv.productVariant || spv),
      // API returns retailPrice as string, convert to number
      retailPrice: Number.parseFloat(
        (spv.productVariant?.retailPrice || (spv as any).retailPrice) as any,
      ),
    },
    caseRestrictions: spv.caseRestrictions || [],
    customOrderingIndex: spv.customOrderingIndex || null,
    hidden: spv.hidden ?? false,
    addOnOnly: spv.addOnOnly ?? false,
    individualPrices: spv.individualPrices || [],
    quantity: 0,
  }));

  if (!selectedCaseSize) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Case Size Required
          </h3>
          <p className="text-yellow-700">
            Please select a case size first before choosing your wines.
          </p>
          <button
            onClick={() => updateState({ currentStep: 1 })}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Go Back to Case Size Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[40px]">Choose Your Wines</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          Select the wines and quantities for your case
        </p>
        {/* Compact Summary Badge */}
        <div className="flex items-center justify-center gap-2 pt-3">
          <span className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#e8941d]/15 border border-[#e8941d]/40 rounded-full text-base">
            <span className="font-semibold text-[#d4820a]">
              {selectedCaseSize.title}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">
              {totalSelectedItems}/{selectedCaseSize.quantity} selected
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              {selectedCaseSize.quantity - totalSelectedItems} remaining
            </span>
          </span>
        </div>
        {/* Progress bar */}
        <div className="max-w-md mx-auto pt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#f5a623] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((totalSelectedItems / selectedCaseSize.quantity) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.quantity && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.quantity}</p>
        </div>
      )}

      {/* Product Errors */}
      {/* {errors.products && Object.keys(errors.products).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">
            Please fix these issues:
          </h4>
          <ul className="text-red-700 text-sm space-y-1">
            {Object.entries(errors.products).map(([productId, error]) => (
              <li key={productId}>• {error}</li>
            ))}
          </ul>
        </div>
      )} */}

      {/* Products Grid */}
      {availableProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableProducts.map((productData) => (
            <ProductQuantityCard
              key={productData.productVariant.id}
              productData={productData}
              selectedQuantity={
                selectedProducts.find(
                  (p) => p.productVariant.id === productData.productVariant.id,
                )?.quantity || 0
              }
              caseRestrictions={getCaseRestrictions(productData)}
              isAtMaxQuantity={isAtMaxQuantity(
                productData,
                selectedProducts.find(
                  (p) => p.productVariant.id === productData.productVariant.id,
                )?.quantity || 0,
              )}
              isAtMinQuantity={isAtMinQuantity(
                productData.productVariant,
                selectedProducts.find(
                  (p) => p.productVariant.id === productData.productVariant.id,
                )?.quantity || 0,
              )}
              onQuantityChange={(quantity) =>
                handleQuantityChange(productData.productVariant, quantity)
              }
              canAddMore={totalSelectedItems < selectedCaseSize.quantity}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              No Wines Available
            </h3>
            <p className="text-yellow-700">
              This wine club doesn't have any wines configured yet. Please
              contact us for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          {selectedCaseSize.quantity > 1
            ? `You must select at least one wine. Maximum ${selectedCaseSize.quantity} items total.`
            : "Select one wine for your delivery."}
        </p>
      </div>

      {/* Selection Summary - Hidden for now */}
      {/* {selectedProducts.length > 0 && (
        <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-lg p-4 mt-6">
          <h4 className="font-henderson-slab text-lg text-[#d4820a] mb-2">
            Selected Wines ({totalSelectedItems} items)
          </h4>
          <div className="space-y-1">
            {selectedProducts.map((product) => (
              <div
                key={product.productVariant.id}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-700">
                  {product.productVariant.productTitle}
                </span>
                <span className="text-[#d4820a] font-medium">
                  Qty: {product.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

// ============================================================================
// Product Quantity Card Component
// ============================================================================

interface ProductQuantityCardProps {
  productData: ProductData;
  selectedQuantity: number;
  caseRestrictions: any; // CaseRestriction type from winehub types
  isAtMaxQuantity: boolean;
  isAtMinQuantity: boolean;
  onQuantityChange: (quantity: number) => void;
  canAddMore: boolean;
}

function ProductQuantityCard({
  productData,
  selectedQuantity,
  caseRestrictions,
  isAtMaxQuantity,
  isAtMinQuantity,
  onQuantityChange,
  canAddMore,
}: ProductQuantityCardProps) {
  const { productVariant } = productData;

  const incrementQuantity = () => {
    if (!isAtMaxQuantity && canAddMore) {
      onQuantityChange(selectedQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (!isAtMinQuantity) {
      onQuantityChange(selectedQuantity - 1);
    }
  };

  const getRestrictionText = () => {
    if (!caseRestrictions) return null;

    const parts = [];
    if (caseRestrictions.min > 0) parts.push(`Min: ${caseRestrictions.min}`);
    if (caseRestrictions.max !== null)
      parts.push(`Max: ${caseRestrictions.max}`);

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  return (
    <div
      className={cn(
        "border-2 rounded-lg p-4 transition-all duration-300 bg-white",
        selectedQuantity > 0 ? "border-[#f5a623] shadow-md" : "border-gray-200",
      )}
    >
      {/* Product Image */}
      {productVariant.productImage ? (
        <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={productVariant.productImage}
            alt={productVariant.productTitle}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-square mb-3 rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="space-y-2 mb-4">
        <h3 className="font-henderson-slab text-lg uppercase line-clamp-2">
          {productVariant.productTitle}
        </h3>

        <div className="text-sm font-henderson-slab font-medium text-gray-900">
          ${productVariant.retailPrice.toFixed(2)}
        </div>

        {/* Restrictions */}
        {getRestrictionText() && (
          <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
            {getRestrictionText()}
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Quantity:</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={decrementQuantity}
            disabled={isAtMinQuantity}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isAtMinQuantity
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
            )}
            aria-label="Decrease quantity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <span className="font-medium px-1">{selectedQuantity}</span>

          <button
            onClick={incrementQuantity}
            disabled={isAtMaxQuantity || !canAddMore}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isAtMaxQuantity || !canAddMore
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300",
            )}
            aria-label="Increase quantity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Selection Indicator */}
      {selectedQuantity > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-[#f5a623] text-sm font-medium">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <path
                d="M8 12L11 15L16 9"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Added to selection
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Update product quantity in the selected products array
 */
function updateProductQuantity(
  selectedProducts: any[],
  product: ProductVariant,
  quantity: number,
): any[] {
  const existingIndex = selectedProducts.findIndex(
    (p) => p.productVariant.id === product.id,
  );

  if (quantity <= 0) {
    // Remove product if quantity is 0 or less
    return selectedProducts.filter((_, index) => index !== existingIndex);
  }

  const updatedProduct = {
    productVariant: product,
    quantity,
    isAddOn: false,
    calculatedPrice: product.retailPrice * quantity,
  };

  if (existingIndex >= 0) {
    // Update existing product
    return selectedProducts.map((p, index) =>
      index === existingIndex ? updatedProduct : p,
    );
  }
  // Add new product
  return [...selectedProducts, updatedProduct];
}
