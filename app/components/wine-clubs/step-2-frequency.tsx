import type { SellingPlan } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";

/**
 * Step 2: Frequency Selection Component
 *
 * @description Allows users to select their preferred subscription frequency
 * Shows pricing based on selected case size and frequency options
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance Scenario 2: Step 2 shows frequencies with pricing for selected case size
 */

export interface Step2FrequencyProps extends WizardStepProps {
  /** Additional CSS classes */
  className?: string;

  /** Custom selection handler */
  onFrequencySelect?: (sellingPlan: SellingPlan) => void;
}

export default function Step2Frequency({
  state,
  wineClub,
  updateState,
  goToNextStep,
  className,
  onFrequencySelect,
}: Step2FrequencyProps) {
  const { sellingPlans } = wineClub;
  const selectedCaseSize = state.selectedCaseSize;
  const selectedSellingPlan = state.selectedSellingPlan;
  const errors = state.errors;

  // Handle frequency selection
  const handleFrequencySelect = (sellingPlan: SellingPlan) => {
    updateState({ selectedSellingPlan: sellingPlan });
    onFrequencySelect?.(sellingPlan);

    // Note: Removed auto-advance due to state update race condition
    // Users will click "Next Step" button when ready
  };

  // Filter selling plans by case size if available
  const availableSellingPlans =
    sellingPlans?.filter((plan) => {
      if (!selectedCaseSize) return true;

      // Check if plan is compatible with selected case size
      // This depends on the Winehub API structure - adjust as needed
      return plan.caseSizeId === selectedCaseSize.id || !plan.caseSizeId;
    }) || [];

  if (!selectedCaseSize) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Case Size Required
          </h3>
          <p className="text-yellow-700">
            Please select a case size first before choosing a delivery
            frequency.
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

  if (!availableSellingPlans || availableSellingPlans.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Delivery Frequencies Available
          </h3>
          <p className="text-yellow-700">
            This wine club doesn't have any delivery frequencies configured for
            the {selectedCaseSize.title}. Please contact us for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Delivery Frequency
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select how often you'd like to receive your {selectedCaseSize.title}.
          You can change this anytime before checkout.
        </p>
      </div>

      {/* Selected Case Size Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">
              Selected Case Size: {selectedCaseSize.title}
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              {selectedCaseSize.quantity} bottles per delivery
            </p>
          </div>
          <button
            onClick={() => updateState({ currentStep: 1 })}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Change
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errors.sellingPlan && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.sellingPlan}</p>
        </div>
      )}

      {/* Frequency Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableSellingPlans.map((sellingPlan) => (
          <FrequencyCard
            key={sellingPlan.id}
            sellingPlan={sellingPlan}
            caseSize={selectedCaseSize}
            isSelected={selectedSellingPlan?.id === sellingPlan.id}
            onSelect={() => handleFrequencySelect(sellingPlan)}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Most members choose monthly delivery for the best experience.
        </p>
      </div>

      {/* Selected Frequency Summary */}
      {selectedSellingPlan && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">
                Selected: {selectedSellingPlan.name}
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {selectedSellingPlan.description}
              </p>
            </div>
            <button
              onClick={() => updateState({ selectedSellingPlan: null })}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Frequency Card Component
// ============================================================================

interface FrequencyCardProps {
  sellingPlan: SellingPlan;
  caseSize: any; // CaseSize type from winehub types
  isSelected: boolean;
  onSelect: () => void;
}

function FrequencyCard({
  sellingPlan,
  caseSize,
  isSelected,
  onSelect,
}: FrequencyCardProps) {
  // Calculate frequency information
  const frequencyInfo = getFrequencyInfo(sellingPlan);
  const pricingInfo = calculatePricing(sellingPlan, caseSize);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200",
        "hover:shadow-lg hover:border-blue-300",
        {
          "border-blue-600 bg-blue-50 shadow-lg": isSelected,
          "border-gray-200 bg-white": !isSelected,
        },
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isSelected}
      aria-describedby={`frequency-${sellingPlan.id}-description`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Frequency Icon */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Frequency Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {sellingPlan.name}
        </h3>

        <p className="text-sm text-gray-600">{sellingPlan.description}</p>

        <div className="space-y-1">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Deliveries:</span>{" "}
            {frequencyInfo.deliveriesPerYear} per year
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Every:</span>{" "}
            {frequencyInfo.intervalText}
          </div>
        </div>

        {/* Pricing */}
        {pricingInfo && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Approximate per delivery:
            </div>
            <div className="text-lg font-semibold text-gray-900">
              ${pricingInfo.estimatedPrice}
            </div>
            <div className="text-xs text-gray-400">
              {pricingInfo.disclaimer}
            </div>
          </div>
        )}

        {/* Popular Badge */}
        {sellingPlan.popular && (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Most Popular
          </div>
        )}
      </div>

      {/* Screen reader description */}
      <div id={`frequency-${sellingPlan.id}-description`} className="sr-only">
        {sellingPlan.name}: {sellingPlan.description}.{" "}
        {frequencyInfo.deliveriesPerYear} deliveries per year.
        {isSelected ? " Currently selected" : " Click to select this frequency"}
        .
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract frequency information from selling plan
 */
function getFrequencyInfo(sellingPlan: SellingPlan): {
  deliveriesPerYear: number;
  intervalText: string;
} {
  // Parse the selling plan to extract frequency information
  // This depends on the Winehub API structure

  const name = sellingPlan.name.toLowerCase();

  if (name.includes("monthly")) {
    return {
      deliveriesPerYear: 12,
      intervalText: "Month",
    };
  }

  if (name.includes("quarterly") || name.includes("3 months")) {
    return {
      deliveriesPerYear: 4,
      intervalText: "3 Months",
    };
  }

  if (name.includes("bi-monthly") || name.includes("2 months")) {
    return {
      deliveriesPerYear: 6,
      intervalText: "2 Months",
    };
  }

  if (name.includes("weekly")) {
    return {
      deliveriesPerYear: 52,
      intervalText: "Week",
    };
  }

  // Default fallback
  return {
    deliveriesPerYear: 12,
    intervalText: "Regular Interval",
  };
}

/**
 * Calculate estimated pricing based on selling plan and case size
 */
function calculatePricing(
  sellingPlan: SellingPlan,
  caseSize: any,
): {
  estimatedPrice: string;
  disclaimer: string;
} | null {
  // This would calculate pricing based on:
  // - Base wine prices
  // - Case size
  // - Selling plan discounts/adjustments
  // - Any promotional pricing

  // For now, return a placeholder
  const baseEstimate = 49.99 * (caseSize?.quantity || 6);
  const discount = sellingPlan.discountPercentage || 0;
  const discountedPrice = baseEstimate * (1 - discount / 100);

  return {
    estimatedPrice: discountedPrice.toFixed(2),
    disclaimer: "Exact price calculated in next step based on wine selection",
  };
}
