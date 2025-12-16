import { cn } from "~/utils/cn";

/**
 * Progress Bar Component
 *
 * @description Shows user's progress through the 4-step wine club selection wizard
 * Provides visual feedback and step navigation (FR-016)
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Features: Step indicators, progress line, clickable navigation, mobile responsive
 */

export interface ProgressBarProps {
  /** Current step (1-4) */
  currentStep: number;

  /** Total number of steps (default: 4) */
  totalSteps?: number;

  /** Whether steps are clickable for navigation */
  allowNavigation?: boolean;

  /** Callback when step is clicked */
  onStepClick?: (step: number) => void;

  /** Additional CSS classes */
  className?: string;

  /** Custom step labels */
  stepLabels?: string[];
}

export default function ProgressBar({
  currentStep,
  totalSteps = 4,
  allowNavigation = true,
  onStepClick,
  className,
  stepLabels = ["Case Size", "Frequency", "Quantity", "Review"],
}: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const isClickable = allowNavigation && onStepClick;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onStepClick?.(stepNumber);
                  }
                }}
                aria-label={`Go to step ${stepNumber}: ${stepLabels[index]}`}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    {
                      "bg-blue-600 border-blue-600 text-white": isActive,
                      "bg-green-600 border-green-600 text-white": isCompleted,
                      "bg-white border-gray-300 text-gray-400": !(
                        isActive || isCompleted
                      ),
                      "hover:border-blue-400 group-hover:text-blue-600":
                        isClickable && !isActive,
                    },
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      {
                        "text-blue-600": isActive,
                        "text-green-600": isCompleted,
                        "text-gray-500": !(isActive || isCompleted),
                        "group-hover:text-blue-600": isClickable && !isActive,
                      },
                    )}
                  >
                    {stepLabels[index]}
                  </p>

                  {/* Mobile-friendly abbreviated label */}
                  <p className="text-xs text-gray-400 mt-1 sm:hidden">
                    {getMobileLabel(stepLabels[index])}
                  </p>
                </div>

                {/* Screen reader text for accessibility */}
                <span className="sr-only">
                  {isActive
                    ? `Current step: ${stepNumber} - ${stepLabels[index]}`
                    : isCompleted
                      ? `Completed step: ${stepNumber} - ${stepLabels[index]}`
                      : `Step ${stepNumber}: ${stepLabels[index]}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
        </p>
        <div className="mt-1">
          <span className="text-xs text-gray-500">
            {getProgressMessage(currentStep, totalSteps)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get abbreviated label for mobile display
 */
function getMobileLabel(label: string): string {
  if (label.toLowerCase().includes("case")) {
    return "Size";
  }
  if (label.toLowerCase().includes("frequency")) {
    return "When";
  }
  if (label.toLowerCase().includes("quantity")) {
    return "How many";
  }
  if (label.toLowerCase().includes("review")) {
    return "Check";
  }
  return label.slice(0, 4);
}

/**
 * Get contextual progress message
 */
function getProgressMessage(currentStep: number, totalSteps: number): string {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  if (currentStep === 1) {
    return "Let's start by selecting your case size";
  }
  if (currentStep === totalSteps) {
    return "Review your selections before checkout";
  }
  if (progress < 25) {
    return "You're making great progress!";
  }
  if (progress < 50) {
    return "Almost halfway there!";
  }
  if (progress < 75) {
    return "You're doing great!";
  }
  return "Just a few more steps!";
}

/**
 * Progress Bar Variants
 */

export function CompactProgressBar(props: Omit<ProgressBarProps, "className">) {
  return (
    <ProgressBar
      {...props}
      className="max-w-md mx-auto"
      stepLabels={props.stepLabels?.map((_, i) => `Step ${i + 1}`)}
    />
  );
}

export function MinimalProgressBar(
  props: Omit<
    ProgressBarProps,
    "stepLabels" | "allowNavigation" | "onStepClick"
  >,
) {
  return (
    <div className="w-full">
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${((props.currentStep - 1) / ((props.totalSteps || 4) - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-600">
          {props.currentStep} of {props.totalSteps || 4} steps completed
        </p>
      </div>
    </div>
  );
}
