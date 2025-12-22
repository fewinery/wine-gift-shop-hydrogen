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
        <div className="absolute top-[16px] left-5 right-5 h-2 bg-gray-200 z-0">
          <div
            className="h-full bg-[#f5a623] transition-all duration-300 ease-in-out"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between relative z-[1]">
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
                <div className="relative flex items-center justify-center">
                  {/* Outer Halo */}
                  {(isActive || isCompleted) && (
                    <div className="absolute w-12 h-12 rounded-full bg-[#f5a623]/20 animate-pulse" />
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-[2]",
                      {
                        "bg-[#f5a623] text-white shadow-md": isActive || isCompleted,
                        "bg-background border-2 border-gray-300 text-gray-400": !(
                          isActive || isCompleted
                        ),
                        "group-hover:border-[#f5a623] group-hover:text-[#f5a623]":
                          isClickable && !isActive && !isCompleted,
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
                      <span className="text-sm font-bold">{stepNumber}</span>
                    )}
                  </div>
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest transition-colors duration-200",
                      {
                        "text-[#f5a623]": isActive || isCompleted,
                        "text-gray-500": !(isActive || isCompleted),
                        "group-hover:text-[#f5a623]": isClickable && !isActive && !isCompleted,
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

      {/* Guide Message */}
      <div className="mt-12 text-center">
        <p className="text-sm">
          {getProgressMessage(currentStep, totalSteps)}
        </p>
      </div>
    </div >
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
