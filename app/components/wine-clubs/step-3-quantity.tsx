import type { ProductData, ProductVariant } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";
import { updateProductQuantity } from "./selection-wizard";

/**
 * Step 3: Quantity Selection Component
 *
 * @description Allows users to select quantities for wines within case restrictions
 * Enforces minimum/maximum quantities based on selected case size
 *
 * User Story 2 (P2): Wine Club Selection Process
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

  // Helper to calculate discount for a specific product
  const getProductDiscount = (productData: any) => {
    const sellingPlan = state.selectedSellingPlan;
    if (!sellingPlan) return 0;

    // 1. Check for Individual Price override (Product Level)
    // The log showed numeric sellingPlan, so we compare loosely or convert to string
    const individualPrice = productData.individualPrices?.find(
      (ip: any) => String(ip.sellingPlan) === String(sellingPlan.id),
    );

    if (individualPrice && individualPrice.discountType === "percentage") {
      return parseFloat(individualPrice.individualPrice);
    }

    // 2. Fallback to Selling Plan Level
    if (sellingPlan.discountPercentage) return sellingPlan.discountPercentage;
    if (sellingPlan.sellingPlanClubDiscount?.fixedType === "PERCENTAGE") {
      return sellingPlan.sellingPlanClubDiscount.fixedAmount;
    }

    return 0;
  };

  // Handle quantity changes
  const handleQuantityChange = (
    productData: any, // Changed to receive full productData
    quantity: number,
  ) => {
    const { productVariant } = productData;
    const discountPercentage = getProductDiscount(productData);

    onQuantityChange?.(productVariant, quantity);

    updateState({
      selectedProducts: updateProductQuantity(
        state.selectedProducts,
        productVariant,
        quantity,
        discountPercentage,
        productData.sellingPlanId,
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

  // Get available products for this wine club
  const availableProducts = (
    wineClub.sellingPlanVariants ||
    wineClub.productData ||
    []
  )
    .map((spv: any) => {
      // Robustly handle both ProductData and SellingPlanVariant shapes
      const productData = spv.productData || spv;
      const productVariant = productData.productVariant;

      if (!productVariant) return null;

      return {
        productVariant: {
          ...productVariant,
          // API returns retailPrice as string or number, convert to number
          retailPrice: Number.parseFloat(
            String(productVariant.retailPrice || 0),
          ),
        },
        caseRestrictions: productData.caseRestrictions || [],
        customOrderingIndex: productData.customOrderingIndex || null,
        hidden: productData.hidden ?? false,
        addOnOnly: productData.addOnOnly ?? false,
        individualPrices: productData.individualPrices || [],
        sellingPlanId: spv.sellingPlanId, // Preserved from SellingPlanVariant if it exists
        quantity: 0,
      };
    })
    .filter(
      (product): product is any =>
        product !== null && !product.addOnOnly && !product.hidden,
    );

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
            type="button"
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
        <h2 className="text-[40px] text-gray-900">Choose Your Wines</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          Select the wines and quantities for your{" "}
          {selectedCaseSize.quantity > 0 ? "case" : "subscription"}
        </p>
        {/* Compact Summary Badge - Only show for standard clubs with fixed quantity */}
        {selectedCaseSize.quantity > 0 && (
          <>
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
          </>
        )}
        {/* For Fixed clubs, show simple selection count */}
        {selectedCaseSize.quantity === 0 && totalSelectedItems > 0 && (
          <div className="flex items-center justify-center gap-2 pt-3">
            <span className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#e8941d]/15 border border-[#e8941d]/40 rounded-full text-base">
              <span className="text-gray-700">
                {totalSelectedItems} item{totalSelectedItems !== 1 ? "s" : ""}{" "}
                selected
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {errors.quantity && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.quantity}</p>
        </div>
      )}

      {/* Products Grid */}
      {availableProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableProducts.map((productData) => {
            const currentQty =
              selectedProducts.find(
                (p) => p.productVariant.id === productData.productVariant.id,
              )?.quantity || 0;

            return (
              <ProductQuantityCard
                key={productData.productVariant.id}
                productData={productData}
                selectedQuantity={currentQty}
                caseRestrictions={getCaseRestrictions(productData)}
                isAtMaxQuantity={isAtMaxQuantity(productData, currentQty)}
                isAtMinQuantity={isAtMinQuantity(productData, currentQty)}
                onQuantityChange={(quantity) =>
                  handleQuantityChange(productData, quantity)
                }
                canAddMore={
                  selectedCaseSize.quantity === 0 ||
                  totalSelectedItems < selectedCaseSize.quantity
                }
                discountPercentage={getProductDiscount(productData)}
              />
            );
          })}
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
          {selectedCaseSize.quantity === 0
            ? "Select any wines you'd like for your subscription."
            : selectedCaseSize.quantity > 1
              ? `You must select at least one wine. Maximum ${selectedCaseSize.quantity} items total.`
              : "Select one wine for your delivery."}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Product Quantity Card Component
// ============================================================================

interface ProductQuantityCardProps {
  productData: ProductData;
  selectedQuantity: number;
  caseRestrictions: any;
  isAtMaxQuantity: boolean;
  isAtMinQuantity: boolean;
  onQuantityChange: (quantity: number) => void;
  canAddMore: boolean;
  discountPercentage?: number;
}

function ProductQuantityCard({
  productData,
  selectedQuantity,
  caseRestrictions,
  isAtMaxQuantity,
  isAtMinQuantity,
  onQuantityChange,
  canAddMore,
  discountPercentage = 0,
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
        "border-2 rounded-lg p-4 transition-all duration-300 bg-white flex flex-col h-full",
        selectedQuantity > 0 ? "border-[#f5a623] shadow-md" : "border-gray-200",
      )}
    >
      {/* Product Image */}
      {productVariant.productImage ? (
        <div className="aspect-square mb-3 rounded overflow-hidden bg-gray-100">
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
      <div className="space-y-3 mb-4 grow">
        <h3 className="font-henderson-slab text-base uppercase line-clamp-3 min-h-18">
          {productVariant.productTitle}
        </h3>

        <div className="space-y-1">
          {discountPercentage > 0 && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-widest font-henderson-slab">
              Retail Price: ${productVariant.retailPrice.toFixed(2)}
            </div>
          )}
          <div className="text-sm font-henderson-slab font-medium">
            $
            {(
              productVariant.retailPrice *
              (1 - discountPercentage / 100)
            ).toFixed(2)}
            {discountPercentage > 0 && "/EACH"}
          </div>
        </div>

        {/* Restrictions */}
        {getRestrictionText() && (
          <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
            {getRestrictionText()}
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Quantity:</span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
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
            type="button"
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
