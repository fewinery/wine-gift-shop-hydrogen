import {
  type ActionFunction,
  type ActionFunctionArgs,
  data,
} from "react-router";

const KLAVIYO_API = "https://a.klaviyo.com/api/profiles";

export const action: ActionFunction = async ({
  request,
  context,
}: ActionFunctionArgs) => {
  const apiToken = context.env.KLAVIYO_PRIVATE_API_TOKEN;
  if (!apiToken) {
    return data({
      ok: false,
      error: "Missing KLAVIYO_PRIVATE_API_TOKEN",
    });
  }

  const formData = await request.formData();
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const topic = formData.get("topic");
  const message = formData.get("message");

  if (!email) {
    return data({ ok: false, error: "Email is required" }, 400);
  }

  try {
    const res = await fetch(KLAVIYO_API, {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        revision: "2024-10-15",
        "content-type": "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${apiToken}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            properties: {
              "Contact Topic": topic,
              "Contact Message": message,
              "Submitted At": new Date().toISOString(),
              Source: "Contact Form",
            },
          },
        },
      }),
    });

    const status = res.status;
    const klaviyoData = (await res.json()) as any;

    if (res.ok) {
      return data(
        {
          ok: true,
          message:
            "Thank you for contacting us! We'll get back to you soon.",
        },
        status,
      );
    }

    const errorDetail =
      klaviyoData?.errors?.[0]?.detail ||
      klaviyoData?.errors?.[0]?.title ||
      "Unable to submit contact form";

    return data({ ok: false, error: errorDetail }, status);
  } catch (e) {
    return data(
      { ok: false, error: "Something went wrong! Please try again." },
      500,
    );
  }
};
