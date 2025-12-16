import React from "react";
import type { CaseSize } from "~/types/winehub";
import { cn } from "~/utils/cn";
import type { WizardStepProps } from "./selection-wizard";

/**
 * Step 1: Case Size Selection Component
 *
 * @description Allows users to select their preferred case size for wine delivery
 * Displays available case sizes with images, names, and descriptions
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance Scenario 1: Step 1 displays case size options and progresses on selection
 */

export interface Step1CaseSizeProps extends WizardStepProps {
  /** Additional CSS classes */
  className?: string;

  /** Custom selection handler */
  onCaseSizeSelect?: (caseSize: CaseSize) => void;
}

export default function Step1CaseSize({
  state,
  wineClub,
  updateState,
  goToNextStep,
  className,
  onCaseSizeSelect,
}: Step1CaseSizeProps) {
  const { caseSizes } = wineClub;
  const selectedCaseSize = state.selectedCaseSize;
  const errors = state.errors;

  // Handle case size selection
  const handleCaseSizeSelect = (caseSize: CaseSize) => {
    updateState({ selectedCaseSize: caseSize });
    onCaseSizeSelect?.(caseSize);

    // Note: Removed auto-advance due to state update race condition
    // Users will click "Next Step" button when ready
  };

  if (!caseSizes || caseSizes.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Case Sizes Available
          </h3>
          <p className="text-yellow-700">
            This wine club doesn't have any case sizes configured yet. Please
            contact us for assistance.
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
          Choose Your Case Size
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the number of bottles you'd like to receive in each delivery.
          You can change this anytime before checkout.
        </p>
      </div>

      {/* Error Display */}
      {errors.caseSize && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.caseSize}</p>
        </div>
      )}

      {/* Case Size Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseSizes.map((caseSize) => (
          <CaseSizeCard
            key={caseSize.id}
            caseSize={caseSize}
            isSelected={selectedCaseSize?.id === caseSize.id}
            onSelect={() => handleCaseSizeSelect(caseSize)}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          Not sure which size to choose? Most members start with 6 bottles per
          delivery.
        </p>
      </div>

      {/* Selected Case Size Summary */}
      {selectedCaseSize && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">
                Selected: {selectedCaseSize.title}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedCaseSize.quantity} bottles per delivery
              </p>
            </div>
            <button
              onClick={() => updateState({ selectedCaseSize: null })}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
// Case Size Card Component
// ============================================================================

interface CaseSizeCardProps {
  caseSize: CaseSize;
  isSelected: boolean;
  onSelect: () => void;
}

function CaseSizeCard({ caseSize, isSelected, onSelect }: CaseSizeCardProps) {
  // T072: Track image load failures
  const [imageError, setImageError] = React.useState(false);

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
      aria-describedby={`case-size-${caseSize.id}-description`}
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

      {/* Case Size Image with error handling (T072) */}
      {caseSize.image && !imageError ? (
        <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={caseSize.image}
            alt={caseSize.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => {
              console.warn(
                "[CaseSize] Image failed to load:",
                caseSize.image,
                "- showing fallback",
              );
              setImageError(true);
            }}
          />
        </div>
      ) : (
        <div className="aspect-square mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-400 mb-1">
              {caseSize.quantity}
            </div>
            <div className="text-xs text-gray-500 uppercase">
              {caseSize.quantity === 1 ? "Bottle" : "Bottles"}
            </div>
          </div>
        </div>
      )}

      {/* Case Size Details */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {caseSize.title}
        </h3>

        <div className="text-sm text-gray-600">
          <span className="font-medium">{caseSize.quantity} bottles</span>
          <span className="mx-2">•</span>
          <span>
            {caseSize.quantity <= 6 ? "Every few weeks" : "Monthly delivery"}
          </span>
        </div>

        {/* Price indication placeholder */}
        <div className="text-sm text-gray-500">
          Price calculated in next step
        </div>
      </div>

      {/* Screen reader description */}
      <div id={`case-size-${caseSize.id}-description`} className="sr-only">
        {caseSize.quantity} bottles per delivery.{" "}
        {isSelected ? "Currently selected" : "Click to select this case size"}.
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Case Size Comparison Table
 * Shows all case sizes side by side for easy comparison
 */
export function CaseSizeComparisonTable({
  caseSizes,
  selectedSizeId,
  onSelect,
}: {
  caseSizes: CaseSize[];
  selectedSizeId?: string;
  onSelect: (caseSize: CaseSize) => void;
}) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Case Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bottles
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Best For
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {caseSizes.map((caseSize) => (
            <tr
              key={caseSize.id}
              className={cn(
                "hover:bg-gray-50",
                selectedSizeId === caseSize.id && "bg-blue-50",
              )}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {caseSize.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {caseSize.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getBestForDescription(caseSize.quantity)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onSelect(caseSize)}
                  className={cn(
                    "font-medium",
                    selectedSizeId === caseSize.id
                      ? "text-blue-600"
                      : "text-blue-600 hover:text-blue-900",
                  )}
                >
                  {selectedSizeId === caseSize.id ? "Selected" : "Select"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Get recommendation text based on quantity
 */
function getBestForDescription(quantity: number): string {
  if (quantity <= 3) return "Trying new wines";
  if (quantity <= 6) return "Regular enjoyment";
  if (quantity <= 9) return "Building collection";
  return "Serious collectors";
}
