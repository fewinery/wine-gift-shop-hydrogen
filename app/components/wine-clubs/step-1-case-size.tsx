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
      <div className="text-center py-12">
        <p className="text-gray-500">
          No case sizes available. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[40px]">Choose Your Case Size</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          How many bottles would you like to receive?
        </p>
      </div>

      {/* Error Display */}
      {errors.caseSize && (
        <div className="bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-red-800 text-sm">{errors.caseSize}</p>
        </div>
      )}

      {/* Case Size Options */}
      <div className="flex flex-wrap justify-center gap-6">
        {caseSizes.map((caseSize) => (
          <CaseSizeCard
            key={caseSize.id}
            caseSize={caseSize}
            isSelected={selectedCaseSize?.id === caseSize.id}
            onSelect={() => handleCaseSizeSelect(caseSize)}
          />
        ))}
      </div>
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
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer flex flex-col p-8 transition-all duration-300 bg-white rounded-lg w-[350px]",
        "border-2 hover:shadow-lg",
        {
          "border-[#f5a623] shadow-md": isSelected,
          "border-gray-200 hover:border-gray-300": !isSelected,
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
    >
      {/* Selection Checkmark */}
      <div
        className={cn(
          "absolute top-4 right-4 transition-opacity duration-300",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#f5a623" />
          <path
            d="M8 12L11 15L16 9"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Case Size Image */}
      <div className="mb-6 h-40 w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {caseSize.image ? (
          <img
            src={caseSize.image}
            alt={caseSize.title}
            className="h-full w-full object-contain drop-shadow-sm"
          />
        ) : (
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
              isSelected
                ? "bg-[#f5a623]/10 text-[#f5a623]"
                : "bg-gray-50 text-gray-400",
            )}
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 flex-1 flex flex-col text-center items-center">
        <h3
          className={cn(
            "leading-normal font-heading text-2xl uppercase tracking-wide transition-colors duration-300",
            isSelected && "text-[#f5a623]",
          )}
        >
          {caseSize.title}
        </h3>

        <div className="space-y-1 font-body text-[#5C5C5C]">
          <p>{caseSize.quantity} bottles</p>
          <p>
            {caseSize.quantity <= 6 ? "Every few weeks" : "Monthly delivery"}
          </p>
        </div>

        {/* Price Placeholder */}
        <div className="pt-6 mt-auto">
          <p className="font-body text-sm text-gray-500 italic">
            Price calculated in next step
          </p>
        </div>
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
