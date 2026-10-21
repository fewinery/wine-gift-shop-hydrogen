import { ArrowSquareOut, SignOutIcon } from "@phosphor-icons/react";
import { flattenConnection } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { Suspense } from "react";
import { Await, Form, useLoaderData, useOutletContext } from "react-router";
import Link from "~/components/link";
import { ProductCard } from "~/components/product/product-card";
import { Section } from "~/components/section";
import { Swimlane } from "~/components/swimlane";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import type { loader as accountLoader } from "../layout";
import { AccountDetails } from "./account-details";
import { AddressBook } from "./address-book";
import { OrdersHistory } from "./orders-history";

const DEFAULT_PORTAL_URL = "https://winegiftshop.com/apps/winehub?country=US";

export default function AccountDashboard() {
  const signOutUrl = usePrefixPathWithLocale("/account/logout");
  // The portal is Wine Gift Shop's Winehub account area. It is useful to the
  // brands that sell through it and confusing everywhere else, so a storefront
  // can switch it off. On by default: merging this must not change the 65
  // storefronts already showing it.
  const {
    showCustomerPortalLink = true,
    customerPortalLabel,
    customerPortalUrl,
  } = useThemeSettings();
  const portalUrl = (customerPortalUrl || DEFAULT_PORTAL_URL).trim();
  const loaderData = useLoaderData<typeof accountLoader>();
  const outletContext =
    useOutletContext<Awaited<ReturnType<typeof accountLoader>>["data"]>();

  let { customer, heading, featuredProducts } = loaderData || {};
  if (!customer) {
    customer = outletContext?.customer;
    heading = outletContext?.heading;
    featuredProducts = outletContext?.featuredProducts;
  }

  if (!customer) {
    return null;
  }

  const orders = flattenConnection(customer.orders);
  const addresses = flattenConnection(customer.addresses);

  return (
    <Section
      width="fixed"
      verticalPadding="medium"
      containerClassName="space-y-10"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between border-b border-line-subtle pb-8 w-full">
        <div className="space-y-2">
          <p className="text-body-subtle uppercase tracking-widest text-[10px] font-semibold">
            Customer Area
          </p>
          <h1 className="h2 tracking-tight">{heading}</h1>
        </div>
        <div className="flex items-center gap-6">
          {showCustomerPortalLink && portalUrl && (
            <Link
              to={portalUrl}
              className="group flex items-center gap-2 text-base font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowSquareOut className="h-5 w-5" />
              <span className="underline-offset-8 group-hover:underline">
                {customerPortalLabel || "Customer Portal"}
              </span>
            </Link>
          )}
          <Form method="post" action={signOutUrl}>
            <button
              type="submit"
              className="group flex items-center gap-2 text-base font-medium text-red-700/80 hover:text-red-700 transition-colors"
            >
              <SignOutIcon className="h-5 w-5" />
              <span className="underline-offset-8 group-hover:underline">
                Sign out
              </span>
            </button>
          </Form>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="font-semibold tracking-tight">Orders</h5>
        <div className="bg-body-subtle/4 p-6 rounded-xl border border-line-subtle/10">
          <OrdersHistory orders={orders} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
        <div className="space-y-4">
          <h5 className="font-semibold tracking-tight">Account</h5>
          <div className="bg-body-subtle/4 p-6 rounded-xl border border-line-subtle/10 md:h-full">
            <AccountDetails customer={customer} />
          </div>
        </div>
        <div className="space-y-4">
          <h5 className="font-semibold tracking-tight">Address Book</h5>
          <div className="bg-body-subtle/4 p-6 rounded-xl border border-line-subtle/10 md:h-full">
            <AddressBook addresses={addresses} customer={customer} />
          </div>
        </div>
      </div>
      {!orders.length && (
        <Suspense>
          <Await
            resolve={featuredProducts}
            errorElement="There was a problem loading featured products."
          >
            {({ featuredProducts: products }) => (
              <div className="space-y-8 pt-20">
                <h5>Featured products</h5>
                <Swimlane>
                  {products.nodes.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      className="w-80 snap-start"
                    />
                  ))}
                </Swimlane>
              </div>
            )}
          </Await>
        </Suspense>
      )}
    </Section>
  );
}
