import { CartForm } from "@shopify/hydrogen";
import React, { useState } from "react";
import type { FetcherWithComponents } from "react-router";
import { toggleCartDrawer } from "~/components/layout/cart-drawer";
import { formatWineClubCart, validateCartData } from "~/utils/cart-utils";
import { cn } from "~/utils/cn";
import PromotionalOfferModal, {
  mockPromotionalOffer,
} from "./promotional-offer-modal";
import type { WizardStepProps } from "./selection-wizard";
import { calculateTotalPrice } from "./selection-wizard";

/**
 * Step 5: Review Component
 *
 * @description Shows complete selection summary with pricing and checkout options
 * Allows editing selections and proceeding to checkout
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance Scenario 5: Step 5 displays all selections with accurate pricing and allows editing
 */

export interface Step5ReviewProps extends WizardStepProps {
  /** Additional CSS classes */
  className?: string;

  /** Custom checkout handler */
  onCheckout?: () => void;

  /** Custom edit handlers */
  onEditCaseSize?: () => void;
  onEditFrequency?: () => void;
  onEditWines?: () => void;
}

export default function Step5Review({
  state,
  wineClub,
  updateState,
  className,
  onCheckout,
  onEditCaseSize,
  onEditFrequency,
  onEditWines,
}: Step5ReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const { selectedCaseSize, selectedSellingPlan, selectedProducts, errors } =
    state;

  const pricing = calculateTotalPrice(state);

  // Format cart lines for Shopify CartForm
  const cartLines = React.useMemo(() => {
    try {
      if (
        !(selectedCaseSize && selectedSellingPlan) ||
        selectedProducts.length === 0
      ) {
        return [];
      }

      const cartData = formatWineClubCart(wineClub, state);
      const validation = validateCartData(cartData);

      if (!validation.isValid) {
        console.error("Cart validation failed:", validation.errors);
        return [];
      }

      // Debug: Log cart lines to see what's being sent
      console.log(
        "[Wine Club] Cart lines:",
        JSON.stringify(cartData.cartInput.lines, null, 2),
      );

      return cartData.cartInput.lines;
    } catch (error) {
      console.error("Error formatting cart:", error);
      return [];
    }
  }, [
    wineClub,
    state,
    selectedCaseSize,
    selectedSellingPlan,
    selectedProducts,
  ]);

  // Handle checkout process
  const handleCheckout = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    updateState({ isSubmitting: true });

    try {
      // Validate all selections before checkout
      if (!validateSelections()) {
        return;
      }

      // Format cart data for Shopify
      const cartData = formatWineClubCart(wineClub, state);

      // Validate cart data
      const validation = validateCartData(cartData);
      if (!validation.isValid) {
        throw new Error(
          `Cart validation failed: ${validation.errors.join(", ")}`,
        );
      }

      // Call custom checkout handler or default behavior
      await onCheckout?.(cartData);

      // Default behavior: Create cart and redirect to checkout
      await createCartAndRedirect(cartData);
    } catch (error) {
      console.error("Checkout error:", error);
      updateState({
        errors: {
          ...errors,
          review:
            error instanceof Error
              ? error.message
              : "Unable to proceed to checkout. Please try again.",
        },
      });
    } finally {
      setIsSubmitting(false);
      updateState({ isSubmitting: false });
    }
  };

  // Create Shopify cart and redirect to checkout
  const createCartAndRedirect = async (cartData: any) => {
    try {
      // Generate GraphQL mutation
      const mutation = generateCartCreateMutation(cartData.cartInput);

      // This would typically be called via the Shopify Storefront API
      // For now, we'll simulate the cart creation process
      console.log("Creating cart with data:", cartData);
      console.log("GraphQL mutation:", mutation);

      // In a real implementation, you would:
      // 1. Call Shopify Storefront API with the mutation
      // 2. Get the cart object with checkoutUrl
      // 3. Redirect user to checkoutUrl

      // Simulated response for development
      const mockCartResponse = {
        cart: {
          id: "mock-cart-id",
          checkoutUrl: `/checkout?cart=${cartData.metadata.wineClubId}`,
          totalQuantity: cartData.metadata.totalItems,
        },
      };

      // Redirect to checkout
      if (typeof window !== "undefined") {
        // For development, show the cart data instead of redirecting
        if (process.env.NODE_ENV === "development") {
          console.log("Cart created successfully:", mockCartResponse);
          alert(
            `Cart created with ${cartData.metadata.totalItems} items. Check console for details.`,
          );
        } else {
          // In production, redirect to actual checkout
          window.location.href = mockCartResponse.cart.checkoutUrl;
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to create cart: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Validate all selections
  const validateSelections = (): boolean => {
    if (!selectedCaseSize) {
      updateState({ currentStep: 1 });
      return false;
    }
    if (!selectedSellingPlan) {
      updateState({ currentStep: 2 });
      return false;
    }
    if (selectedProducts.length === 0) {
      updateState({ currentStep: 3 });
      return false;
    }
    return true;
  };

  // Show sign-up promotional offer if available
  const showSignUpOffer =
    (wineClub.signUpProductOffer &&
      (!wineClub.signUpProductOffer.expiryDate ||
        new Date(wineClub.signUpProductOffer.expiryDate) > new Date())) ||
    process.env.NODE_ENV === "development"; // Show mock offer in development

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Your Selection
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Please review your wine club configuration before proceeding to
          checkout. You can edit any section by clicking the "Edit" buttons.
        </p>
      </div>

      {/* Error Display */}
      {errors.review && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.review}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wine Club Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wine Club</h3>
              <span className="text-sm text-gray-500">Club Details</span>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{wineClub.name}</h4>
                {wineClub.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {wineClub.description.replace(/<[^>]*>/g, "").slice(0, 150)}
                    ...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Case Size Selection */}
          <SelectionSummaryCard
            title="Case Size"
            icon={<CaseSizeIcon />}
            selection={selectedCaseSize}
            onEdit={() => {
              onEditCaseSize?.();
              updateState({ currentStep: 1 });
            }}
          >
            {selectedCaseSize && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {selectedCaseSize.quantity}
                  </span>{" "}
                  bottles per delivery
                </div>
                {selectedCaseSize.image && (
                  <img
                    src={selectedCaseSize.image}
                    alt={selectedCaseSize.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
              </div>
            )}
          </SelectionSummaryCard>

          {/* Frequency Selection */}
          <SelectionSummaryCard
            title="Delivery Frequency"
            icon={<FrequencyIcon />}
            selection={selectedSellingPlan}
            onEdit={() => {
              onEditFrequency?.();
              updateState({ currentStep: 2 });
            }}
          >
            {selectedSellingPlan && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {selectedSellingPlan.name}
                  </span>
                </div>
                {selectedSellingPlan.description && (
                  <p className="text-sm text-gray-500">
                    {selectedSellingPlan.description}
                  </p>
                )}
              </div>
            )}
          </SelectionSummaryCard>

          {/* Wine Selection */}
          <SelectionSummaryCard
            title="Wine Selection"
            icon={<WineIcon />}
            selection={selectedProducts.length > 0 ? selectedProducts : null}
            onEdit={() => {
              onEditWines?.();
              updateState({ currentStep: 3 });
            }}
          >
            {selectedProducts.length > 0 ? (
              <div className="space-y-3">
                {selectedProducts.map((product) => (
                  <div
                    key={product.productVariant.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {product.productVariant.productTitle}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${product.productVariant.retailPrice.toFixed(2)} each
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ×{product.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${(product.calculatedPrice || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-sm text-gray-600">
                  Total items:{" "}
                  {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}{" "}
                  bottles
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No wines selected</p>
            )}
          </SelectionSummaryCard>
        </div>

        {/* Pricing Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Summary
            </h3>

            <div className="space-y-3">
              {/* Original Subtotal with Discount */}
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between items-center pb-2">
                  <span className="text-sm text-gray-500">Original Price</span>
                  <span className="text-sm text-gray-500 line-through">
                    ${pricing.originalSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Discount Amount */}
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-green-600">
                    {selectedSellingPlan?.discountPercentage}% Discount
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    -${pricing.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Subscription Total */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Wine Subscription</span>
                <span className="font-medium text-gray-900">
                  ${pricing.subscriptionTotal.toFixed(2)}
                </span>
              </div>

              {/* Add-ons Total */}
              {pricing.addOnTotal > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Add-ons</span>
                  <span className="font-medium text-gray-900">
                    ${pricing.addOnTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-3">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-xl font-bold text-gray-900">
                  ${pricing.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Savings Badge */}
              {pricing.discountAmount > 0 && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-800 text-center">
                    <span className="font-medium">
                      You save ${pricing.discountAmount.toFixed(2)}
                    </span>
                    <span className="block">
                      with {selectedSellingPlan?.name} subscription
                    </span>
                  </div>
                </div>
              )}

              {/* Billing Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Billing Information</p>
                  <p>• Subscription billed per delivery</p>
                  <p>• Add-ons billed with first delivery</p>
                  <p>• Free shipping on all orders</p>
                </div>
              </div>

              {/* Checkout Button */}
              <AddToCartButton cartLines={cartLines} />

              {/* Sign-up Offer */}
              {showSignUpOffer && (
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="w-full mt-2 py-2 px-4 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                  🎉 View Special Offer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Offer Modal */}
      {showSignUpOffer && (
        <PromotionalOfferModal
          offer={wineClub.signUpProductOffer || mockPromotionalOffer}
          isVisible={showPromoModal}
          onClose={() => setShowPromoModal(false)}
          onAcceptOffer={() => {
            console.log("Promotional offer accepted");
            // Add offer to state or handle acceptance logic
          }}
          onDeclineOffer={() => {
            console.log("Promotional offer declined");
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface SelectionSummaryCardProps {
  title: string;
  icon: React.ReactNode;
  selection: any;
  onEdit: () => void;
  optional?: boolean;
  children: React.ReactNode;
}

function SelectionSummaryCard({
  title,
  icon,
  selection,
  onEdit,
  optional = false,
  children,
}: SelectionSummaryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-gray-400">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
            {optional && (
              <span className="text-sm text-gray-500 font-normal ml-1">
                (Optional)
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      </div>

      {selection ? (
        children
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {optional ? "No items selected" : "Please select an option"}
          </p>
        </div>
      )}
    </div>
  );
}

// Icon Components
function CaseSizeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function FrequencyIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function WineIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function AddOnIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  );
}

/**
 * Add to Cart Button with CartForm integration
 */
interface AddToCartButtonProps {
  cartLines: any[];
}

function AddToCartButton({ cartLines }: AddToCartButtonProps) {
  return (
    <CartForm
      route="/cart"
      inputs={{ lines: cartLines }}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        const prevStateRef = React.useRef(fetcher.state);

        // Open cart drawer when fetcher completes successfully
        React.useEffect(() => {
          const hasErrors = (fetcher.data?.errors && fetcher.data.errors.length > 0) ||
                           (fetcher.data?.userErrors && fetcher.data.userErrors.length > 0);
          const isCompleting = (prevStateRef.current === "submitting" || prevStateRef.current === "loading") && fetcher.state === "idle";

          // Log for debugging
          console.log("[AddToCart] State transition:", {
            prevState: prevStateRef.current,
            currentState: fetcher.state,
            hasData: Boolean(fetcher.data),
            hasErrors,
            isCompleting,
          });

          if (isCompleting && !hasErrors) {
            console.log("[AddToCart] Opening cart drawer");
            toggleCartDrawer(true);
          }

          prevStateRef.current = fetcher.state;
        }, [fetcher.state, fetcher.data]);

        return (
          <>
            <button
              type="submit"
              disabled={cartLines.length === 0 || fetcher.state !== "idle"}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                cartLines.length === 0 || fetcher.state !== "idle"
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              {fetcher.state !== "idle" ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Adding to Cart...
                </span>
              ) : (
                "Add to Cart"
              )}
            </button>
            {/* Show error message if cart mutation failed */}
            {fetcher.data?.errors && fetcher.state === "idle" && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">
                  Failed to add to cart
                </p>
                <p className="text-red-700 text-xs mt-1">
                  {fetcher.data.errors[0] || "Please try again"}
                </p>
              </div>
            )}
          </>
        );
      }}
    </CartForm>
  );
}
