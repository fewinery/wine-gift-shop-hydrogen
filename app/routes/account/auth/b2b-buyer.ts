import type { AppLoadContext } from "react-router";
import { isB2BEnabled } from "~/.server/b2b";

export type B2BLocationOption = {
  id: string;
  locationName: string;
  companyName: string;
};

/**
 * The company locations this customer may buy for, straight from the
 * Customer Account API. This list is the only source of truth for which
 * location a customer can pick — a location id from the browser is never
 * trusted unless it is in here.
 */
export async function fetchB2BLocations(
  context: AppLoadContext,
): Promise<B2BLocationOption[]> {
  const { data, errors } =
    await context.customerAccount.query<CustomerCompanyLocations>(
      CUSTOMER_COMPANY_LOCATIONS_QUERY,
    );
  if (errors?.length) {
    throw new Error(
      `[b2b] company locations query failed: ${errors[0].message}`,
    );
  }

  const locations = (data?.customer?.companyContacts?.nodes ?? []).flatMap(
    (contact) =>
      contact.locations.nodes.map((location) => ({
        id: location.id,
        locationName: location.name,
        companyName: contact.company?.name ?? "",
      })),
  );
  return locations.filter(
    (location, index) =>
      locations.findIndex((other) => other.id === location.id) === index,
  );
}

/** Make this location the active one for the session. */
export function selectB2BLocation(
  context: AppLoadContext,
  location: B2BLocationOption,
): void {
  context.customerAccount.setBuyer({ companyLocationId: location.id });
  // Names for the "Ordering for" bar, so it needs no extra API call.
  context.session.set("b2bLocation", {
    companyName: location.companyName,
    locationName: location.locationName,
  });
}

/**
 * Move an existing cart to the active location, so its prices and payment
 * terms follow the location. Carts created later pick it up automatically.
 */
export async function syncCartLocation(context: AppLoadContext): Promise<void> {
  const buyer = await context.customerAccount.getBuyer();
  if (!(buyer?.companyLocationId && context.cart.getCartId())) {
    return;
  }
  try {
    await context.cart.updateBuyerIdentity({
      companyLocationId: buyer.companyLocationId,
    });
  } catch (error) {
    console.error("[b2b] could not move the cart to the location", error);
  }
}

/**
 * Called right after a successful login. On a B2B storefront, looks up the
 * company locations this customer is a contact for:
 * - one location: it becomes the active location straight away
 * - several: none is chosen yet; the customer picks one on /account/locations
 * - none: a regular customer
 */
export async function resolveB2BBuyer(context: AppLoadContext): Promise<void> {
  if (!isB2BEnabled(context.env)) {
    return;
  }

  // Start clean so a previous customer's location can never carry over.
  context.session.unset("buyer");
  context.session.unset("b2bLocation");
  context.session.unset("b2bLocationCount");

  try {
    const locations = await fetchB2BLocations(context);
    context.session.set("b2bLocationCount", locations.length);
    if (locations.length === 1) {
      selectB2BLocation(context, locations[0]);
      await syncCartLocation(context);
    }
  } catch (error) {
    console.error("[b2b] could not resolve company location", error);
  }
}

type CustomerCompanyLocations = {
  customer: {
    companyContacts: {
      nodes: {
        company: { name: string } | null;
        locations: { nodes: { id: string; name: string }[] };
      }[];
    };
  };
};

const CUSTOMER_COMPANY_LOCATIONS_QUERY = `#graphql
  query CustomerCompanyLocations {
    customer {
      companyContacts(first: 10) {
        nodes {
          company {
            name
          }
          locations(first: 100) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
` as const;
