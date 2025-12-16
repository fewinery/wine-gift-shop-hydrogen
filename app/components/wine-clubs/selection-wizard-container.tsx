import React from "react";
import type { WineClubDetails } from "~/types/winehub";
import { cn } from "~/utils/cn";
import NavigationGuard, {
  clearWizardState,
  saveWizardState,
} from "./navigation-guard";
import ProgressBar from "./progress-bar";
import { useWineClubWizard } from "./selection-wizard";
import Step1CaseSize from "./step-1-case-size";
import Step2Frequency from "./step-2-frequency";
import Step3Quantity from "./step-3-quantity";
import Step5Review from "./step-5-review";

/**
 * Selection Wizard Container Component
 *
 * @description Integrates all 5 steps of the wine club selection process
 * Manages state transitions, validation, and navigation between steps
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Features: Step navigation, state persistence, validation, error handling
 */

export interface SelectionWizardContainerProps {
  /** Wine club data with product information */
  wineClub: WineClubDetails;

  /** Additional CSS classes */
  className?: string;

  /** Custom handlers for integration with cart/checkout */
  onCheckout?: (state: any) => Promise<void>;

  /** Callback when wizard is completed */
  onComplete?: (state: any) => void;

  /** Show/hide step numbers in progress bar */
  showStepNumbers?: boolean;

  /** Allow navigation to any step (vs. sequential only) */
  allowStepNavigation?: boolean;
}

export default function SelectionWizardContainer({
  wineClub,
  className,
  onCheckout,
  onComplete,
  // biome-ignore lint/correctness/noUnusedFunctionParameters: Reserved for future ProgressBar enhancement
  showStepNumbers = true,
  allowStepNavigation = false,
}: SelectionWizardContainerProps) {
  const wizard = useWineClubWizard(wineClub);
  const prevStateRef = React.useRef<string>("");

  // Auto-save wizard state to session storage when state actually changes
  React.useEffect(() => {
    const currentStateJson = JSON.stringify(wizard.state);
    if (currentStateJson !== prevStateRef.current) {
      saveWizardState(wizard.state, wineClub.id);
      prevStateRef.current = currentStateJson;
    }
  }, [wizard.state, wineClub.id]);

  // Clear saved state when wizard is completed
  React.useEffect(() => {
    if (wizard.state.currentStep === 5) {
      // Completed state (after step 4 review)
      clearWizardState();
    }
  }, [wizard.state.currentStep]);

  // Save selections when navigating away
  const handleSaveSelections = async () => {
    try {
      saveWizardState(wizard.state, wineClub.id);
    } catch (error) {
      console.error("Failed to save selections:", error);
    }
  };

  const {
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    validateCurrentStep,
    canProceedToNext,
  } = wizard;

  // Handle step navigation with validation
  const handleStepClick = (step: number) => {
    if (!allowStepNavigation) {
      return;
    }

    // Only allow navigation to completed steps or next step
    if (
      (step <= state.currentStep || step === state.currentStep + 1) &&
      validateCurrentStep()
    ) {
      goToStep(step);
    }
  };

  // Handle checkout process
  const handleCheckout = async () => {
    try {
      await onCheckout?.(state);
      onComplete?.(state);
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const stepProps = {
      state,
      wineClub,
      updateState: wizard.updateState,
      goToNextStep: () => {
        if (validateCurrentStep()) {
          goToNextStep();
        }
      },
      goToPreviousStep,
      goToStep: handleStepClick,
    };

    switch (state.currentStep) {
      case 1:
        return <Step1CaseSize {...stepProps} />;
      case 2:
        return <Step2Frequency {...stepProps} />;
      case 3:
        return <Step3Quantity {...stepProps} />;
      case 4:
        return (
          <Step5Review
            {...stepProps}
            onCheckout={handleCheckout}
            onEditCaseSize={() => goToStep(1)}
            onEditFrequency={() => goToStep(2)}
            onEditWines={() => goToStep(3)}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Invalid step selected</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Navigation Guard */}
      <NavigationGuard
        state={state}
        enabled={true}
        onSave={handleSaveSelections}
        onNavigationBlocked={() => {
          console.log("Navigation blocked - user has unsaved selections");
        }}
      />

      <div className={cn("w-full max-w-6xl mx-auto", className)}>
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            currentStep={state.currentStep}
            totalSteps={4}
            allowNavigation={allowStepNavigation}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">{renderCurrentStep()}</div>

        {/* Navigation Buttons */}
        {state.currentStep !== 4 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {state.currentStep > 1 ? (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Previous Step
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => {
                if (validateCurrentStep()) {
                  goToNextStep();
                }
              }}
              disabled={!canProceedToNext}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors",
                canProceedToNext
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed",
              )}
            >
              {state.currentStep === 3 ? "Review Selection" : "Next Step →"}
            </button>
          </div>
        )}

        {/* Error Summary */}
        {Object.keys(state.errors).length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-red-800 font-medium mb-2">
              Please fix these issues:
            </h4>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(state.errors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Debug Information (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <details>
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Debug State
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(state, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Standalone Wizard Component (for testing)
// ============================================================================

/**
 * Standalone wizard for development/testing
 * Uses mock data for wine club information
 */
export function StandaloneSelectionWizard() {
  // Mock wine club data for development
  const mockWineClub: WineClubDetails = {
    id: "mock-club",
    name: "Premium Wine Club",
    description: "A curated selection of premium wines delivered monthly",
    image: "/images/wine-club-hero.jpg",
    shopifyId: "gid://shopify/Product/123456789",
    type: "Automatic",
    caseType: "Mixed",
    caseSizes: [
      {
        id: "6-bottles",
        title: "6 Bottles",
        quantity: 6,
        image: "/images/6-bottles.jpg",
      },
      {
        id: "12-bottles",
        title: "12 Bottles",
        quantity: 12,
        image: "/images/12-bottles.jpg",
      },
    ],
    sellingPlans: [
      {
        id: "monthly",
        name: "Monthly Delivery",
        description: "Receive wines every month",
        discountPercentage: 10,
      },
      {
        id: "quarterly",
        name: "Quarterly Delivery",
        description: "Receive wines every 3 months",
        discountPercentage: 15,
      },
    ],
    productData: [
      {
        productVariant: {
          id: "wine-1",
          title: "Cabernet Sauvignon",
          description: "Rich, full-bodied red wine",
          retailPrice: 29.99,
          caseRestrictions: [
            { caseSize: "6-bottles", min: 1, max: 6, suggestedQuantity: 2 },
            { caseSize: "12-bottles", min: 1, max: 12, suggestedQuantity: 4 },
          ],
        },
        addOnOnly: false,
      },
      {
        productVariant: {
          id: "wine-2",
          title: "Chardonnay",
          description: "Crisp, refreshing white wine",
          retailPrice: 24.99,
          caseRestrictions: [
            { caseSize: "6-bottles", min: 0, max: 6, suggestedQuantity: 1 },
            { caseSize: "12-bottles", min: 0, max: 12, suggestedQuantity: 2 },
          ],
        },
        addOnOnly: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Wine Club Selection Wizard
        </h1>
        <SelectionWizardContainer
          wineClub={mockWineClub}
          onComplete={(state) => {
            console.log("Wizard completed:", state);
            alert("Selection complete! Check console for state details.");
          }}
        />
      </div>
    </div>
  );
}
