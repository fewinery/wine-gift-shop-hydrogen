import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
import { cn } from "~/utils/cn";

const AGE_VERIFIED_KEY = "age-verified";

export function AgeVerificationPopup() {
  const {
    ageVerificationEnabled,
    ageVerificationHeading,
    ageVerificationDescription,
    ageVerificationYesButtonText,
    ageVerificationNoButtonText,
    ageVerificationMinimumAge,
    ageVerificationErrorMessage,
    ageVerificationHeadingSize,
    ageVerificationHeadingMobileSize,
    ageVerificationDescriptionSize,
    ageVerificationDescriptionMobileSize,
    ageVerificationBgColor,
    ageVerificationHeadingColor,
    ageVerificationDescriptionColor,
    ageVerificationYesButtonBg,
    ageVerificationYesButtonBgHover,
    ageVerificationYesButtonTextColor,
    ageVerificationNoButtonBg,
    ageVerificationNoButtonBgHover,
    ageVerificationNoButtonTextColor,
  } = useThemeSettings();

  const [open, setOpen] = useState(false);
  const [showNoMessage, setShowNoMessage] = useState(false);
  const isDesignMode = useWeaverseStudioCheck();

  // Check if user has already verified
  useEffect(() => {
    if (!isDesignMode) {
      const isVerified = localStorage.getItem(AGE_VERIFIED_KEY) === "true";
      if (!isVerified) {
        setOpen(true);
      }
    }
  }, [isDesignMode]);

  // Re-open popup when settings change in design mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: ensure popup stay open in design mode
  useEffect(() => {
    if (isDesignMode) {
      setOpen(true);
    }
  }, [
    isDesignMode,
    ageVerificationHeading,
    ageVerificationDescription,
    ageVerificationYesButtonText,
    ageVerificationNoButtonText,
    ageVerificationMinimumAge,
    ageVerificationHeadingSize,
    ageVerificationHeadingMobileSize,
    ageVerificationDescriptionSize,
    ageVerificationDescriptionMobileSize,
    ageVerificationBgColor,
    ageVerificationHeadingColor,
    ageVerificationDescriptionColor,
    ageVerificationYesButtonBg,
    ageVerificationYesButtonTextColor,
    ageVerificationNoButtonBg,
    ageVerificationNoButtonTextColor,
  ]);

  const handleYes = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setOpen(false);
  };

  const handleNo = () => {
    // Show message instead of redirecting
    setShowNoMessage(true);
  };

  if (!ageVerificationEnabled) {
    return null;
  }

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/80 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-0 z-[60] flex overflow-y-auto p-4",
            "pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]",
            "items-center justify-center",
          )}
          aria-describedby={undefined}
        >
          <div
            className="relative my-auto w-full max-w-md shadow-xl p-8 text-center"
            style={{ backgroundColor: ageVerificationBgColor || "#000000" }}
          >
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Age Verification</Dialog.Title>
            </VisuallyHidden.Root>

            <h2
              className="mb-4 font-bold leading-tight"
              style={{
                fontSize: `clamp(${ageVerificationHeadingMobileSize || 32}px, 5vw, ${ageVerificationHeadingSize || 48}px)`,
                color: ageVerificationHeadingColor || "#ffffff",
              }}
            >
              {ageVerificationHeading ||
                `ARE YOU ${ageVerificationMinimumAge || 21}+?`}
            </h2>
            <p
              className="mb-8"
              style={{
                fontSize: `clamp(${ageVerificationDescriptionMobileSize || 14}px, 2vw, ${ageVerificationDescriptionSize || 18}px)`,
                color: ageVerificationDescriptionColor || "#ffffff",
              }}
            >
              {ageVerificationDescription ||
                "You must be of legal drinking age to enter this site."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleYes}
                className="flex-1 py-3 px-6 font-bold transition-colors uppercase text-lg"
                style={{
                  backgroundColor: ageVerificationYesButtonBg || "#e91220",
                  color: ageVerificationYesButtonTextColor || "#ffffff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ageVerificationYesButtonBgHover || "#c0101b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ageVerificationYesButtonBg || "#e91220";
                }}
              >
                {ageVerificationYesButtonText || "YES"}
              </button>
              <button
                type="button"
                onClick={handleNo}
                className="flex-1 py-3 px-6 font-bold transition-colors uppercase text-lg"
                style={{
                  backgroundColor: ageVerificationNoButtonBg || "#ffffff",
                  color: ageVerificationNoButtonTextColor || "#000000",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ageVerificationNoButtonBgHover || "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ageVerificationNoButtonBg || "#ffffff";
                }}
              >
                {ageVerificationNoButtonText || "NO"}
              </button>
            </div>

            {showNoMessage && (
              <p className="mt-4 text-red-400 text-sm">
                {ageVerificationErrorMessage ||
                  "Sorry, you must be of legal drinking age to access this site."}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
