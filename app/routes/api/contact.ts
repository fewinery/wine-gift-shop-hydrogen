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
  const topic = formData.get("topic") as string;
  const message = formData.get("message") as string;

  if (!email) {
    return data({ ok: false, error: "Email is required" }, 400);
  }

  const storefront = new URL(request.url).hostname;

  const bodyText = [
    `Source: Contact Form`,
    `Storefront: ${storefront}`,
    `---`,
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    `Phone: ${phone || "N/A"}`,
    `Topic: ${topic || "N/A"}`,
    ``,
    `Message:`,
    message,
  ].join("\n");

  const result = await createGorgiasTicket(context.env, {
    senderName: `${firstName} ${lastName}`.trim(),
    senderEmail: email,
    subject: `Contact Form: ${topic || "General Inquiry"}`,
    bodyText,
    sourceChannel: "contact-form",
    storefront,
  });

  if (result.ok) {
    return data({
      ok: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
    });
  }

  return data({ ok: false, error: result.error }, 500);
};
