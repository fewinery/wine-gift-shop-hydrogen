import type { LoaderFunctionArgs } from "react-router";
import { b2bPostLoginRedirect } from "~/.server/b2b";
import { resolveB2BBuyer } from "./b2b-buyer";

export async function loader({ context }: LoaderFunctionArgs) {
  const response = await context.customerAccount.authorize();
  await resolveB2BBuyer(context);
  return b2bPostLoginRedirect(context, response);
}
