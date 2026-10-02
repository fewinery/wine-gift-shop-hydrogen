import type { ActionFunction, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { CustomerCreateMutation } from "storefront-api.generated";

const CUSTOMER_CREATE = `#graphql
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        firstName
        lastName
        email
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
` as const;

const ADMIN_API_VERSION = "2025-07";

// Shopify's standard customer birth date definition, the same on every store.
const BIRTH_DATE_NAMESPACE = "facts";
const BIRTH_DATE_KEY = "birth_date";

const FIND_CUSTOMER = `#graphql
  query findCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes { id }
    }
  }
`;

// "tagsAdd" is used rather than CustomerInput.tags because passing tags on
// the input OVERWRITES every tag the customer already has.
const ENRICH_CUSTOMER = `#graphql
  mutation entryFormEnrich($id: ID!, $tags: [String!]!, $input: CustomerInput!) {
    tagsAdd(id: $id, tags: $tags) {
      userErrors { field message }
    }
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

// Client-credentials tokens last 24 hours, so one is kept per worker isolate
// and reused until just before it expires instead of asking Shopify on every
// submission.
let cachedAdminToken: { token: string; expiresAt: number } | null = null;

/**
 * Resolves an Admin API access token.
 *
 * Legacy custom apps (which Shopify stopped issuing on 1 January 2026) hand
 * out a permanent token, so that is used when a store still has one. Newer
 * stores use a Dev Dashboard app instead, whose client id and secret are
 * exchanged for a 24 hour token through the client credentials grant.
 *
 * Returns null when neither is configured, which makes the whole Shopify
 * enrichment step a no-op.
 */
async function getAdminAccessToken(env: Env): Promise<string | null> {
  if (env.SHOPIFY_ADMIN_API_TOKEN) {
    return env.SHOPIFY_ADMIN_API_TOKEN;
  }

  const clientId = env.SHOPIFY_APP_CLIENT_ID;
  const clientSecret = env.SHOPIFY_APP_CLIENT_SECRET;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  if (!(clientId && clientSecret && shopDomain)) {
    return null;
  }

  if (cachedAdminToken && cachedAdminToken.expiresAt > Date.now() + 60_000) {
    return cachedAdminToken.token;
  }

  const response = await fetch(
    `https://${shopDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    },
  );

  if (!response.ok) {
    console.error(
      "Shopify client credentials grant failed",
      response.status,
      await response.text(),
    );
    return null;
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    console.error("Client credentials grant returned no access token");
    return null;
  }

  cachedAdminToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 86_399) * 1000,
  };
  return json.access_token;
}

/**
 * Adds the source tag and writes the birth date to the standard
 * facts.birth_date customer metafield.
 *
 * Needs the read_customers and write_customers scopes. When no Admin
 * credentials are configured this is a no-op, so the form keeps working on
 * storefronts that have not set any up.
 */
async function enrichShopifyCustomer({
  env,
  email,
  dateOfBirth,
  sourceTag,
}: {
  env: Env;
  email: string;
  dateOfBirth: string;
  sourceTag: string;
}): Promise<void> {
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  const adminToken = await getAdminAccessToken(env);
  if (!(adminToken && shopDomain)) {
    return;
  }

  const endpoint = `https://${shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`;
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": adminToken,
  };

  const callAdmin = async (query: string, variables: Record<string, any>) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    return (await response.json()) as any;
  };

  // The customer is always looked up by email rather than reusing the id from
  // the Storefront mutation, so existing customers are handled the same way
  // as brand new ones.
  const lookup = await callAdmin(FIND_CUSTOMER, {
    query: `email:"${email.replace(/"/g, "")}"`,
  });
  const customerId = lookup?.data?.customers?.nodes?.[0]?.id;
  if (!customerId) {
    console.error("Admin API could not find the customer just created");
    return;
  }

  const result = await callAdmin(ENRICH_CUSTOMER, {
    id: customerId,
    tags: [sourceTag],
    input: {
      id: customerId,
      metafields: [
        {
          namespace: BIRTH_DATE_NAMESPACE,
          key: BIRTH_DATE_KEY,
          type: "date",
          value: dateOfBirth,
        },
      ],
    },
  });

  const userErrors = [
    ...(result?.data?.tagsAdd?.userErrors ?? []),
    ...(result?.data?.customerUpdate?.userErrors ?? []),
  ];
  if (userErrors.length || result?.errors) {
    console.error(
      "Admin API enrichment errors",
      JSON.stringify(userErrors.length ? userErrors : result.errors),
    );
  }
}

const KLAVIYO_REVISION = "2024-10-15";
const KLAVIYO_PROFILE_UPSERT = "https://a.klaviyo.com/api/profile-import";
const KLAVIYO_SUBSCRIBE =
  "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs";

// Legal drinking age in the US. Hardcoded rather than taken from the form so
// it cannot be altered by editing the page source before submitting.
const MINIMUM_AGE = 21;

/**
 * Whole years between a date of birth and today, counting a birthday that has
 * not yet happened this year as not-yet-reached.
 */
function getAge(dateOfBirth: Date, now: Date): number {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  const formData = await request.formData();

  // HONEYPOT: bots fill it, humans never see it. Report success so the bot
  // does not learn it was caught, but do not store anything.
  if (formData.get("company")) {
    return data({ ok: true });
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const dateOfBirth = (formData.get("dateOfBirth") as string)?.trim();
  // Marks where an entry came from, so real entrants can be told apart from
  // spam in Klaviyo segments and suppression rules.
  const sourceTag =
    (formData.get("sourceTag") as string)?.trim() || "entry-form";
  // The list normally comes from the storefront's Oxygen variables, which is
  // how configuration is kept per store. The optional Studio field is only an
  // override for running a second form on the same storefront.
  const listId =
    (formData.get("listId") as string)?.trim() ||
    context.env.KLAVIYO_ENTRY_LIST_ID ||
    context.env.KLAVIYO_CAMPAIGN_LIST_ID ||
    context.env.KLAVIYO_LIST_ID;

  if (!(firstName && lastName && email && dateOfBirth)) {
    return data(
      { ok: false, errorMessage: "Please fill in every field." },
      { status: 400 },
    );
  }

  const parsedDob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(parsedDob.getTime())) {
    return data(
      { ok: false, errorMessage: "Please enter a valid date of birth." },
      { status: 400 },
    );
  }

  const age = getAge(parsedDob, new Date());
  if (age < MINIMUM_AGE) {
    return data(
      {
        ok: false,
        underAge: true,
        errorMessage: `You must be ${MINIMUM_AGE} or older to enter.`,
      },
      { status: 400 },
    );
  }

  // 1. Shopify customer. A random password is used because the entrant never
  // signs in with it; they would use password reset. Never reuse a shared
  // password here, or every entrant's account is accessible to anyone who
  // knows it.
  const { customerCreate, errors: queryErrors } =
    await context.storefront.mutate<CustomerCreateMutation>(CUSTOMER_CREATE, {
      variables: {
        input: {
          firstName,
          lastName,
          email,
          password: crypto.randomUUID(),
          acceptsMarketing: true,
        },
      },
    });

  if (queryErrors?.length) {
    return data(
      { ok: false, errorMessage: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const customerUserErrors = customerCreate?.customerUserErrors;
  // An existing customer is not a failure: they are still a valid entrant.
  const isTaken = customerUserErrors?.some(
    (e) => e.code === "TAKEN" || e.code === "CUSTOMER_DISABLED",
  );
  if (customerUserErrors?.length && !isTaken) {
    return data(
      {
        ok: false,
        errorMessage:
          customerUserErrors[0]?.message ?? "Please check your details.",
      },
      { status: 400 },
    );
  }

  // 2. Shopify tag and birth date metafield. Skipped silently when no Admin
  // API token is configured, so the form still works without one.
  try {
    await enrichShopifyCustomer({
      env: context.env,
      email,
      dateOfBirth,
      sourceTag,
    });
  } catch (error) {
    console.error("Shopify customer enrichment failed", error);
  }

  // 3. Klaviyo. Two calls are required: the subscription endpoint accepts
  // only email/phone/subscriptions, so names and date of birth have to be
  // written with a profile upsert first.
  const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
  if (apiToken && listId) {
    const headers = {
      revision: KLAVIYO_REVISION,
      Authorization: `Klaviyo-API-Key ${apiToken}`,
      "content-type": "application/vnd.api+json",
      accept: "application/vnd.api+json",
    };

    try {
      await fetch(KLAVIYO_PROFILE_UPSERT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "profile",
            attributes: {
              email,
              first_name: firstName,
              last_name: lastName,
              properties: {
                "Date of Birth": dateOfBirth,
                Birthday: dateOfBirth,
                "Signup Source": sourceTag,
              },
            },
          },
        }),
      });
    } catch (error) {
      console.error("Klaviyo profile upsert failed", error);
    }

    try {
      await fetch(KLAVIYO_SUBSCRIBE, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              custom_source: sourceTag,
              profiles: {
                data: [
                  {
                    type: "profile",
                    attributes: {
                      email,
                      subscriptions: {
                        email: { marketing: { consent: "SUBSCRIBED" } },
                      },
                    },
                  },
                ],
              },
            },
            relationships: { list: { data: { type: "list", id: listId } } },
          },
        }),
      });
    } catch (error) {
      console.error("Klaviyo subscribe failed", error);
    }
  } else {
    console.error(
      "Missing Klaviyo credentials. Token:",
      Boolean(apiToken),
      "List:",
      Boolean(listId),
    );
  }

  return data({ ok: true }, { status: 201 });
};

export type EntryFormApiPayload = {
  ok: boolean;
  underAge?: boolean;
  errorMessage?: string;
};
