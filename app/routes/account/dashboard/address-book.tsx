import type { CustomerAddress } from "@shopify/hydrogen/customer-account-api-types";
import type { CustomerDetailsFragment } from "customer-account-api.generated";
import { Form } from "react-router";
import { Button } from "~/components/button";
import { Link } from "~/components/link";

export function AddressBook({
  customer,
  addresses,
}: {
  customer: CustomerDetailsFragment;
  addresses: CustomerAddress[];
}) {
  return (
    <div className="h-full">
      <div className="h-full">
        {!addresses?.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-xl font-bold">No addresses yet</p>
            <p className="text-body-subtle mt-2 px-8 mb-6">
              You haven&apos;t saved any addresses yet.
            </p>
            <Link to="address/add" variant="outline">
              Add an Address
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Link to="address/add" variant="outline">
                Add an Address
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {customer.defaultAddress && (
                <Address address={customer.defaultAddress} defaultAddress />
              )}
              {addresses
                .filter((address) => address.id !== customer.defaultAddress?.id)
                .map((address) => (
                  <Address key={address.id} address={address} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Address({
  address,
  defaultAddress,
}: {
  address: CustomerAddress;
  defaultAddress?: boolean;
}) {
  return (
    <div className="flex flex-col bg-body-subtle/4 p-5 rounded-md">
      {defaultAddress && (
        <div className="mb-3 flex flex-row">
          <span className="bg-body-subtle px-3 py-1 font-medium text-body-inverse text-sm">
            Default
          </span>
        </div>
      )}
      <ul className="flex-1 flex-row">
        {(address.firstName || address.lastName) && (
          <li className="mb-2">
            {`${address.firstName && `${address.firstName} `}${
              address?.lastName
            }`}
          </li>
        )}
        {address.formatted?.map((line: string) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="mt-6 flex flex-row items-baseline font-medium">
        <Link
          to={`/account/address/${encodeURIComponent(address.id)}`}
          className="text-body-subtle after:bg-body-subtle"
          prefetch="intent"
          variant="underline"
        >
          Edit
        </Link>
        <Form action="address/delete" method="delete">
          <input type="hidden" name="addressId" value={address.id} />
          <Button
            variant="underline"
            type="submit"
            className="ml-6 text-body-subtle after:bg-body-subtle"
            animate={false}
          >
            Remove
          </Button>
        </Form>
      </div>
    </div>
  );
}
