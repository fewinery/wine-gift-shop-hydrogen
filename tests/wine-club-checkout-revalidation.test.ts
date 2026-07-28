import { expect, test } from "@playwright/test";
import { shouldRevalidateAfterCheckout } from "../app/utils/checkout-revalidation";

test.describe("wine club checkout revalidation", () => {
  test("skips loader revalidation after checkout creation succeeds", () => {
    const result = shouldRevalidateAfterCheckout({
      actionResult: {
        checkoutUrl: "https://winegiftshop.com/checkouts/test",
      },
      defaultShouldRevalidate: true,
      formMethod: "POST",
    } as Parameters<typeof shouldRevalidateAfterCheckout>[0]);

    expect(result).toBe(false);
  });

  test("keeps the router default for failed checkout actions", () => {
    const result = shouldRevalidateAfterCheckout({
      actionResult: { error: "Unable to create checkout" },
      defaultShouldRevalidate: true,
      formMethod: "POST",
    } as Parameters<typeof shouldRevalidateAfterCheckout>[0]);

    expect(result).toBe(true);
  });

  test("keeps the router default for normal navigations", () => {
    const result = shouldRevalidateAfterCheckout({
      defaultShouldRevalidate: true,
    } as Parameters<typeof shouldRevalidateAfterCheckout>[0]);

    expect(result).toBe(true);
  });
});
