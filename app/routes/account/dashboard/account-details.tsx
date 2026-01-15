import type { CustomerDetailsFragment } from "customer-account-api.generated";
import { Link } from "~/components/link";

export function AccountDetails({
  customer,
}: {
  customer: CustomerDetailsFragment;
}) {
  const { firstName, lastName, emailAddress, phoneNumber } = customer;
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return (
    <div className="md:h-full flex flex-col">
      <div className="space-y-6 flex-1">
        <div className="space-y-1">
          <div className="uppercase tracking-widest text-body-subtle font-semibold">
            Name
          </div>
          <div>{fullName || "N/A"}</div>
        </div>

        <div className="space-y-1">
          <div className="uppercase tracking-widest text-body-subtle font-semibold">
            Phone number
          </div>
          <div>{phoneNumber?.phoneNumber ?? "N/A"}</div>
        </div>

        <div className="space-y-1">
          <div className="uppercase tracking-widest text-body-subtle font-semibold">
            Email address
          </div>
          <div>{emailAddress?.emailAddress ?? "N/A"}</div>
        </div>

        <div className="mt-4">
          <Link prefetch="intent" variant="outline" to="/account/edit">
            Edit account details
          </Link>
        </div>
      </div>
    </div>
  );
}
