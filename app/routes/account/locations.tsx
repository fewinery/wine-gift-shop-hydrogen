import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  data,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { getB2BBuyer, isB2BEnabled } from "~/.server/b2b";
import { variants as buttonVariants } from "~/components/button";
import { Section } from "~/components/section";
import { cn } from "~/utils/cn";
import {
  fetchB2BLocations,
  selectB2BLocation,
  syncCartLocation,
} from "./auth/b2b-buyer";

export const meta: MetaFunction = () => [{ title: "Choose your location" }];

/** Only same-site paths are allowed as the destination after choosing. */
function safeReturnTo(value: string | null, prefix: string): string {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return prefix || "/";
}

async function requireLoggedInB2B(
  context: LoaderFunctionArgs["context"],
  request: Request,
) {
  if (!isB2BEnabled(context.env)) {
    throw new Response("Not found", { status: 404 });
  }
  if (!(await context.customerAccount.isLoggedIn())) {
    const url = new URL(request.url);
    const prefix = context.storefront.i18n.pathPrefix ?? "";
    throw redirect(
      `${prefix}/account/login?${new URLSearchParams({ return_to: url.pathname + url.search })}`,
    );
  }
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireLoggedInB2B(context, request);
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  const [locations, buyer] = await Promise.all([
    fetchB2BLocations(context),
    getB2BBuyer(context),
  ]);
  return {
    locations,
    currentId: buyer?.companyLocationId ?? null,
    returnTo: safeReturnTo(
      new URL(request.url).searchParams.get("return_to"),
      prefix,
    ),
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireLoggedInB2B(context, request);
  const prefix = context.storefront.i18n.pathPrefix ?? "";
  const form = await request.formData();
  const locationId = String(form.get("locationId") ?? "");
  const returnTo = safeReturnTo(String(form.get("returnTo") ?? ""), prefix);

  // Check the choice against Shopify's own list for this customer.
  const locations = await fetchB2BLocations(context);
  const chosen = locations.find((location) => location.id === locationId);
  if (!chosen) {
    return data(
      { error: "That location is not available for your account." },
      { status: 400 },
    );
  }

  selectB2BLocation(context, chosen);
  context.session.set("b2bLocationCount", locations.length);
  await syncCartLocation(context);
  return redirect(returnTo);
}

export default function ChooseLocation() {
  const { locations, currentId, returnTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const pendingId =
    navigation.state === "submitting"
      ? String(navigation.formData?.get("locationId") ?? "")
      : null;

  return (
    <Section width="fixed" verticalPadding="medium">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-2xl">Choose your location</h1>
          <p className="text-body-subtle">
            Products, prices and payment terms follow the location you order
            for. You can switch at any time from the bar at the top of the page.
          </p>
        </div>
        {actionData?.error && (
          <p className="text-center text-red-600">{actionData.error}</p>
        )}
        {locations.length === 0 ? (
          <p className="text-center">
            Your account is not linked to any company location yet. Please
            contact us so we can set it up.
          </p>
        ) : (
          <ul className="space-y-3">
            {locations.map((location) => {
              const isCurrent = location.id === currentId;
              return (
                <li key={location.id}>
                  <Form method="post">
                    <input
                      type="hidden"
                      name="locationId"
                      value={location.id}
                    />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      disabled={pendingId !== null}
                      className={cn(
                        buttonVariants({
                          variant: isCurrent ? "primary" : "outline",
                        }),
                        "w-full justify-between gap-4 text-left",
                      )}
                    >
                      <span className="flex flex-col items-start">
                        <span className="font-medium">
                          {location.locationName}
                        </span>
                        {location.companyName && (
                          <span className="text-sm opacity-75">
                            {location.companyName}
                          </span>
                        )}
                      </span>
                      <span className="text-sm">
                        {pendingId === location.id
                          ? "Switching…"
                          : isCurrent
                            ? "Current"
                            : "Choose"}
                      </span>
                    </button>
                  </Form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Section>
  );
}
