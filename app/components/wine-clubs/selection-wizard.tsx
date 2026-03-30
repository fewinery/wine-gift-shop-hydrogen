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

  /** Optional item-specific selling plan ID */
  sellingPlanId?: string;

  /** Applied discount percentage for this item */
  discountPercentage?: number;
}

export interface FormErrors {
  /** General form errors */
  general?: string;

  /** Step-specific errors */
  caseSize?: string;
  sellingPlan?: string;
  quantity?: string;
  addOnons?: string;
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
  // Auto-skip Step 1 for Fixed clubs
  const shouldSkipCaseSizeStep =
    wineClub.caseType === "Fixed" &&
    (!wineClub.caseSizes || wineClub.caseSizes.length === 0);

  // Auto-skip Step 2 if only one selling plan is available
  const shouldSkipFrequencyStep = wineClub.sellingPlans?.length === 1;

  const getInitialState = (): WineClubFormState => {
    let currentStep = 1;
    let selectedCaseSize: CaseSize | null = null;
    let selectedSellingPlan: SellingPlan | null = null;

    if (shouldSkipCaseSizeStep) {
      // Create virtual case size for Fixed clubs
      selectedCaseSize = {
        id: "fixed-bundle-virtual",
        title: "Fixed Bundle",
        quantity: 0, // No fixed quantity
        image: null,
      };
      currentStep = 2; // Move to frequency
    }

    if (shouldSkipFrequencyStep) {
      selectedSellingPlan = wineClub.sellingPlans[0];
      if (currentStep === 2) {
        currentStep = 3; // Skip both 1 and 2
      } else if (currentStep === 1 && shouldSkipFrequencyStep) {
        // If we are at step 1 but frequency should be skipped, we still start at 1
        // but when moving to next, it will skip 2.
      }
    }

    // Special case: if both should be skipped, start at 3
    if (shouldSkipCaseSizeStep && shouldSkipFrequencyStep) {
      currentStep = 3;
    }

    return {
      ...initialState,
      currentStep,
      selectedCaseSize,
      selectedSellingPlan,
    };
  };

  const [state, setState] = useState<WineClubFormState>(getInitialState);

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
      let targetStep = step;
      if (targetStep === 1 && shouldSkipCaseSizeStep) {
        targetStep = 2;
      }
      if (targetStep === 2 && shouldSkipFrequencyStep) {
        targetStep = step > state.currentStep ? 3 : 1;
      }

      if (targetStep >= 1 && targetStep <= 5) {
        clearErrors();
        updateState({
          currentStep: targetStep,
          isReviewing: targetStep === 5,
        });
      }
    },
    [
      clearErrors,
      updateState,
      shouldSkipCaseSizeStep,
      shouldSkipFrequencyStep,
      state.currentStep,
    ],
  );

  const goToNextStep = useCallback(() => {
    setState((prev) => {
      let nextStep = prev.currentStep + 1;
      if (nextStep === 2 && shouldSkipFrequencyStep) {
        nextStep = 3;
      }

      if (nextStep <= 5) {
        return {
          ...prev,
          currentStep: nextStep,
          isReviewing: nextStep === 5,
          errors: {},
        };
      }
      return prev;
    });
  }, [shouldSkipFrequencyStep]);

  const goToPreviousStep = useCallback(() => {
    setState((prev) => {
      const minStep = shouldSkipCaseSizeStep ? 2 : 1;
      let prevStep = prev.currentStep - 1;

      if (prevStep === 2 && shouldSkipFrequencyStep) {
        prevStep = 1;
      }

      if (prevStep >= minStep) {
        return {
          ...prev,
          currentStep: prevStep,
          isReviewing: false,
          errors: {},
        };
      }
      return prev;
    });
  }, [shouldSkipCaseSizeStep, shouldSkipFrequencyStep]);

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
    (
      productVariant: ProductVariant,
      quantity: number,
      isAddOn = false,
      sellingPlanId?: string,
    ) => {
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
                      p.sellingPlanId,
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
            sellingPlanId,
          );
          updatedProducts = [
            ...products,
            {
              productVariant,
              quantity,
              isAddOn,
              calculatedPrice,
              sellingPlanId,
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
        // Validate exact bottle count matches case size
        if (state.selectedCaseSize) {
          const totalBottles = state.selectedProducts.reduce(
            (sum, product) => sum + product.quantity,
            0,
          );
          const requiredBottles = state.selectedCaseSize.quantity;

          // For Fixed clubs (quantity = 0), we still require at least one item (FR-019)
          if (requiredBottles === 0) {
            if (state.selectedProducts.length === 0) {
              setError(
                "quantity",
                "Please select at least one wine to complete your selection.",
              );
              return false;
            }
            return true;
          }

          // Case for 0 bottles or under-limit (e.g. 1/3, 2/3)
          if (totalBottles < requiredBottles) {
            setError(
              "quantity",
              `Please select ${requiredBottles} bottles to complete your ${state.selectedCaseSize.title} case. Currently selected: ${totalBottles}/${requiredBottles}`,
            );
            return false;
          }

          if (totalBottles > requiredBottles) {
            setError(
              "quantity",
              `You have selected too many bottles (${totalBottles}). Please reduce to ${requiredBottles} bottles for your ${state.selectedCaseSize.title} case.`,
            );
            return false;
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
        return true;
      }

      case 5: {
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
      case 3: {
        // Must select exact number of bottles matching case size
        if (!state.selectedCaseSize || state.selectedProducts.length === 0) {
          return false;
        }

        // For Fixed clubs, we only require at least one item
        if (state.selectedCaseSize.quantity === 0) {
          return true;
        }

        const totalBottles = state.selectedProducts.reduce(
          (sum, product) => sum + product.quantity,
          0,
        );
        return totalBottles === state.selectedCaseSize.quantity;
      }
      case 4:
        return true;
      case 5:
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
    state.selectedProducts,
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

export function updateProductQuantity(
  selectedProducts: any[],
  product: ProductVariant,
  quantity: number,
  discountPercentage = 0,
  sellingPlanId?: string,
): any[] {
  const existingIndex = selectedProducts.findIndex(
    (p) => p.productVariant.id === product.id,
  );

  if (quantity <= 0) {
    return selectedProducts.filter((_, index) => index !== existingIndex);
  }

  const discountMultiplier = (100 - discountPercentage) / 100;
  const updatedProduct = {
    productVariant: product,
    quantity,
    isAddOn: false,
    calculatedPrice: product.retailPrice * discountMultiplier * quantity,
    sellingPlanId,
    discountPercentage, // Persist discount for Step 5 display
  };

  if (existingIndex >= 0) {
    return selectedProducts.map((p, index) =>
      index === existingIndex ? updatedProduct : p,
    );
  }
  return [...selectedProducts, updatedProduct];
}

/**
 * Calculate price for a product based on case size, quantity, and selling plan discounts
 * @description Validates pricing data and uses fallback prices for invalid data (T069)
 */
function calculatePrice(
  productVariant: ProductVariant,
  quantity: number,
  state: WineClubFormState,
  itemSellingPlanId?: string,
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

  // Apply selling plan discount if available (FR-018)
  let discountMultiplier = 1;

  // Use item-specific selling plan IF provided, otherwise fallback to global selection
  const sellingPlan = itemSellingPlanId
    ? state.selectedSellingPlan?.id === itemSellingPlanId
      ? state.selectedSellingPlan
      : null // If it differs, we can't easily find it here without the full list, but we'll try to find it in club data later if needed. For now, we fallback to the global one if it matches the item's intended plan.
    : state.selectedSellingPlan;

  let discountPercentage = sellingPlan?.discountPercentage;

  // T071: Robust discount detection from nested objects
  if (
    (discountPercentage === undefined ||
      discountPercentage === null ||
      discountPercentage === 0) &&
    sellingPlan?.sellingPlanClubDiscount
  ) {
    const clubDiscount = sellingPlan.sellingPlanClubDiscount;
    if (clubDiscount.fixedType === "PERCENTAGE") {
      discountPercentage = clubDiscount.fixedAmount;
    }
  }

  if (
    typeof discountPercentage === "number" &&
    !Number.isNaN(discountPercentage) &&
    discountPercentage > 0
  ) {
    discountMultiplier = (100 - discountPercentage) / 100;
  }

  return basePrice * discountMultiplier * quantity;
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
