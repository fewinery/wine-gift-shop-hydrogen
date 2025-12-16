import React from "react";
import type { SignUpProductOffer } from "~/types/winehub";
import { cn } from "~/utils/cn";

/**
 * Promotional Offer Modal Component
 *
 * @description Displays sign-up promotional offers to new wine club members
 * Shows limited-time offers, special pricing, or bonus products
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance: Implements sign-up promotional offer modal display (FR-020)
 */

export interface PromotionalOfferModalProps {
  /** Promotional offer data */
  offer: SignUpProductOffer;

  /** Whether modal is visible */
  isVisible: boolean;

  /** Callback when modal is closed */
  onClose: () => void;

  /** Callback when offer is accepted */
  onAcceptOffer?: () => void;

  /** Callback when offer is declined */
  onDeclineOffer?: () => void;

  /** Additional CSS classes */
  className?: string;
}

export default function PromotionalOfferModal({
  offer,
  isVisible,
  onClose,
  onAcceptOffer,
  onDeclineOffer,
  className,
}: PromotionalOfferModalProps) {
  if (!isVisible) return null;

  // T071: Validate offer data and expiry date
  if (!(offer && offer.id && offer.title)) {
    console.warn(
      "[PromotionalOffer] Invalid offer data - missing required fields",
    );
    return null;
  }

  const handleAccept = () => {
    onAcceptOffer?.();
    onClose();
  };

  const handleDecline = () => {
    onDeclineOffer?.();
    onClose();
  };

  // T071: Check if offer has expired with validation for invalid dates
  let isExpired = false;
  if (offer.expiryDate) {
    try {
      const expiryDateObj = new Date(offer.expiryDate);
      // Check for invalid date
      if (Number.isNaN(expiryDateObj.getTime())) {
        console.warn(
          "[PromotionalOffer] Invalid expiry date format:",
          offer.expiryDate,
        );
        // Treat invalid dates as expired to hide broken offers
        isExpired = true;
      } else {
        isExpired = expiryDateObj < new Date();
      }
    } catch (error) {
      console.warn(
        "[PromotionalOffer] Failed to parse expiry date:",
        offer.expiryDate,
        error,
      );
      isExpired = true;
    }
  }

  // T071: Don't show modal if offer is expired or invalid
  if (isExpired) {
    console.info("[PromotionalOffer] Offer has expired:", offer.id);
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-modal-title"
          aria-describedby="promo-modal-description"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close promotional offer"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Offer Header */}
          <div className="text-center mb-6">
            {/* Offer Icon/Badge */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
              <svg
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>

            <h3
              id="promo-modal-title"
              className="text-xl font-bold text-gray-900 mb-2"
            >
              🎉 Special Offer for New Members!
            </h3>

            {isExpired ? (
              <p className="text-red-600 text-sm font-medium">
                This offer has expired
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                Limited time - Don't miss out!
              </p>
            )}
          </div>

          {/* Offer Content */}
          <div className="space-y-4">
            {/* Offer Title */}
            {offer.title && (
              <h4 className="text-lg font-semibold text-gray-900 text-center">
                {offer.title}
              </h4>
            )}

            {/* Offer Description */}
            {offer.description && (
              <div
                id="promo-modal-description"
                className="text-gray-600 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: offer.description }}
              />
            )}

            {/* Offer Details */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h5 className="font-medium text-orange-900 mb-2">
                What you'll get:
              </h5>
              <ul className="space-y-1 text-sm text-orange-800">
                {offer.bonusProducts && (
                  <li>
                    • {offer.bonusProducts.length} bonus wine(s) with first
                    delivery
                  </li>
                )}
                {offer.discountPercentage && (
                  <li>• {offer.discountPercentage}% off your first shipment</li>
                )}
                {offer.freeShipping && (
                  <li>• Free shipping on your first order</li>
                )}
                <li>• No commitment - cancel anytime</li>
              </ul>
            </div>

            {/* Expiry Info */}
            {offer.expiryDate && !isExpired && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Offer expires:{" "}
                  {new Date(offer.expiryDate).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <CountdownTimer expiryDate={offer.expiryDate} />
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {offer.termsAndConditions && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Terms and conditions
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-gray-600">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: offer.termsAndConditions,
                    }}
                  />
                </div>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {isExpired ? (
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={handleAccept}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Yes, Claim My Offer!
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  No thanks, continue without offer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Countdown Timer Component
// ============================================================================

interface CountdownTimerProps {
  expiryDate: string;
}

function CountdownTimer({ expiryDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  const { days, hours, minutes, seconds } = timeLeft;

  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return <span className="text-red-600 font-medium">Expired</span>;
  }

  return (
    <div className="flex justify-center space-x-2 text-orange-600 font-medium">
      {days > 0 && (
        <div className="text-center">
          <div className="bg-orange-100 rounded px-2 py-1">{days}</div>
          <div className="text-xs">Days</div>
        </div>
      )}
      <div className="text-center">
        <div className="bg-orange-100 rounded px-2 py-1">
          {hours.toString().padStart(2, "0")}
        </div>
        <div className="text-xs">Hours</div>
      </div>
      <div className="text-center">
        <div className="bg-orange-100 rounded px-2 py-1">
          {minutes.toString().padStart(2, "0")}
        </div>
        <div className="text-xs">Minutes</div>
      </div>
      <div className="text-center">
        <div className="bg-orange-100 rounded px-2 py-1">
          {seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-xs">Seconds</div>
      </div>
    </div>
  );
}

// ============================================================================
// Mock Offer for Development
// ============================================================================

export const mockPromotionalOffer: SignUpProductOffer = {
  id: "new-member-special",
  title: "New Member Welcome Package",
  description:
    "Join today and receive an exclusive welcome package with premium wines and special member benefits.",
  discountPercentage: 20,
  freeShipping: true,
  bonusProducts: ["premium-red", "premium-white"],
  expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  termsAndConditions: `
    <p><strong>Terms and Conditions:</strong></p>
    <ul>
      <li>Offer valid for new wine club members only</li>
      <li>20% discount applies to first shipment only</li>
      <li>Free shipping on first order</li>
      <li>Bonus wines included in first delivery</li>
      <li>Cannot be combined with other offers</li>
      <li>Must claim offer before expiry date</li>
    </ul>
  `,
};
