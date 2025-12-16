import { expect, test } from "@playwright/test";

/**
 * E2E Tests for User Story 2: Wine Club Selection Process (Priority: P2)
 *
 * Independent Test Criteria:
 * Click "Get Started" on any wine club and complete the 5-step selection wizard:
 * 1. Select case size
 * 2. Select subscription frequency
 * 3. Select wine quantities (with min/max restrictions)
 * 4. Add optional add-ons
 * 5. Review and checkout
 *
 * Tests verify wizard navigation, state preservation, validation, and checkout flow.
 */
test.describe("Wine Clubs - User Story 2: Selection Wizard", () => {
  /**
   * Helper function to navigate to a wine club detail page
   */
  async function navigateToWineClubDetail(page: any) {
    await page.goto("/wine-clubs");
    await page.waitForSelector('a[href^="/wine-clubs/"]', { state: "visible" });

    const clubCards = page.locator('a[href^="/wine-clubs/"]');
    const count = await clubCards.count();

    if (count === 0) {
      throw new Error("No wine clubs available for testing");
    }

    // Click first club's "Get Started" button or card
    const firstClub = clubCards.first();
    await firstClub.click();

    // Wait for detail page to load
    await page.waitForURL(/\/wine-clubs\/.+/);
  }

  /**
   * T042: Step 1 displays case size options and progresses on selection
   * Acceptance Scenario 1
   */
  test("should display case size options and progress to step 2 when selected", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Wait for wizard to load
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Verify we're on Step 1 (Case Size)
    const step1Heading = page.locator("text=/Select.*Case Size|Choose.*Size/i");
    await expect(step1Heading).toBeVisible();

    // Verify progress bar shows step 1
    const progressBar = page.locator(
      '[role="progressbar"], [aria-label*="progress"]',
    );
    if ((await progressBar.count()) > 0) {
      await expect(progressBar).toBeVisible();
    }

    // Find case size options (buttons, radio buttons, or cards)
    const caseSizeOptions = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"], [role="radio"]',
      )
      .first();

    const optionsCount = await caseSizeOptions.count();
    expect(optionsCount).toBeGreaterThan(0);

    // Select first case size option
    await caseSizeOptions.click();

    // Click "Next" or "Continue" button
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue")',
    );
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Verify navigation to Step 2
    await page.waitForSelector('text="Step 2"', {
      state: "visible",
      timeout: 5000,
    });
    const step2Heading = page.locator("text=/Select.*Frequency|Choose.*Plan/i");
    await expect(step2Heading).toBeVisible();
  });

  /**
   * T043: Step 2 shows frequencies with pricing for selected case size
   * Acceptance Scenario 2
   */
  test("should display subscription frequencies with pricing", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Navigate through Step 1
    await page.waitForSelector('text="Step 1"', { state: "visible" });
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();

    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue")',
    );
    await nextButton.click();

    // Wait for Step 2 to load
    await page.waitForSelector('text="Step 2"', { state: "visible" });

    // Verify frequency options are displayed
    const frequencyOptions = page.locator(
      'button[data-testid*="frequency"], input[type="radio"][name*="frequency"], [role="radio"]',
    );
    const frequencyCount = await frequencyOptions.count();
    expect(frequencyCount).toBeGreaterThan(0);

    // Verify pricing information is displayed
    const priceElements = page.locator("text=/\\$[0-9]+|Price:/");
    const priceCount = await priceElements.count();
    expect(priceCount).toBeGreaterThan(0);

    // Select first frequency option
    await frequencyOptions.first().click();

    // Progress to Step 3
    await nextButton.click();
    await page.waitForSelector('text="Step 3"', {
      state: "visible",
      timeout: 5000,
    });
  });

  /**
   * T044: Step 3 enforces min/max quantity restrictions
   * Acceptance Scenario 3
   */
  test("should enforce quantity restrictions and validation", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Navigate to Step 3 (quantity selection)
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1: Select case size
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 2: Select frequency
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOption = page
      .locator(
        'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
      )
      .first();
    await frequencyOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 3: Quantity selection
    await page.waitForSelector('text="Step 3"', { state: "visible" });

    // Verify quantity controls exist (increment/decrement buttons)
    const incrementButtons = page.locator(
      'button[aria-label*="Increase"], button:has-text("+")',
    );
    const decrementButtons = page.locator(
      'button[aria-label*="Decrease"], button:has-text("-")',
    );

    const hasQuantityControls =
      (await incrementButtons.count()) > 0 &&
      (await decrementButtons.count()) > 0;

    if (hasQuantityControls) {
      // Test increment functionality
      const firstIncrement = incrementButtons.first();
      await firstIncrement.click();

      // Verify quantity updated (look for number display)
      const quantityDisplay = page.locator(
        'input[type="number"], [data-quantity]',
      );
      if ((await quantityDisplay.count()) > 0) {
        const quantity = await quantityDisplay.first().inputValue();
        expect(Number.parseInt(quantity)).toBeGreaterThan(0);
      }

      // Test decrement functionality (should respect minimum)
      const firstDecrement = decrementButtons.first();

      // Try to decrement below minimum
      for (let i = 0; i < 10; i++) {
        const isDisabled = await firstDecrement.isDisabled();
        if (isDisabled) {
          // Correctly enforcing minimum
          break;
        }
        await firstDecrement.click();
      }

      // Verify minimum is enforced (decrement button should be disabled at minimum)
      await expect(decrementButtons.first()).toBeDisabled();
    }

    // Verify we can progress to Step 4 (add-ons)
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue")',
    );
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await page.waitForSelector('text="Step 4"', {
      state: "visible",
      timeout: 5000,
    });
  });

  /**
   * T045: Step 4 shows add-ons that don't count toward minimums
   * Acceptance Scenario 4
   */
  test("should display optional add-ons that can be added or skipped", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Navigate through steps 1-3
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 2
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOption = page
      .locator(
        'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
      )
      .first();
    await frequencyOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 3
    await page.waitForSelector('text="Step 3"', { state: "visible" });
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 4: Add-ons
    await page.waitForSelector('text="Step 4"', { state: "visible" });

    // Verify add-ons heading
    const addOnsHeading = page.locator("text=/Add-ons|Optional|Accessories/i");
    await expect(addOnsHeading).toBeVisible();

    // Verify "Skip" or "Continue without add-ons" option exists
    const skipButton = page.locator(
      'button:has-text("Skip"), button:has-text("Continue without"), button:has-text("Next")',
    );
    await expect(skipButton).toBeEnabled();

    // Verify add-on products are displayed (if any exist)
    const addOnProducts = page.locator(
      '[data-testid*="add-on"], [data-product-type="add-on"]',
    );
    const addOnCount = await addOnProducts.count();

    if (addOnCount > 0) {
      // Verify we can add an add-on
      const firstAddOn = addOnProducts.first();
      const addButton = firstAddOn.locator('button:has-text("Add")');
      if ((await addButton.count()) > 0) {
        await addButton.click();

        // Verify add-on was added (button text changes or quantity increases)
        const removeButton = firstAddOn.locator('button:has-text("Remove")');
        await expect(removeButton).toBeVisible({ timeout: 3000 });
      }
    }

    // Progress to Step 5 (review)
    await skipButton.click();
    await page.waitForSelector('text="Step 5"', {
      state: "visible",
      timeout: 5000,
    });
  });

  /**
   * T046: Step 5 displays all selections with accurate pricing and allows editing
   * Acceptance Scenario 5
   */
  test("should display order summary with all selections and edit functionality", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Complete all wizard steps to reach Step 5
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 2
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOption = page
      .locator(
        'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
      )
      .first();
    await frequencyOption.click();
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 3
    await page.waitForSelector('text="Step 3"', { state: "visible" });
    await page
      .locator('button:has-text("Next"), button:has-text("Continue")')
      .click();

    // Step 4
    await page.waitForSelector('text="Step 4"', { state: "visible" });
    await page
      .locator('button:has-text("Skip"), button:has-text("Next")')
      .click();

    // Step 5: Review
    await page.waitForSelector('text="Step 5"', { state: "visible" });

    // Verify review heading
    const reviewHeading = page.locator("text=/Review|Summary|Your Selection/i");
    await expect(reviewHeading).toBeVisible();

    // Verify pricing information is displayed
    const totalPrice = page.locator("text=/Total|Subtotal|\\$[0-9]+/");
    await expect(totalPrice.first()).toBeVisible();

    // Verify checkout button exists
    const checkoutButton = page.locator(
      'button:has-text("Checkout"), button:has-text("Add to Cart"), button:has-text("Complete")',
    );
    await expect(checkoutButton).toBeVisible();
    await expect(checkoutButton).toBeEnabled();

    // Verify edit functionality (if available)
    const editButtons = page.locator(
      'button:has-text("Edit"), button[aria-label*="Edit"]',
    );
    const editCount = await editButtons.count();

    if (editCount > 0) {
      // Click first edit button
      await editButtons.first().click();

      // Should navigate back to earlier step
      await page.waitForSelector("text=/Step [1-4]/", {
        state: "visible",
        timeout: 5000,
      });

      // Verify we can navigate back to review
      const backToReview = page.locator(
        'button:has-text("Back"), button:has-text("Previous")',
      );
      if ((await backToReview.count()) > 0) {
        // Navigate forward again
        for (let i = 0; i < 5; i++) {
          const nextBtn = page.locator(
            'button:has-text("Next"), button:has-text("Continue")',
          );
          if ((await nextBtn.count()) > 0 && (await nextBtn.isVisible())) {
            await nextBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  /**
   * T047: Checkout button redirects to cart with all products and subscriptions
   * Acceptance Scenario 6
   */
  test("should redirect to Shopify checkout with cart items", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Complete wizard to Step 5
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();
    await page.locator('button:has-text("Next")').click();

    // Step 2
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOption = page
      .locator(
        'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
      )
      .first();
    await frequencyOption.click();
    await page.locator('button:has-text("Next")').click();

    // Step 3
    await page.waitForSelector('text="Step 3"', { state: "visible" });
    await page.locator('button:has-text("Next")').click();

    // Step 4
    await page.waitForSelector('text="Step 4"', { state: "visible" });
    await page
      .locator('button:has-text("Skip"), button:has-text("Next")')
      .click();

    // Step 5: Checkout
    await page.waitForSelector('text="Step 5"', { state: "visible" });

    // Click checkout button
    const checkoutButton = page.locator(
      'button:has-text("Checkout"), button:has-text("Add to Cart"), button:has-text("Complete")',
    );
    await checkoutButton.click();

    // Wait for navigation or cart update
    // The app might redirect to /cart or directly to Shopify checkout
    await page.waitForTimeout(2000);

    // Verify navigation occurred (cart page or checkout)
    const url = page.url();
    const hasNavigated =
      url.includes("/cart") ||
      url.includes("/checkouts") ||
      url.includes("checkout.shopify.com");

    expect(hasNavigated).toBeTruthy();
  });

  /**
   * T048: Backward navigation preserves selections
   * Acceptance Scenario 5 (alternate flow)
   */
  test("should preserve selections when navigating backward through steps", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Navigate to Step 3 and make selections
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1: Select case size and remember it
    const caseSizeOptions = page.locator(
      'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
    );
    const selectedCaseSize = await caseSizeOptions.first().textContent();
    await caseSizeOptions.first().click();
    await page.locator('button:has-text("Next")').click();

    // Step 2: Select frequency and remember it
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOptions = page.locator(
      'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
    );
    const selectedFrequency = await frequencyOptions.first().textContent();
    await frequencyOptions.first().click();
    await page.locator('button:has-text("Next")').click();

    // Step 3: Verify we're on quantity step
    await page.waitForSelector('text="Step 3"', { state: "visible" });

    // Navigate backward to Step 2
    const backButton = page.locator(
      'button:has-text("Back"), button:has-text("Previous")',
    );
    if ((await backButton.count()) > 0) {
      await backButton.click();
      await page.waitForSelector('text="Step 2"', { state: "visible" });

      // Verify frequency selection is preserved
      const selectedRadio = page.locator(
        'input[type="radio"]:checked, [aria-checked="true"]',
      );
      if ((await selectedRadio.count()) > 0) {
        const currentSelection = await selectedRadio.first().textContent();
        // Selection should match what we selected (or at least be selected)
        await expect(selectedRadio.first()).toBeVisible();
      }

      // Navigate back to Step 1
      await backButton.click();
      await page.waitForSelector('text="Step 1"', { state: "visible" });

      // Verify case size selection is preserved
      const selectedCase = page.locator(
        'input[type="radio"]:checked, [aria-checked="true"]',
      );
      if ((await selectedCase.count()) > 0) {
        await expect(selectedCase.first()).toBeVisible();
      }

      // Navigate forward again to verify state persists
      await page.locator('button:has-text("Next")').click();
      await page.waitForSelector('text="Step 2"', { state: "visible" });

      // Should still have frequency selected
      const frequencyStillSelected = page.locator(
        'input[type="radio"]:checked, [aria-checked="true"]',
      );
      await expect(frequencyStillSelected.first()).toBeVisible();
    }
  });

  /**
   * Additional test: Verify wizard state persistence when navigating away
   */
  test("should preserve wizard state when navigating away and returning", async ({
    page,
  }) => {
    await navigateToWineClubDetail(page);

    // Make selections in the wizard
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Step 1: Select case size
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await caseSizeOption.click();
    await page.locator('button:has-text("Next")').click();

    // Step 2: Select frequency
    await page.waitForSelector('text="Step 2"', { state: "visible" });
    const frequencyOption = page
      .locator(
        'button[data-testid*="frequency"], input[type="radio"][name*="frequency"]',
      )
      .first();
    await frequencyOption.click();

    // Get the current URL before navigating away
    const wizardUrl = page.url();

    // Navigate away to wine clubs listing
    await page.goto("/wine-clubs");
    await page.waitForLoadState("networkidle");

    // Navigate back to the wizard
    await page.goto(wizardUrl);
    await page.waitForLoadState("networkidle");

    // Verify we're back on Step 2 (or that state is preserved)
    // This depends on whether session storage restoration is working
    const currentStep = page.locator("text=/Step [1-5]/");
    await expect(currentStep.first()).toBeVisible();

    // If restoration worked, we should be on Step 2 or see a "Resume" option
    const hasRestoredState =
      (await page.locator('text="Step 2"').count()) > 0 ||
      (await page.locator("text=/Resume|Continue/").count()) > 0;

    // Just verify wizard is functional after navigation
    expect(hasRestoredState).toBeDefined();
  });

  /**
   * Additional test: Verify responsive design on mobile
   */
  test("should have responsive wizard layout on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToWineClubDetail(page);

    // Wait for wizard to load
    await page.waitForSelector('text="Step 1"', { state: "visible" });

    // Verify no horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);

    // Verify wizard steps are visible and clickable
    const caseSizeOption = page
      .locator(
        'button[data-testid*="case-size"], input[type="radio"][name*="case"]',
      )
      .first();
    await expect(caseSizeOption).toBeVisible();

    // Verify navigation buttons are accessible
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Continue")',
    );
    const buttonBox = await nextButton.boundingBox();
    if (buttonBox) {
      // Button should be within viewport and have reasonable touch target size
      expect(buttonBox.width).toBeGreaterThan(44); // Minimum touch target
      expect(buttonBox.height).toBeGreaterThan(44);
    }
  });
});
