import type { ProductData, ProductVariant } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";
import { updateProductQuantity } from "./selection-wizard";

/**
 * Step 4: Add-ons Selection Component
 *
 * @description Allows users to select optional add-on products
 * Add-ons don't count toward case minimums and are billed separately
 *
 * User Story 2 (P2): Wine Club Selection Process
 */

export interface Step4AddOnsProps extends WizardStepProps {
  /** Custom add-on selection handler */
  onAddOnSelect?: (addOn: ProductVariant, quantity: number) => void;
}

export default function Step4AddOns({
  state,
  wineClub,
  updateState,
  onAddOnSelect,
}: Step4AddOnsProps) {
  const selectedCaseSize = state.selectedCaseSize;
  const selectedAddOns = state.selectedAddOns;
  const errors = state.errors;

  // Helper to calculate discount for a specific product
  const getProductDiscount = (productData: any) => {
    const sellingPlan = state.selectedSellingPlan;
    if (!sellingPlan) return 0;

    // 1. Check for Individual Price override (Product Level)
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

  // Handle add-on selection
  const handleAddOnSelect = (productData: any, quantity: number) => {
    const { productVariant } = productData;
    const discountPercentage = getProductDiscount(productData);

    onAddOnSelect?.(productVariant, quantity);

    updateState({
      selectedAddOns: updateProductQuantity(
        selectedAddOns,
        productVariant,
        quantity,
        discountPercentage,
        productData.sellingPlanId,
      ).map((p) => ({ ...p, isAddOn: true })), // Ensure isAddOn is true
    });
  };

  // Get add-on products (products marked as addOnOnly)
  const availableAddOns = (
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
          // CRITICAL FIX: Ensure correct Shopify ID for cart interactions
          id: productVariant.shopifyId || productVariant.id,
          shopifyId: productVariant.shopifyId || productVariant.id,

          retailPrice: Number.parseFloat(
            String(productVariant.retailPrice || 0),
          ),
        },
        caseRestrictions: productData.caseRestrictions || [],
        customOrderingIndex: productData.customOrderingIndex || null,
        hidden: productData.hidden ?? false,
        addOnOnly: productData.addOnOnly ?? false,
        individualPrices: productData.individualPrices || [],
        sellingPlanId: spv.sellingPlanId, // Preserved from SellingPlanVariant
        quantity: 0,
      };
    })
    .filter(
      (product): product is any =>
        product !== null && product.addOnOnly && !product.hidden,
    );

  if (!selectedCaseSize) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Previous Selection Required
          </h3>
          <p className="text-yellow-700">
            Please complete the previous steps before selecting add-ons.
          </p>
          <button
            type="button"
            onClick={() => updateState({ currentStep: 1 })}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[40px] text-gray-900">Add Extra Products</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          Enhance your wine club experience with these additional products.
        </p>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-center gap-2 pt-3">
        <span className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#e8941d]/15 border border-[#e8941d]/40 rounded-full text-base">
          <span className="font-semibold text-[#d4820a]">
            {selectedCaseSize.title}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-700">
            {state.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}{" "}
            items selected
          </span>
        </span>
      </div>

      {/* Error Display */}
      {errors.addOnons && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.addOnons}</p>
        </div>
      )}

      {/* Add-ons Grid */}
      {availableAddOns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableAddOns.map((productData) => {
            const selectedQuantity =
              selectedAddOns.find(
                (addOn) =>
                  addOn.productVariant.id === productData.productVariant.id,
              )?.quantity || 0;

            return (
              <AddOnCard
                key={productData.productVariant.id}
                productData={productData}
                selectedQuantity={selectedQuantity}
                onQuantityChange={(quantity) =>
                  handleAddOnSelect(productData, quantity)
                }
                discountPercentage={getProductDiscount(productData)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="font-heading text-xl text-gray-900 mb-2">
            No Add-ons Available
          </h3>
          <p className="text-gray-600 font-body">
            This wine club doesn't have any additional products available at the
            moment.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Add-ons are optional and can be skipped. Continue to review your
          selections.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Add-on Card Component
// ============================================================================

interface AddOnCardProps {
  productData: ProductData;
  selectedQuantity: number;
  onQuantityChange: (quantity: number) => void;
  discountPercentage?: number;
}

function AddOnCard({
  productData,
  selectedQuantity,
  onQuantityChange,
  discountPercentage = 0,
}: AddOnCardProps) {
  const { productVariant } = productData;

  const incrementQuantity = () => {
    onQuantityChange(selectedQuantity + 1);
  };

  const decrementQuantity = () => {
    if (selectedQuantity > 0) {
      onQuantityChange(selectedQuantity - 1);
    }
  };

  return (
    <div
      className={cn(
        "border-2 rounded-lg p-4 transition-all duration-300 bg-white flex flex-col h-full",
        selectedQuantity > 0 ? "border-[#f5a623] shadow-md" : "border-gray-200",
      )}
    >
      {/* Product Image */}
      <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100 aspect-square">
        {productVariant.productImage ? (
          <img
            src={productVariant.productImage}
            alt={productVariant.productTitle}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        )}
        {/* Add-on Tag Overlay */}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] bg-white/90 backdrop-blur-sm text-[#d4820a] px-2 py-0.5 rounded-full border border-[#f5a623]/30 font-bold uppercase tracking-wider shadow-sm">
            Add-on
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-3 mb-4 grow">
        <h3 className="font-heading text-base uppercase line-clamp-3 min-h-18">
          {productVariant.productTitle}
        </h3>

        <div className="space-y-1">
          {discountPercentage > 0 && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-widest font-heading">
              Retail Price: ${productVariant.retailPrice.toFixed(2)}
            </div>
          )}
          <div className="text-sm font-heading font-medium">
            $
            {(
              productVariant.retailPrice *
              (1 - discountPercentage / 100)
            ).toFixed(2)}
            {discountPercentage > 0 && "/EACH"}
          </div>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Quantity:</span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={selectedQuantity === 0}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              selectedQuantity === 0
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

          <span
            className={cn(
              "w-8 text-center font-medium",
              selectedQuantity > 0 ? "text-[#f5a623]" : "text-gray-700",
            )}
          >
            {selectedQuantity}
          </span>

          <button
            type="button"
            onClick={incrementQuantity}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
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
            Added to order (+$
            {(
              productVariant.retailPrice *
              (1 - discountPercentage / 100) *
              selectedQuantity
            ).toFixed(2)}
            )
          </div>
        </div>
      )}
    </div>
  );
}
