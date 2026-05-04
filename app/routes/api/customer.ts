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
        phone
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

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const formType = formData.get("formType")?.toString();
  const { customerCreate, errors: queryErrors } =
    await context.storefront.mutate<CustomerCreateMutation>(CUSTOMER_CREATE, {
      variables: {
        input: {
          email,
          password: "5hopify",
          acceptsMarketing: true,
        },
      },
    });

  const customer = customerCreate?.customer;
  const customerUserErrors = customerCreate?.customerUserErrors;

  if (queryErrors?.length) {
    return data(
      {
        errors: queryErrors,
        errorMessage: "Internal server error!",
        ok: false,
      },
      { status: 500 },
    );
  }
  const isTaken = customerUserErrors?.some(
    (e) => e.code === "TAKEN" || e.code === "CUSTOMER_DISABLED",
  );
  if (customerUserErrors?.length && !isTaken) {
    return data(
      {
        errors: customerUserErrors,
        errorMessage: customerUserErrors?.[0]?.message,
        ok: false,
      },
      { status: 500 },
    );
  }
  if (customer || isTaken) {
    const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
   let listId = context.env.KLAVIYO_LIST_ID;

if (formType === "campaign") {
  listId = context.env.KLAVIYO_CAMPAIGN_LIST_ID;
}

// fallback
if (!listId) {
  listId = context.env.KLAVIYO_LIST_ID;
}

    if (apiToken && listId) {
      try {
        await fetch(
          "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs",
          {
            method: "POST",
            headers: {
              revision: "2024-10-15",
              Authorization: `Klaviyo-API-Key ${apiToken}`,
              "Content-Type": "application/json",
              accept: "application/vnd.api+json",
            },
            body: JSON.stringify({
              data: {
                type: "profile-subscription-bulk-create-job",
                attributes: {
                  custom_source: formType === "campaign" ? "campaign" : "newsletter",
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
          },
        );
      } catch (error) {
        console.error("Error subscribing to Klaviyo list", error);
      }
    } else {
      console.error(
        "Missing Klaviyo API Token or List ID. Token:",
        Boolean(apiToken),
        "List:",
        Boolean(listId),
      );
    }
    return data({ customer, ok: true }, { status: 201 });
  }
  return data(
    {
      errorMessage: "Something went wrong! Please try again later.",
      ok: false,
    },
    { status: 500 },
  );
};

export type CustomerApiPlayLoad = {
  ok: boolean;
  customer?:
    | NonNullable<CustomerCreateMutation["customerCreate"]>["customer"]
    | null;
  errors?: any[];
  errorMessage?: string;
};
