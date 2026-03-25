import { Image } from "@shopify/hydrogen";
import React, { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import { EditIcon } from "~/components/icons";
import { formatWineClubCart, validateCartData } from "~/utils/cart-utils";
import { cn } from "~/utils/cn";
import PromotionalOfferModal, {
  mockPromotionalOffer,
} from "./promotional-offer-modal";
import type { WizardStepProps } from "./selection-wizard";
import { calculateTotalPrice } from "./selection-wizard";
import { getFrequencyInfo } from "./step-2-frequency";

/**
 * Step 5: Review Component
 *
 * @description Shows complete selection summary with pricing and checkout options
 * Allows editing selections and proceeding to checkout
 *
 * User Story 2 (P2): Wine Club Selection Process
 */

export interface Step5ReviewProps extends WizardStepProps {
  /** Custom checkout handler */
  onCheckout?: (cartData: any) => void;

  /** Custom edit handlers */
  onEditCaseSize?: () => void;
  onEditFrequency?: () => void;
  onEditWines?: () => void;
  onEditAddOns?: () => void;
}

export default function Step5Review({
  state,
  wineClub,
  updateState,
  onCheckout,
  onEditCaseSize,
  onEditFrequency,
  onEditWines,
  onEditAddOns,
}: Step5ReviewProps) {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  const {
    selectedCaseSize,
    selectedSellingPlan,
    selectedProducts,
    selectedAddOns,
    errors,
  } = state;

  const getDiscountPercentage = (product: any) => {
    // 1. Prioritize stored discount (passed from Step 3/4)
    if (typeof product.discountPercentage === "number") {
      return product.discountPercentage;
    }

    // 2. Fallback: Lookup original product data to check for individualPrices
    // This handles cases where state might be stale or missing discountPercentage
    if (selectedSellingPlan) {
      // Find the original product data source
      const allProductData = [
        ...(wineClub.sellingPlanVariants || []),
        ...(wineClub.productData || []),
      ].map((spv: any) => spv.productData || spv);

      const originalProduct = allProductData.find(
        (p: any) => p.productVariant?.id === product.productVariant.id,
      );

      if (originalProduct?.individualPrices) {
        const individualPrice = originalProduct.individualPrices.find(
          (ip: any) =>
            String(ip.sellingPlan) === String(selectedSellingPlan.id),
        );

        if (individualPrice && individualPrice.discountType === "percentage") {
          return parseFloat(individualPrice.individualPrice);
        }
      }
    }

    // 3. Fallback to global Selling Plan discount
    const itemSellingPlanId = product.sellingPlanId;
    const sellingPlan = itemSellingPlanId
      ? selectedSellingPlan?.id === itemSellingPlanId
        ? selectedSellingPlan
        : null
      : selectedSellingPlan;

    if (sellingPlan?.discountPercentage) {
      return sellingPlan.discountPercentage;
    }
    if (sellingPlan?.sellingPlanClubDiscount?.fixedType === "PERCENTAGE") {
      return sellingPlan.sellingPlanClubDiscount.fixedAmount;
    }
    return 0;
  };

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
    if (isSubmitting) {
      return;
    }

    try {
      // Validate all or specific selections
      if (!validateSelections()) {
        return;
      }

      // Format cart data for Shopify
      const cartData = formatWineClubCart(wineClub, state);

      // Validate cart data
      const validation = validateCartData(cartData);
      if (!validation.isValid) {
        throw new Error(`Selection error: ${validation.errors.join(", ")}`);
      }

      // Submit to action for direct checkout

      // Signal parent that we are checking out (disables navigation guard)
      // Pass cartData or null, container's handleCheckout ignores arguments anyway
      onCheckout?.(cartData);

      fetcher.submit(
        { cartInput: JSON.stringify(cartData.cartInput) },
        { method: "POST" },
      );
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
    }
  };

  // Handle redirect on success
  React.useEffect(() => {
    if (fetcher.data?.checkoutUrl && typeof window !== "undefined") {
      window.location.href = fetcher.data.checkoutUrl;
    }
    if (fetcher.data?.error) {
      // Use functional update to avoid depending on `errors` which causes infinite loop
      updateState({
        errors: {
          review: fetcher.data.error,
        },
      });
    }
  }, [fetcher.data, updateState]); // Removed `errors` from dependencies

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
    process.env.NODE_ENV === "development";

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-[40px] text-gray-900">Review Your Selection</h2>
        <p className="font-body text-[#5C5C5C] text-lg max-w-xl mx-auto">
          Please review your wine club configuration before proceeding to
          checkout. You can edit any section by clicking the pencil icon.
        </p>
      </div>

      {/* Error Display */}
      {errors.review && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.review}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selection Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wine Club Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 hover:border-[#f5a623]/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900">
                Wine Club
              </h3>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Club Details
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-heading text-xl uppercase text-gray-900 mb-2">
                  {wineClub.name}
                </h4>
                {wineClub.description && (
                  <p className="text-base text-gray-600 leading-relaxed">
                    {wineClub.description.replace(/<[^>]*>/g, "").slice(0, 150)}
                    ...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Case Size Selection */}
            <SelectionSummaryCard
              title="Case Size"
              selection={selectedCaseSize}
              onEdit={() => {
                onEditCaseSize?.();
                updateState({ currentStep: 1 });
              }}
            >
              {selectedCaseSize && (
                <div className="flex items-start">
                  {/* Case Size Image */}
                  <div className="w-20 h-20 mr-4 shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center">
                    {selectedCaseSize.image ? (
                      <Image
                        src={selectedCaseSize.image}
                        alt={selectedCaseSize.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-300"
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
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="font-heading text-lg uppercase text-gray-900 leading-tight">
                      {selectedCaseSize.title}
                    </div>
                    <div className="text-base text-gray-600">
                      {selectedCaseSize.quantity} bottles per delivery
                    </div>
                  </div>
                </div>
              )}
            </SelectionSummaryCard>

            {/* Frequency Selection */}
            <SelectionSummaryCard
              title="Delivery Frequency"
              selection={selectedSellingPlan}
              onEdit={() => {
                onEditFrequency?.();
                updateState({ currentStep: 2 });
              }}
            >
              {selectedSellingPlan && (
                <div className="flex items-start">
                  {/* Frequency Image */}
                  <div className="w-20 h-20 mr-4 shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center">
                    {selectedSellingPlan.image?.contentUrl ? (
                      <Image
                        src={selectedSellingPlan.image.contentUrl}
                        alt={
                          selectedSellingPlan.image.altText ||
                          selectedSellingPlan.name
                        }
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-gray-300"
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
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="font-heading text-lg uppercase text-gray-900 leading-tight">
                      {selectedSellingPlan.name}
                    </div>
                    <div className="text-base text-gray-600">
                      <p>
                        {
                          getFrequencyInfo(selectedSellingPlan)
                            .deliveriesPerYear
                        }{" "}
                        deliveries per year
                      </p>
                      <p>
                        Every{" "}
                        {getFrequencyInfo(
                          selectedSellingPlan,
                        ).intervalText.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SelectionSummaryCard>
          </div>

          {/* Wine Selection */}
          <SelectionSummaryCard
            title="Wine Selection"
            selection={selectedProducts.length > 0 ? selectedProducts : null}
            onEdit={() => {
              onEditWines?.();
              updateState({ currentStep: 3 });
            }}
          >
            {selectedProducts.length > 0 ? (
              <div className="space-y-2">
                <div>
                  {selectedProducts.map((product) => (
                    <div
                      key={product.productVariant.id}
                      className="flex items-center py-4 border-b border-gray-100 last:border-0"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 mr-4 shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                        {product.productVariant.productImage ? (
                          <Image
                            src={product.productVariant.productImage}
                            alt={product.productVariant.productTitle}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 pr-4">
                        <div className="font-heading text-base text-gray-900">
                          {product.productVariant.productTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const discount = getDiscountPercentage(product);
                            return (
                              <>
                                {discount > 0 && (
                                  <span className="text-sm text-gray-400 line-through">
                                    $
                                    {product.productVariant.retailPrice.toFixed(
                                      2,
                                    )}
                                  </span>
                                )}
                                <span className="text-base font-medium text-gray-900">
                                  $
                                  {(
                                    (product.calculatedPrice || 0) /
                                    product.quantity
                                  ).toFixed(2)}
                                  {discount > 0 && "/each"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium text-gray-900">
                          ×{product.quantity}
                        </div>
                        <div className="text-lg text-gray-900 mt-1">
                          ${(product.calculatedPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 mt-2 text-base text-gray-900 border-t border-gray-100 font-medium">
                  Total items:{" "}
                  {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}{" "}
                  bottles
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No wines selected</p>
            )}
          </SelectionSummaryCard>

          {/* Add-ons Selection */}
          {selectedAddOns.length > 0 && (
            <SelectionSummaryCard
              title="Add-on Products"
              selection={selectedAddOns}
              onEdit={() => {
                onEditAddOns?.();
                updateState({ currentStep: 4 });
              }}
              optional={true}
            >
              <div className="space-y-2">
                <div>
                  {selectedAddOns.map((product) => (
                    <div
                      key={product.productVariant.id}
                      className="flex items-center py-4 border-b border-gray-100 last:border-0"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 mr-4 shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-200">
                        {product.productVariant.productImage ? (
                          <Image
                            src={product.productVariant.productImage}
                            alt={product.productVariant.productTitle}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <AddOnIcon />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 pr-4">
                        <div className="font-heading text-base text-gray-900">
                          {product.productVariant.productTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const discount = getDiscountPercentage(product);
                            return (
                              <>
                                {discount > 0 && (
                                  <span className="text-sm text-gray-400 line-through">
                                    $
                                    {product.productVariant.retailPrice.toFixed(
                                      2,
                                    )}
                                  </span>
                                )}
                                <span className="text-base font-medium text-gray-900">
                                  $
                                  {(
                                    (product.calculatedPrice || 0) /
                                    product.quantity
                                  ).toFixed(2)}
                                  {discount > 0 && "/each"}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium text-gray-900">
                          ×{product.quantity}
                        </div>
                        <div className="text-lg text-gray-900 mt-1">
                          ${(product.calculatedPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 mt-2 text-base text-gray-900 border-t border-gray-100 font-medium">
                  Total add-ons:{" "}
                  {selectedAddOns.reduce((sum, p) => sum + p.quantity, 0)} items
                </div>
              </div>
            </SelectionSummaryCard>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-8 sticky top-24 shadow-sm">
            <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-8 border-b pb-4">
              Pricing Summary
            </h3>

            <div className="space-y-3">
              {/* Original Subtotal with Discount */}
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between items-center pb-2">
                  <span className="text-base text-gray-500">
                    Original Price
                  </span>
                  <span className="text-base text-gray-500 line-through">
                    ${pricing.originalSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Discount Amount */}
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-[#d4820a] font-medium">
                    Discount
                  </span>
                  <span className="text-base font-medium text-[#d4820a]">
                    -${pricing.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Subscription Total */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-base text-gray-600">
                  Wine Subscription
                </span>
                <span className="text-base font-medium text-gray-900">
                  ${pricing.subscriptionTotal.toFixed(2)}
                </span>
              </div>

              {/* Add-ons Total */}
              {pricing.addOnTotal > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-base text-gray-600">Add-ons</span>
                  <span className="text-base font-medium text-gray-900">
                    ${pricing.addOnTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-end pt-3">
                <span className="font-heading text-xl text-gray-900">
                  Total
                </span>
                <span className="font-heading text-3xl text-gray-900 leading-normal">
                  ${pricing.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                variant="primary"
                onClick={handleCheckout}
                disabled={isSubmitting}
                loading={isSubmitting}
                animate={false}
                className={cn(
                  "w-full p-2.5 text-lg tracking-normal mt-3 shadow-sm font-heading rounded",
                  !isSubmitting && "hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                Checkout
              </Button>

              {/* Sign-up Offer */}
              {/* {showSignUpOffer && (
                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  className="w-full mt-3 py-3 px-6 bg-[#f5a623]/10 text-[#d4820a] text-sm font-bold uppercase tracking-wide hover:bg-[#f5a623]/20 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🎉</span> View Special Offer
                </button>
              )} */}
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
            // console.log("Promotional offer accepted");
          }}
          onDeclineOffer={() => {
            // console.log("Promotional offer declined");
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
  selection: any;
  onEdit: () => void;
  optional?: boolean;
  children: React.ReactNode;
}

function SelectionSummaryCard({
  title,
  selection,
  onEdit,
  optional = false,
  children,
}: SelectionSummaryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 w-full hover:border-[#f5a623]/40 transition-all duration-300 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900">
            {title}
            {optional && (
              <span className="text-xs text-gray-400 font-sans font-bold ml-3 capitalize tracking-normal">
                (Optional)
              </span>
            )}
          </h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[#d4820a] hover:text-[#b5700a] transition-colors"
          aria-label="Edit"
        >
          <EditIcon />
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
