import type { AppLoadContext } from "react-router";
import type { SavedAddress } from "~/utils/multi-recipient";

/**
 * The shopper's saved addresses, for pages outside the account area that
 * offer them as a shortcut - the multi-recipient cart is the first.
 *
 * It lives under routes/account because that is the only folder codegen
 * reads against the Customer Account schema; the same query anywhere else
 * would be checked against the Storefront schema and fail.
 */
const SAVED_ADDRESSES_QUERY = `#graphql
  query SavedAddresses {
    customer {
      addresses(first: 50) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          zip
          territoryCode
          phoneNumber
        }
      }
    }
  }
` as const;

interface SavedAddressNode {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  zoneCode?: string | null;
  zip?: string | null;
  territoryCode?: string | null;
  phoneNumber?: string | null;
}

interface SavedAddressesResult {
  customer?: {
    addresses?: { nodes?: SavedAddressNode[] | null } | null;
  } | null;
}

/**
 * Never throws and never redirects. A guest, an expired session and a failed
 * lookup all come back as "no saved addresses", because a shortcut that is
 * unavailable must not take the page it decorates down with it.
 */
export async function loadSavedAddresses(
  context: AppLoadContext,
): Promise<{ isLoggedIn: boolean; addresses: SavedAddress[] }> {
  try {
    if (!(await context.customerAccount.isLoggedIn())) {
      return { isLoggedIn: false, addresses: [] };
    }
    const { data } = await context.customerAccount.query<SavedAddressesResult>(
      SAVED_ADDRESSES_QUERY,
    );
    const nodes = data?.customer?.addresses?.nodes ?? [];
    const addresses = nodes
      // Wine ships within the United States only, and the recipient form has
      // no country field, so an address elsewhere could not be used anyway.
      .filter((node) => node?.address1 && node.territoryCode === "US")
      .map((node) => ({
        id: node.id,
        firstName: node.firstName ?? "",
        lastName: node.lastName ?? "",
        company: node.company ?? "",
        address1: node.address1 ?? "",
        address2: node.address2 ?? "",
        city: node.city ?? "",
        state: node.zoneCode ?? "",
        zip: node.zip ?? "",
        phone: node.phoneNumber ?? "",
      }));
    return { isLoggedIn: true, addresses };
  } catch {
    return { isLoggedIn: false, addresses: [] };
  }
}

const CUSTOMER_ID_QUERY = `#graphql
  query MultiRecipientCustomerId {
    customer {
      id
    }
  }
` as const;

/**
 * The logged-in shopper's customer id, or null for a guest. Like the saved
 * addresses lookup it never throws: pricing an order must still work when
 * the account service is briefly unreachable.
 */
export async function loadCustomerId(
  context: AppLoadContext,
): Promise<string | null> {
  try {
    if (!(await context.customerAccount.isLoggedIn())) {
      return null;
    }
    const { data } = await context.customerAccount.query<{
      customer?: { id?: string | null } | null;
    }>(CUSTOMER_ID_QUERY);
    return data?.customer?.id ?? null;
  } catch {
    return null;
  }
}
