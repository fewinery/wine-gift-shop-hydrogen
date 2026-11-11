import type { LoaderFunctionArgs } from "react-router";

export async function action({ params, context, request }: LoaderFunctionArgs) {
  const checkoutDomain =
    context.env.PUBLIC_CHECKOUT_DOMAIN || context.env.PUBLIC_STORE_DOMAIN;
  const response = await fetch(
    `https://${checkoutDomain}/api/${params.version}/graphql.json`,
    {
      method: "POST",
      body: request.body,
      headers: request.headers,
    },
  );

  return new Response(response.body, {
    headers: new Headers(response.headers),
  });
}
