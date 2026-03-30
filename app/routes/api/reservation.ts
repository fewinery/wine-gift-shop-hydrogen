import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";
import { createGorgiasTicket } from "~/utils/gorgias";

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const tastingType = formData.get("tastingType") as string;
  const numberOfGuests = formData.get("numberOfGuests") as string;
  const membership = formData.get("membership") as string;
  const comments = formData.get("comments") as string;

  if (!email) {
    return data({ ok: false, error: "Email is required" }, 400);
  }

  const bodyText = [
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    `Phone: ${phone || "N/A"}`,
    ``,
    `Tasting Type: ${tastingType || "N/A"}`,
    `Number of Guests: ${numberOfGuests || "N/A"}`,
    `WinePlus Membership: ${membership || "N/A"}`,
    ``,
    `Comments:`,
    comments || "None",
  ].join("\n");

  const result = await createGorgiasTicket(context.env, {
    senderName: `${firstName} ${lastName}`.trim(),
    senderEmail: email,
    subject: `Reservation Request: ${tastingType || "Tasting"}`,
    bodyText,
  });

  if (result.ok) {
    return data({
      ok: true,
      message: "Reservation submitted successfully",
    });
  }

  return data({ ok: false, error: result.error }, 500);
};
