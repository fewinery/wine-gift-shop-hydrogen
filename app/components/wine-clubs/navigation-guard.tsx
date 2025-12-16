import type React from "react";
import { useCallback, useEffect } from "react";
import type { WineClubFormState } from "./selection-wizard";

/**
 * Navigation Guard Component
 *
 * @description Prevents accidental navigation away from wine club selection
 * Shows confirmation dialog when user has unsaved selections
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Acceptance: Handle edge case: Navigate away mid-selection (T040)
 */

export interface NavigationGuardProps {
  /** Current wizard state */
  state: WineClubFormState;

  /** Whether navigation guard is enabled */
  enabled?: boolean;

  /** Custom confirmation message */
  message?: string;

  /** Callback when navigation is blocked */
  onNavigationBlocked?: () => void;

  /** Callback when user tries to navigate away */
  onSave?: () => Promise<void>;
}

export default function NavigationGuard({
  state,
  enabled = true,
  message = "You have unsaved wine club selections. Are you sure you want to leave?",
  onNavigationBlocked,
  onSave,
}: NavigationGuardProps) {
  const hasSelections = useCallback((): boolean => {
    return !!(
      state.selectedCaseSize ||
      state.selectedSellingPlan ||
      state.selectedProducts.length > 0
    );
  }, [state]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Handle browser navigation (back/forward buttons, refresh)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasSelections()) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    // Handle in-app navigation (React Router, etc.)
    const handleRouteChange = () => {
      if (hasSelections()) {
        onNavigationBlocked?.();
        return false; // Block navigation
      }
      return true; // Allow navigation
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Custom event for React Router navigation
    window.addEventListener("wineclub:navigate", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("wineclub:navigate", handleRouteChange);
    };
  }, [enabled, hasSelections, message, onNavigationBlocked]);

  // This component doesn't render anything
  return null;
}

// ============================================================================
// Navigation Guard Hook
// ============================================================================

/**
 * Hook for handling navigation away from wine club selection
 *
 * @param state - Current wizard state
 * @param options - Configuration options
 * @returns Navigation control functions
 */
export function useNavigationGuard(
  state: WineClubFormState,
  options: {
    enabled?: boolean;
    message?: string;
    onSave?: () => Promise<void>;
  } = {},
) {
  const { enabled = true, message, onSave } = options;

  const hasSelections = useCallback((): boolean => {
    return !!(
      state.selectedCaseSize ||
      state.selectedSellingPlan ||
      state.selectedProducts.length > 0
    );
  }, [state]);

  const confirmNavigation = useCallback(async (): Promise<boolean> => {
    if (!(enabled && hasSelections())) {
      return true;
    }

    const confirmMessage =
      message ||
      "You have unsaved wine club selections. Are you sure you want to leave?";

    // Show confirmation dialog
    const confirmed = window.confirm(confirmMessage);

    // If confirmed and onSave is provided, try to save selections
    if (confirmed && onSave) {
      try {
        await onSave();
      } catch (error) {
        console.error("Failed to save selections:", error);
        // Still allow navigation even if save fails
      }
    }

    return confirmed;
  }, [enabled, hasSelections, message, onSave]);

  const navigateWithConfirmation = useCallback(
    async (navigate: () => void) => {
      const canNavigate = await confirmNavigation();
      if (canNavigate) {
        navigate();
      }
    },
    [confirmNavigation],
  );

  return {
    hasSelections,
    confirmNavigation,
    navigateWithConfirmation,
  };
}

// ============================================================================
// Route Change Detector Component
// ============================================================================

interface RouteChangeDetectorProps {
  onRouteChange: (to: string) => boolean; // Return false to block navigation
  children: React.ReactNode;
}

/**
 * Component that detects route changes and allows blocking navigation
 */
export function RouteChangeDetector({
  onRouteChange,
  children,
}: RouteChangeDetectorProps) {
  useEffect(() => {
    // Override pushState and replaceState to detect navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (
      state: any,
      title: string,
      url?: string | URL | null,
    ) {
      if (url && !onRouteChange(url.toString())) {
        return; // Block navigation
      }
      return originalPushState.call(this, state, title, url);
    };

    history.replaceState = function (
      state: any,
      title: string,
      url?: string | URL | null,
    ) {
      if (url && !onRouteChange(url.toString())) {
        return; // Block navigation
      }
      return originalReplaceState.call(this, state, title, url);
    };

    // Listen for popstate events (back/forward buttons)
    const handlePopState = (event: PopStateEvent) => {
      if (!onRouteChange(window.location.href)) {
        event.preventDefault();
        history.pushState(event.state, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onRouteChange]);

  return <>{children}</>;
}

// ============================================================================
// Session Storage Utilities
// ============================================================================

/**
 * Save wizard state to session storage for recovery
 */
export function saveWizardState(
  state: WineClubFormState,
  wineClubId: string,
): void {
  try {
    const data = {
      state,
      wineClubId,
      timestamp: Date.now(),
    };
    sessionStorage.setItem("wineclub-wizard-state", JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save wizard state to session storage:", error);
  }
}

/**
 * Load wizard state from session storage
 */
export function loadWizardState(wineClubId: string): WineClubFormState | null {
  try {
    const data = sessionStorage.getItem("wineclub-wizard-state");
    if (!data) return null;

    const parsed = JSON.parse(data) as {
      state: WineClubFormState;
      wineClubId: string;
      timestamp: number;
    };

    // Check if data is for the same wine club and not too old (24 hours)
    const isSameClub = parsed.wineClubId === wineClubId;
    const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000; // 24 hours

    if (isSameClub && isRecent) {
      return parsed.state;
    }

    // Clear old data
    sessionStorage.removeItem("wineclub-wizard-state");
    return null;
  } catch (error) {
    console.warn("Failed to load wizard state from session storage:", error);
    return null;
  }
}

/**
 * Clear saved wizard state from session storage
 */
export function clearWizardState(): void {
  try {
    sessionStorage.removeItem("wineclub-wizard-state");
  } catch (error) {
    console.warn("Failed to clear wizard state from session storage:", error);
  }
}
