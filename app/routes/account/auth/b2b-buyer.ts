import type { AppLoadContext } from "react-router";
import { isB2BEnabled } from "~/.server/b2b";

/**
 * Called right after a successful login. On a B2B storefront, looks up the
 * company locations this customer is a contact for and stores the location
 * in the session, so product queries can run in that location's catalog.
 *
 * The location id always comes from this Customer Account API response,
 * never from the browser.
 */
export async function resolveB2BBuyer(context: AppLoadContext): Promise<void> {
  if (!isB2BEnabled(context.env)) {
    return;
  }

  // Start clean so a previous customer's location can never carry over.
  context.session.unset("buyer");
  context.session.unset("b2bLocation");

  try {
    const { data, errors } =
      await context.customerAccount.query<CustomerCompanyLocations>(
        CUSTOMER_COMPANY_LOCATIONS_QUERY,
      );
    if (errors?.length) {
      console.error("[b2b] company locations query failed", errors);
      return;
    }

    const locations = (data?.customer?.companyContacts?.nodes ?? []).flatMap(
      (contact) =>
        contact.locations.nodes.map((location) => ({
          id: location.id,
          locationName: location.name,
          companyName: contact.company?.name ?? "",
        })),
    );
    const uniqueLocations = locations.filter(
      (location, index) =>
        locations.findIndex((other) => other.id === location.id) === index,
    );

    // One location: use it. None: a regular customer. Several: needs a
    // location selector, which is not built yet, so no buyer is set.
    if (uniqueLocations.length === 1) {
      const [location] = uniqueLocations;
      context.customerAccount.setBuyer({ companyLocationId: location.id });
      // Names for the "Ordering for" bar, so it needs no extra API call.
      context.session.set("b2bLocation", {
        companyName: location.companyName,
        locationName: location.locationName,
      });
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
          locations(first: 50) {
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
