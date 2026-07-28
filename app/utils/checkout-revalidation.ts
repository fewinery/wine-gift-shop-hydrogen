import type { ShouldRevalidateFunctionArgs } from "react-router";

export function shouldRevalidateAfterCheckout({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (actionResult?.checkoutUrl) {
    return false;
  }

  return defaultShouldRevalidate;
}
