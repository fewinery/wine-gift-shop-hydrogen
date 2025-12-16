import type { ProductData, ProductVariant } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";

/**
 * Step 4: Add-ons Selection Component
 *
 * @description Allows users to select optional add-on products
 * Add-ons don't count toward case minimums and are billed separately
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance Scenario 4: Step 4 shows add-ons that don't count toward minimums
 */

export interface Step4AddOnsProps extends WizardStepProps {
  /** Additional CSS classes */
  className?: string;

  /** Custom selection handler */
  onAddOnSelect?: (product: ProductVariant, quantity: number) => void;
}

export default function Step4AddOns({
  state,
  wineClub,
  updateState,
  className,
  onAddOnSelect,
}: Step4AddOnsProps) {
  const selectedCaseSize = state.selectedCaseSize;
  const selectedAddOns = state.selectedAddOns;
  const errors = state.errors;

  // Handle add-on selection
  const handleAddOnSelect = (product: ProductVariant, quantity: number) => {
    onAddOnSelect?.(product, quantity);
    updateState({
      selectedAddOns: updateAddOnQuantity(selectedAddOns, product, quantity),
    });
  };

  // Get add-on products (products marked as addOnOnly)
  const availableAddOns =
    wineClub.productData?.filter((product) => product.addOnOnly) || [];

  // Calculate add-on subtotal
  const addOnSubtotal = selectedAddOns.reduce(
    (sum, addOn) => sum + (addOn.calculatedPrice || 0),
    0,
  );

  if (!selectedCaseSize) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Previous Selection Required
          </h3>
          <p className="text-yellow-700">
            Please complete the previous steps before selecting add-ons.
          </p>
          <button
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
    <div className={cn("space-y-6", className)}>
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add Extra Products (Optional)
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enhance your wine club experience with these additional products.
          These items are optional and billed separately from your subscription.
        </p>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              Selected Case: {selectedCaseSize.title}
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Main selection:{" "}
              {state.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}{" "}
              items
            </p>
          </div>
          <button
            onClick={() => updateState({ currentStep: 3 })}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Change Wines
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errors.addOns && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.addOns}</p>
        </div>
      )}

      {/* Add-ons Grid */}
      {availableAddOns.length > 0 ? (
        <>
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
                    handleAddOnSelect(productData.productVariant, quantity)
                  }
                />
              );
            })}
          </div>

          {/* Add-on Summary */}
          {selectedAddOns.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">
                Selected Add-ons ({selectedAddOns.length} items)
              </h4>
              <div className="space-y-2">
                {selectedAddOns.map((addOn) => (
                  <div
                    key={addOn.productVariant.id}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <span className="text-green-700 text-sm">
                        {addOn.productVariant.productTitle}
                      </span>
                      <span className="text-green-600 text-sm ml-2">
                        ×{addOn.quantity}
                      </span>
                    </div>
                    <span className="text-green-600 font-medium">
                      ${(addOn.calculatedPrice || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 font-medium">
                      Add-on Subtotal:
                    </span>
                    <span className="text-green-700 font-bold">
                      ${addOnSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No Add-ons Available
            </h3>
            <p className="text-gray-700">
              This wine club doesn't have any additional products available at
              the moment.
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Add-ons are optional and can be skipped. Continue to review your
          selections.
        </p>
      </div>

      {/* Continue Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => updateState({ currentStep: 5 })}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          {selectedAddOns.length > 0
            ? "Review Selections"
            : "Skip Add-ons & Continue"}
        </button>
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
}

function AddOnCard({
  productData,
  selectedQuantity,
  onQuantityChange,
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
        "border-2 rounded-lg p-4 transition-all duration-200",
        selectedQuantity > 0
          ? "border-green-600 bg-green-50 shadow-md"
          : "border-gray-200 bg-white",
      )}
    >
      {/* Product Image */}
      {productVariant.productImage ? (
        <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={productVariant.productImage}
            alt={productVariant.productTitle}
            className="w-full h-full object-cover"
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {productVariant.productTitle}
        </h3>

        {productVariant.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {productVariant.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            ${productVariant.retailPrice.toFixed(2)}
          </span>
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            Add-on
          </span>
        </div>

        {/* Additional info */}
        {productVariant.additionalInfo && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            {productVariant.additionalInfo}
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Quantity:</span>
        <div className="flex items-center space-x-2">
          <button
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
              selectedQuantity > 0 ? "text-green-600" : "text-gray-700",
            )}
          >
            {selectedQuantity}
          </span>

          <button
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
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="flex items-center justify-between text-green-700 text-sm">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Added to order
            </div>
            <span className="font-medium">
              +${(productVariant.retailPrice * selectedQuantity).toFixed(2)}
            </span>
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
 * Update add-on quantity in the selected add-ons array
 */
function updateAddOnQuantity(
  selectedAddOns: any[],
  product: ProductVariant,
  quantity: number,
): any[] {
  const existingIndex = selectedAddOns.findIndex(
    (addOn) => addOn.productVariant.id === product.id,
  );

  if (quantity <= 0) {
    // Remove add-on if quantity is 0 or less
    return selectedAddOns.filter((_, index) => index !== existingIndex);
  }

  const updatedAddOn = {
    productVariant: product,
    quantity,
    isAddOn: true,
    calculatedPrice: product.retailPrice * quantity,
  };

  if (existingIndex >= 0) {
    // Update existing add-on
    return selectedAddOns.map((addOn, index) =>
      index === existingIndex ? updatedAddOn : addOn,
    );
  }
  // Add new add-on
  return [...selectedAddOns, updatedAddOn];
}
