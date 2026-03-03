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
      <div className="text-center py-8">
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
      <div className="text-center py-8">
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
    <div className="mx-auto space-y-10">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[40px]">Choose Your Frequency</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          How often would you like to receive your wines?
        </p>
        {/* Compact Summary Badge */}
        <div className="flex items-center justify-center gap-2 pt-3">
          <span className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#e8941d]/15 border border-[#e8941d]/40 rounded-full text-base">
            <span className="font-semibold text-[#d4820a]">
              {selectedCaseSize.title}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">
              {selectedCaseSize.quantity} bottles
            </span>
            <button
              onClick={() => updateState({ currentStep: 1 })}
              className="ml-1 text-[#d4820a] hover:text-[#b5700a] font-semibold"
            >
              Change
            </button>
          </span>
        </div>
      </div>

      {/* Error Display */}
      {errors.sellingPlan && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.sellingPlan}</p>
        </div>
      )}

      {/* Frequency Options */}
      <div className="flex flex-wrap justify-center gap-6">
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
        "relative cursor-pointer flex flex-col p-8 transition-all duration-300 bg-white rounded-xl w-[350px]",
        "border-2 hover:shadow-xl hover:-translate-y-1",
        {
          "border-[#f5a623] shadow-lg ring-1 ring-[#f5a623]/20": isSelected,
          "border-gray-100 hover:border-gray-200": !isSelected,
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
      {/* Selection Checkmark */}
      <div
        className={cn(
          "absolute top-4 right-4 z-10 transition-all duration-300 transform",
          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90",
        )}
      >
        <div className="bg-[#f5a623] text-white rounded-full p-1 shadow-md">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      {/* Popular Badge - Positioned Absolute Top Left */}
      {sellingPlan.popular && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#f5a623] text-white shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Frequency Image - Large & Centered */}
      <div className="mb-6 h-48 w-full flex items-center justify-center mx-auto transition-transform duration-500 ease-out group-hover:scale-105">
        {sellingPlan.image?.contentUrl ? (
          <img
            src={sellingPlan.image.contentUrl}
            alt={sellingPlan.image.altText || sellingPlan.name}
            className="h-full w-full object-contain drop-shadow-sm"
          />
        ) : (
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300",
              isSelected
                ? "bg-[#f5a623]/10 text-[#f5a623]"
                : "bg-gray-50 text-gray-300",
            )}
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Frequency Details - Centered */}
      <div className="space-y-3 flex-1 flex flex-col text-center items-center">
        <h3
          className={cn(
            "leading-tight font-heading text-2xl uppercase tracking-wide transition-colors duration-300",
            isSelected ? "text-[#f5a623]" : "text-gray-900",
          )}
        >
          {sellingPlan.name}
        </h3>

        <div className="space-y-1 font-body text-gray-600">
          <p className="font-medium text-lg">
            {frequencyInfo.deliveriesPerYear} deliveries per year
          </p>
          <p className="text-sm text-gray-500">
            Every {frequencyInfo.intervalText.toLowerCase()}
          </p>
        </div>

        {/* Pricing */}
        <div className="pt-4 mt-auto">
          <p className="font-body text-xs text-gray-400 italic px-4">
            Price calculated in next step
          </p>
        </div>
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
export function getFrequencyInfo(sellingPlan: SellingPlan): {
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
