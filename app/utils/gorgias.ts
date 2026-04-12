interface GorgiasMessage {
  senderName: string;
  senderEmail: string;
  subject: string;
  bodyText: string;
  /** Tag identifying the form source, e.g. "contact-form" or "reservation-form" */
  sourceChannel?: string;
  /** Tag identifying the storefront, e.g. "fewinery.com" — useful for multi-project setups */
  storefront?: string;
}

export async function createGorgiasTicket(
  env: Env,
  message: GorgiasMessage,
): Promise<{ ok: boolean; error?: string }> {
  const { GORGIAS_DOMAIN, GORGIAS_API_USER_EMAIL, GORGIAS_API_KEY } = env;

  if (!GORGIAS_DOMAIN || !GORGIAS_API_USER_EMAIL || !GORGIAS_API_KEY) {
    return { ok: false, error: "Gorgias is not configured" };
  }

  const basicToken = btoa(`${GORGIAS_API_USER_EMAIL}:${GORGIAS_API_KEY}`);

  const tags: { name: string }[] = [];
  if (message.sourceChannel) tags.push({ name: message.sourceChannel });
  if (message.storefront) tags.push({ name: message.storefront });

  try {
    const res = await fetch(
      `https://${GORGIAS_DOMAIN}.gorgias.com/api/tickets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicToken}`,
        },
        body: JSON.stringify({
          channel: "email",
          via: "api",
          from_agent: false,
          subject: message.subject,
          tags: tags.length > 0 ? tags : undefined,
          messages: [
            {
              channel: "email",
              via: "api",
              from_agent: false,
              source: {
                from: {
                  name: message.senderName,
                  address: message.senderEmail,
                },
                to: [{ address: `${GORGIAS_DOMAIN}@gorgias.com` }],
              },
              body_text: message.bodyText,
            },
          ],
        }),
      },
    );

    if (res.ok) {
      return { ok: true };
    }

    const text = await res.text();
    let error = "Unable to submit. Please try again.";
    try {
      const resData = JSON.parse(text) as {
        error?: { message: string };
        message?: string;
      };
      error = resData?.error?.message || resData?.message || error;
    } catch (e) {
      console.error("[Gorgias] Error parsing response:", e);
    }

    return { ok: false, error };
  } catch (e) {
    return { ok: false, error: "Unable to reach Gorgias. Please try again." };
  }
}
