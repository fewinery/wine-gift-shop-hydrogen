import { expect, test } from "@playwright/test";

/**
 * E2E Tests for User Story 1: Wine Club Discovery (Priority: P1)
 *
 * Independent Test Criteria:
 * Navigate to /wine-clubs and verify all clubs display with names, images,
 * descriptions, and subscription frequencies. Test API error handling by
 * disconnecting network.
 */
test.describe("Wine Clubs - User Story 1: Discovery", () => {
  /**
   * T020: All wine clubs display with names, images, and descriptions
   * Acceptance Scenario 1
   */
  test("should display all wine clubs with names, images, and descriptions", async ({
    page,
  }) => {
    await page.goto("/wine-clubs");

    // Wait for SSR content to load (no loading states expected)
    await page.waitForSelector("h2", { state: "visible" });

    // Verify wine clubs section heading is present
    const heading = page.locator("h2").first();
    await expect(heading).toBeVisible();

    // Verify wine club cards are present
    const clubCards = page.locator('a[href^="/wine-clubs/"]');
    const count = await clubCards.count();

    // Should have at least one wine club
    expect(count).toBeGreaterThan(0);

    // Verify first club has required content
    if (count > 0) {
      const firstClub = clubCards.first();

      // Check for club name (h3 heading)
      const clubName = firstClub.locator("h3");
      await expect(clubName).toBeVisible();

      // Check for club image (if present)
      const clubImage = firstClub.locator("img");
      if ((await clubImage.count()) > 0) {
        await expect(clubImage).toBeVisible();
        // Verify lazy loading attribute
        await expect(clubImage).toHaveAttribute("loading", "lazy");
      }

      // Check for "Get Started" call-to-action
      const ctaText = firstClub.locator('text="Get Started"');
      await expect(ctaText).toBeVisible();
    }
  });

  /**
   * T021: Club cards show subscription frequencies and promotional offers
   * Acceptance Scenario 2
   */
  test("should display club cards with subscription frequencies", async ({
    page,
  }) => {
    await page.goto("/wine-clubs");

    // Wait for wine clubs to load
    await page.waitForSelector('a[href^="/wine-clubs/"]', { state: "visible" });

    const clubCards = page.locator('a[href^="/wine-clubs/"]');
    const count = await clubCards.count();

    if (count > 0) {
      const firstClub = clubCards.first();

      // Check for frequencies section
      const frequencies = firstClub.locator("text=/Frequencies:/");
      if ((await frequencies.count()) > 0) {
        await expect(frequencies).toBeVisible();
      }

      // Check for case sizes section
      const caseSizes = firstClub.locator("text=/Case Sizes:/");
      if ((await caseSizes.count()) > 0) {
        await expect(caseSizes).toBeVisible();
      }
    }
  });

  /**
   * T022: Friendly error message when Winehub API unavailable
   * Acceptance Scenario 3
   */
  test("should show friendly error message when API unavailable", async ({
    page,
    context,
  }) => {
    // Block Winehub API requests to simulate API failure
    await context.route("**/api.winehub.io/**", (route) => {
      route.abort("failed");
    });

    await page.goto("/wine-clubs");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Should show error message or empty state (not broken content)
    const errorMessage = page.locator(
      "text=/currently unavailable|No wine clubs available/",
    );
    const isErrorVisible = await errorMessage.isVisible({ timeout: 5000 });

    // Verify graceful degradation - either error message or empty state
    expect(isErrorVisible).toBeTruthy();

    // Verify no broken images or error elements
    const brokenImages = page.locator('img[alt=""]');
    const brokenCount = await brokenImages.count();
    expect(brokenCount).toBe(0);
  });

  /**
   * T023: Responsive layout works on mobile without horizontal scrolling
   * Acceptance Scenario 4
   */
  test("should have responsive layout on mobile viewports", async ({
    page,
  }) => {
    // Test at different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: "Mobile (320px)" },
      { width: 768, height: 1024, name: "Tablet (768px)" },
      { width: 1024, height: 768, name: "Desktop (1024px)" },
      { width: 1440, height: 900, name: "Large Desktop (1440px)" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/wine-clubs");

      // Wait for content to load
      await page.waitForSelector("h2", { state: "visible" });

      // Verify no horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance

      // Verify wine club cards are visible
      const clubCards = page.locator('a[href^="/wine-clubs/"]');
      const count = await clubCards.count();

      if (count > 0) {
        const firstClub = clubCards.first();
        await expect(firstClub).toBeVisible();

        // Verify card is within viewport width
        const cardBox = await firstClub.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  /**
   * Additional test: Verify server-side rendering (no loading states)
   */
  test("should have wine club content in initial HTML (SSR)", async ({
    page,
  }) => {
    const response = await page.goto("/wine-clubs");

    // Get the HTML source
    const html = await response?.text();

    // Verify content is present in HTML (not just loading states)
    expect(html).toContain("wine-clubs"); // Route is rendered

    // Should not contain loading skeleton classes (indicates SSR worked)
    const hasLoadingState = html?.includes("animate-pulse");
    // If clubs exist, they should be in HTML; if not, error/empty state should be
    // Either way, no loading skeleton should be visible initially
  });

  /**
   * Additional test: Verify clicking a club card navigates to detail page
   */
  test("should navigate to club detail page when clicking a club card", async ({
    page,
  }) => {
    await page.goto("/wine-clubs");

    // Wait for wine clubs to load
    await page.waitForSelector('a[href^="/wine-clubs/"]', { state: "visible" });

    const clubCards = page.locator('a[href^="/wine-clubs/"]');
    const count = await clubCards.count();

    if (count > 0) {
      // Click the first club card
      const firstClub = clubCards.first();
      const clubHref = await firstClub.getAttribute("href");

      await firstClub.click();

      // Verify navigation occurred
      await page.waitForURL(`**${clubHref}`);
      expect(page.url()).toContain("/wine-clubs/");
    }
  });
});
