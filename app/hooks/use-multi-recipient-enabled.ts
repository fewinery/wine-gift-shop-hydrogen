import { useThemeSettings } from "@weaverse/hydrogen";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";

/**
 * Whether to offer "send to multiple recipients" on this storefront.
 *
 * Two things have to be true: the brand has switched it on in Theme
 * Settings, and the storefront has the Admin API variables the feature
 * needs. Checking both means a storefront that is switched on but not set
 * up shows shoppers nothing, never a page that cannot price or take payment.
 */
export function useMultiRecipientEnabled() {
  const { enableMultiRecipient } = useThemeSettings();
  const root = useRouteLoaderData<RootLoader>("root");
  return (
    enableMultiRecipient === true && root?.multiRecipientConfigured === true
  );
}
