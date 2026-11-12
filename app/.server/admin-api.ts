/**
 * Server-side access to the Shopify Admin API.
 *
 * The Storefront API cannot price an order for an address it is not being
 * shipped to in one checkout, so anything that needs Shopify's own tax and
 * shipping figures ahead of checkout has to ask the Admin API from the
 * server. Nothing here is ever sent to the browser.
 */

// Shopify supports an Admin API version for about a year, and rejects
// requests to a retired one. Keep this roughly current.
const ADMIN_API_VERSION = "2026-10";

// Client-credentials tokens last 24 hours, so one is kept per worker isolate
// and reused until just before it expires.
let cachedAdminToken: { token: string; expiresAt: number } | null = null;

/**
 * Resolves an Admin API access token, the same two ways the entry form does:
 * a permanent token from a legacy custom app when the store still has one,
 * otherwise a 24 hour token exchanged from a Dev Dashboard app's client id
 * and secret.
 *
 * Returns null when neither is configured.
 */
async function getAdminAccessToken(env: Env): Promise<string | null> {
  if (env.SHOPIFY_ADMIN_API_TOKEN) {
    return env.SHOPIFY_ADMIN_API_TOKEN;
  }

  const clientId = env.SHOPIFY_APP_CLIENT_ID;
  const clientSecret = env.SHOPIFY_APP_CLIENT_SECRET;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  if (!(clientId && clientSecret && shopDomain)) {
    return null;
  }

  if (cachedAdminToken && cachedAdminToken.expiresAt > Date.now() + 60_000) {
    return cachedAdminToken.token;
  }

  const response = await fetch(
    `https://${shopDomain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    },
  );
  if (!response.ok) {
    console.error(
      "Shopify client credentials grant failed",
      response.status,
      await response.text(),
    );
    return null;
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    console.error("Client credentials grant returned no access token");
    return null;
  }

  cachedAdminToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 86_399) * 1000,
  };
  return json.access_token;
}

/**
 * Whether this storefront has been given what it needs to reach the Admin
 * API. It says nothing about which permissions the app was granted - only
 * that a call can be attempted at all.
 */
export function hasAdminCredentials(env: Env): boolean {
  return Boolean(
    env.SHOPIFY_ADMIN_API_TOKEN ||
      (env.SHOPIFY_APP_CLIENT_ID && env.SHOPIFY_APP_CLIENT_SECRET),
  );
}

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not-configured" | "failed"; detail: string };

/**
 * Runs one Admin GraphQL operation. It never throws: a storefront without
 * Admin credentials, a network failure and a GraphQL error all come back as
 * `ok: false` with a reason, so a caller can degrade instead of crashing.
 */
export async function adminGraphql<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
): Promise<AdminResult<T>> {
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  const token = await getAdminAccessToken(env);
  if (!(token && shopDomain)) {
    return {
      ok: false,
      reason: "not-configured",
      detail: "No Admin API credentials are set for this storefront.",
    };
  }

  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query, variables }),
      },
    );
    const json = (await response.json()) as {
      data?: T;
      errors?: unknown;
    };
    if (!response.ok || json.errors || !json.data) {
      return {
        ok: false,
        reason: "failed",
        detail: `HTTP ${response.status}: ${JSON.stringify(json.errors ?? json)}`,
      };
    }
    return { ok: true, data: json.data };
  } catch (error) {
    return {
      ok: false,
      reason: "failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
