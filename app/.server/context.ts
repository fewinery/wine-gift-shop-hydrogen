import type { HydrogenSession } from "@shopify/hydrogen";
import { createHydrogenContext } from "@shopify/hydrogen";
import { WeaverseClient } from "@weaverse/hydrogen";
import {
  createCookieSessionStorage,
  type Session,
  type SessionStorage,
} from "react-router";
import { CART_QUERY_FRAGMENT } from "~/graphql/fragments";
import type { I18nLocale } from "~/types/others";
import { COUNTRIES } from "~/utils/const";
import { components } from "~/weaverse/components";
import { themeSchema } from "~/weaverse/schema.server";

const additionalContext = {
  // Additional context for custom properties, CMS clients, 3P SDKs, etc.
} as const;

type AdditionalContextType = typeof additionalContext;

declare global {
  interface HydrogenAdditionalContext extends AdditionalContextType {}
}

/** Long enough to let a blip pass, short enough that nobody notices. */
const WEAVERSE_RETRY_DELAY_MS = 120;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Give the Weaverse client one second attempt before it gives up.
 *
 * Its own error handling is silent and lossy: a failed page request comes
 * back as null, and a failed theme request comes back as the schema's own
 * defaults. The page then 404s and the header wears the stock Pilot logo,
 * which is what visitors have been reporting - and why refreshing fixes it.
 *
 * Failed responses are never cached (the client only caches a response that
 * has no error), so the retry is a genuinely fresh request rather than the
 * same failure served twice. One extra attempt, only on the way to an error
 * page the visitor would otherwise have to clear by hand.
 */
function withRetry(weaverse: WeaverseClient) {
  const loadPage = weaverse.loadPage.bind(weaverse);
  weaverse.loadPage = async (params) => {
    const page = await loadPage(params);
    if (page) {
      return page;
    }
    await wait(WEAVERSE_RETRY_DELAY_MS);
    return loadPage(params);
  };

  const loadThemeSettings = weaverse.loadThemeSettings.bind(weaverse);
  weaverse.loadThemeSettings = async (strategy) => {
    const settings = await loadThemeSettings(strategy);
    if (!settings?._loadFailed) {
      return settings;
    }
    await wait(WEAVERSE_RETRY_DELAY_MS);
    return loadThemeSettings(strategy);
  };
}

export async function createHydrogenRouterContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  if (!env?.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open("hydrogen"),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: getLocaleFromRequest(request),
      cart: { queryFragment: CART_QUERY_FRAGMENT },
    },
    additionalContext,
  );

  const weaverse = new WeaverseClient({
    ...hydrogenContext,
    request,
    cache,
    themeSchema,
    components,
  });

  withRetry(weaverse);

  // Add weaverse directly to the hydrogenContext instance
  // This preserves the RouterContextProvider class instance
  Object.assign(hydrogenContext, { weaverse });

  return hydrogenContext;
}

class AppSession implements HydrogenSession {
  isPending = false;
  readonly #sessionStorage: SessionStorage;
  readonly #session: Session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: "session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets,
      },
    });

    const session = await storage
      .getSession(request.headers.get("Cookie"))
      .catch(() => storage.getSession());

    return new AppSession(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    this.isPending = true;
    return this.#session.unset;
  }

  get set() {
    this.isPending = true;
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    this.isPending = false;
    return this.#sessionStorage.commitSession(this.#session);
  }
}

function getLocaleFromRequest(request: Request): I18nLocale {
  const url = new URL(request.url);
  let firstPathPart = `/${url.pathname.substring(1).split("/")[0].toLowerCase()}`;
  firstPathPart = firstPathPart.replace(".data", "");

  return COUNTRIES[firstPathPart]
    ? {
        ...COUNTRIES[firstPathPart],
        pathPrefix: firstPathPart,
      }
    : {
        ...COUNTRIES.default,
        pathPrefix: "",
      };
}
