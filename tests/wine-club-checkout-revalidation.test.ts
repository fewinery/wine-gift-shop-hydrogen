import { expect, test } from "@playwright/test";
import { shouldRevalidate } from "../app/routes/wine-clubs/detail";

test.describe("wine club checkout revalidation", () => {
  test("skips loader revalidation after checkout creation succeeds", () => {
    const result = shouldRevalidate({
      actionResult: {
        checkoutUrl: "https://winegiftshop.com/checkouts/test",
      },
      defaultShouldRevalidate: true,
      formMethod: "POST",
    } as Parameters<typeof shouldRevalidate>[0]);

    expect(result).toBe(false);
  });

  test("keeps the router default for failed checkout actions", () => {
    const result = shouldRevalidate({
      actionResult: { error: "Unable to create checkout" },
      defaultShouldRevalidate: true,
      formMethod: "POST",
    } as Parameters<typeof shouldRevalidate>[0]);

    expect(result).toBe(true);
  });

  test("keeps the router default for normal navigations", () => {
    const result = shouldRevalidate({
      defaultShouldRevalidate: true,
    } as Parameters<typeof shouldRevalidate>[0]);

    expect(result).toBe(true);
  });
});
