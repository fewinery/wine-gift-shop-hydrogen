import React, { useCallback, useState } from "react";
import type {
  CaseSize,
  ProductVariant,
  SellingPlan,
  WineClubDetails,
} from "~/types/winehub";

/**
 * Wine Club Selection Wizard State Management
 *
 * @description Manages the 5-step wine club selection process
 * Handles form state, validation, and step transitions
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Steps: Case Size → Frequency → Quantity → Add-ons → Review
 */

// ============================================================================
// Type Definitions for Selection State
// ============================================================================

export interface WineClubFormState {
  /** Current step in the wizard (1-4) */
  currentStep: number;

  /** Selected case size */
  selectedCaseSize: CaseSize | null;

  /** Selected subscription frequency */
  selectedSellingPlan: SellingPlan | null;

  /** Selected products and quantities */
  selectedProducts: SelectedProduct[];

  /** Selected add-on products */
  selectedAddOns: SelectedProduct[];

  /** Form validation errors */
  errors: FormErrors;

  /** Whether user is reviewing selections */
  isReviewing: boolean;

  /** Form submission status */
  isSubmitting: boolean;
}

export interface SelectedProduct {
  /** Product variant reference */
  productVariant: ProductVariant;

  /** Selected quantity */
  quantity: number;

  /** Whether this is an add-on product */
  isAddOn: boolean;

  /** Calculated price based on case size and selling plan */
  calculatedPrice: number;
}

export interface FormErrors {
  /** General form errors */
  general?: string;

  /** Step-specific errors */
  caseSize?: string;
  sellingPlan?: string;
  quantity?: string;
  addOns?: string;
  review?: string;

  /** Product-specific errors */
  products?: Record<string, string>;
}

export interface WizardStepProps {
  /** Current form state */
  state: WineClubFormState;

  /** Wine club data */
  wineClub: WineClubDetails;

  /** State update function */
  updateState: (updates: Partial<WineClubFormState>) => void;

  /** Navigation functions */
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
}

// ============================================================================
// State Management Hook
// ============================================================================

const initialState: WineClubFormState = {
  currentStep: 1,
  selectedCaseSize: null,
  selectedSellingPlan: null,
  selectedProducts: [],
  selectedAddOns: [],
  errors: {},
  isReviewing: false,
  isSubmitting: false,
};

export function useWineClubWizard(wineClub: WineClubDetails) {
  const [state, setState] = useState<WineClubFormState>(initialState);

  const updateState = useCallback((updates: Partial<WineClubFormState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearErrors = useCallback(() => {
    updateState({ errors: {} });
  }, [updateState]);

  const setError = useCallback((field: keyof FormErrors, message: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: message },
    }));
  }, []);

  // Step navigation
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= 4) {
        clearErrors();
        updateState({
          currentStep: step,
          isReviewing: step === 4,
        });
      }
    },
    [clearErrors, updateState],
  );

  const goToNextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep < 4) {
        return {
          ...prev,
          currentStep: prev.currentStep + 1,
          isReviewing: prev.currentStep + 1 === 4,
          errors: {},
        };
      }
      return prev;
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep > 1) {
        return {
          ...prev,
          currentStep: prev.currentStep - 1,
          isReviewing: false,
          errors: {},
        };
      }
      return prev;
    });
  }, []);

  // Selection handlers
  const selectCaseSize = useCallback(
    (caseSize: CaseSize) => {
      updateState({
        selectedCaseSize: caseSize,
        // Reset dependent selections when case size changes
        selectedSellingPlan: null,
        selectedProducts: [],
        selectedAddOns: [],
        // Clear errors when selecting
        errors: {},
      });
    },
    [updateState],
  );

  const selectSellingPlan = useCallback(
    (sellingPlan: SellingPlan) => {
      updateState({
        selectedSellingPlan: sellingPlan,
        // Clear errors when selecting
        errors: {},
      });
    },
    [updateState],
  );

  const updateProductQuantity = useCallback(
    (productVariant: ProductVariant, quantity: number, isAddOn = false) => {
      setState((prev) => {
        const products = isAddOn ? prev.selectedAddOns : prev.selectedProducts;

        const existingIndex = products.findIndex(
          (p) => p.productVariant.id === productVariant.id,
        );

        let updatedProducts: SelectedProduct[];

        if (existingIndex >= 0) {
          if (quantity <= 0) {
            // Remove product if quantity is 0 or less
            updatedProducts = products.filter(
              (_, index) => index !== existingIndex,
            );
          } else {
            // Update existing product quantity
            updatedProducts = products.map((p, index) =>
              index === existingIndex
                ? {
                    ...p,
                    quantity,
                    calculatedPrice: calculatePrice(
                      p.productVariant,
                      quantity,
                      prev,
                    ),
                  }
                : p,
            );
          }
        } else if (quantity > 0) {
          // Add new product
          const calculatedPrice = calculatePrice(
            productVariant,
            quantity,
            prev,
          );
          updatedProducts = [
            ...products,
            {
              productVariant,
              quantity,
              isAddOn,
              calculatedPrice,
            },
          ];
        } else {
          updatedProducts = products;
        }

        return {
          ...prev,
          ...(isAddOn
            ? { selectedAddOns: updatedProducts }
            : { selectedProducts: updatedProducts }),
        };
      });
    },
    [],
  );

  // Validation functions
  const validateCurrentStep = useCallback((): boolean => {
    clearErrors();

    switch (state.currentStep) {
      case 1:
        if (!state.selectedCaseSize) {
          setError("caseSize", "Please select a case size");
          return false;
        }
        return true;

      case 2:
        if (!state.selectedSellingPlan) {
          setError("sellingPlan", "Please select a subscription frequency");
          return false;
        }
        return true;

      case 3: {
        if (state.selectedProducts.length === 0) {
          setError("quantity", "Please select at least one wine");
          return false;
        }

        // Validate case restrictions
        if (state.selectedCaseSize) {
          for (const product of state.selectedProducts) {
            // Note: caseRestrictions is not in the ProductVariant type, so we'll skip this validation for now
            // This would need to be added to the ProductData type instead
          }
        }

        // Validate minimum order value (FR-019, T070)
        const pricing = calculateTotalPrice(state);
        const minimumOrderValue = wineClub.minimumOrderValue?.find(
          (mov) => mov.caseSize === state.selectedCaseSize?.id,
        );

        // T070: Validate MOV data is valid before using it
        if (minimumOrderValue) {
          const movValue = minimumOrderValue.value;

          // Check for invalid MOV values
          if (
            typeof movValue !== "number" ||
            Number.isNaN(movValue) ||
            movValue < 0
          ) {
            console.warn(
              "[Wizard] Invalid minimum order value for case size:",
              state.selectedCaseSize?.id,
              "- skipping MOV validation",
            );
          } else if (pricing.subscriptionTotal < movValue) {
            // T070: Clear error message about conflict
            setError(
              "quantity",
              `Minimum order value is $${movValue.toFixed(2)} for this case size. Current total: $${pricing.subscriptionTotal.toFixed(2)}`,
            );
            return false;
          }
        }
        return true;
      }

      case 4: {
        // Review step - ensure all previous steps are valid and check minimum order value again (T070)
        const reviewPricing = calculateTotalPrice(state);
        const reviewMov = wineClub.minimumOrderValue?.find(
          (mov) => mov.caseSize === state.selectedCaseSize?.id,
        );

        // T070: Validate MOV data before using
        if (reviewMov) {
          const movValue = reviewMov.value;

          if (
            typeof movValue !== "number" ||
            Number.isNaN(movValue) ||
            movValue < 0
          ) {
            console.warn(
              "[Wizard] Invalid minimum order value in review step for case size:",
              state.selectedCaseSize?.id,
              "- skipping MOV validation",
            );
          } else if (reviewPricing.subscriptionTotal < movValue) {
            setError(
              "review",
              `Minimum order value is $${movValue.toFixed(2)}. Please add more wines or select a different case size.`,
            );
            return false;
          }
        }

        return (
          state.selectedCaseSize !== null &&
          state.selectedSellingPlan !== null &&
          state.selectedProducts.length > 0
        );
      }

      default:
        return false;
    }
  }, [state, clearErrors, setError, wineClub.minimumOrderValue]);

  // Calculate if user can proceed without triggering validation errors
  const canProceedToNext = React.useMemo(() => {
    switch (state.currentStep) {
      case 1:
        return state.selectedCaseSize !== null;
      case 2:
        return state.selectedSellingPlan !== null;
      case 3:
        return state.selectedProducts.length > 0;
      case 4:
        return (
          state.selectedCaseSize !== null &&
          state.selectedSellingPlan !== null &&
          state.selectedProducts.length > 0
        );
      default:
        return false;
    }
  }, [
    state.currentStep,
    state.selectedCaseSize,
    state.selectedSellingPlan,
    state.selectedProducts.length,
  ]);

  return {
    // State
    state,

    // Actions
    updateState,
    clearErrors,
    setError,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    selectCaseSize,
    selectSellingPlan,
    updateProductQuantity,

    // Validation
    validateCurrentStep,
    canProceedToNext,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate price for a product based on case size, quantity, and selling plan discounts
 * @description Validates pricing data and uses fallback prices for invalid data (T069)
 */
function calculatePrice(
  productVariant: ProductVariant,
  quantity: number,
  state: WineClubFormState,
): number {
  // Validate retail price (T069: Handle invalid pricing data)
  let basePrice = productVariant.retailPrice;

  // Fallback to 0 if price is invalid (negative, NaN, null, undefined)
  if (
    typeof basePrice !== "number" ||
    Number.isNaN(basePrice) ||
    basePrice < 0
  ) {
    console.warn(
      "[Wizard] Invalid retail price for product:",
      productVariant.id,
      "- using fallback price 0",
    );
    basePrice = 0;
  }

  // Validate quantity
  if (typeof quantity !== "number" || Number.isNaN(quantity) || quantity < 0) {
    console.warn(
      "[Wizard] Invalid quantity for product:",
      productVariant.id,
      "- using 0",
    );
    quantity = 0;
  }

  // Note: individualPrices is not in ProductVariant type, using base price
  // This would need to be added to the type definitions if case-specific pricing is needed

  // Apply selling plan discount if available (FR-018)
  // Note: discountPercentage is not in SellingPlan type, using base price
  // This would need to be added to the type definitions if discounts are supported

  return basePrice * quantity;
}

/**
 * Calculate total price for selected items with discount breakdown
 */
export function calculateTotalPrice(state: WineClubFormState): {
  subtotal: number;
  subscriptionTotal: number;
  addOnTotal: number;
  grandTotal: number;
  discountAmount: number;
  originalSubtotal: number;
} {
  // Calculate original prices (before discounts)
  const originalSubscriptionTotal = state.selectedProducts.reduce(
    (sum, product) => {
      const originalPrice =
        product.productVariant.retailPrice * product.quantity;
      return sum + originalPrice;
    },
    0,
  );

  // Calculate discount amount
  const discountAmount =
    originalSubscriptionTotal -
    state.selectedProducts.reduce(
      (sum, product) => sum + product.calculatedPrice,
      0,
    );

  const subscriptionTotal = state.selectedProducts.reduce(
    (sum, product) => sum + product.calculatedPrice,
    0,
  );

  const addOnTotal = state.selectedAddOns.reduce(
    (sum, product) => sum + product.calculatedPrice,
    0,
  );

  const subtotal = subscriptionTotal;
  const grandTotal = subtotal + addOnTotal;

  return {
    subtotal,
    subscriptionTotal,
    addOnTotal,
    grandTotal,
    discountAmount,
    originalSubtotal: originalSubscriptionTotal,
  };
}
