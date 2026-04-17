// Supports weights 400-700
import "@fontsource-variable/cabin";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { SeoConfig } from "@shopify/hydrogen";
import { Analytics, getSeoMeta, useNonce } from "@shopify/hydrogen";
import { useThemeSettings, withWeaverse } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaArgs } from "react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { loadCriticalData, loadDeferredData } from "./.server/root";
import { Footer } from "./components/layout/footer";
import { Header } from "./components/layout/header";
import { ScrollingAnnouncement } from "./components/layout/scrolling-announcement";
import { AgeVerificationPopup } from "./components/root/age-verification-popup";
import { CustomAnalytics } from "./components/root/custom-analytics";
import { GenericError } from "./components/root/generic-error";
import { GlobalLoading } from "./components/root/global-loading";
import {
  NewsletterPopup,
  useShouldRenderNewsletterPopup,
} from "./components/root/newsletter-popup";
import { NotFound } from "./components/root/not-found";
import styles from "./styles/app.css?url";
import { DEFAULT_LOCALE } from "./utils/const";
import { GlobalStyle } from "./weaverse/style";

export type RootLoader = typeof loader;

export const links: LinksFunction = () => {
  return [
    { rel: "preconnect", href: "https://cdn.shopify.com" },
    { rel: "preconnect", href: "https://shop.app" },
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
    env: {
      FONT_FAMILY: args.context.env.FONT_FAMILY,
      HEADING_FONT_FAMILY: args.context.env.HEADING_FONT_FAMILY,
      ADOBE_PROJECT_ID: args.context.env.ADOBE_PROJECT_ID,
      PUBLIC_GORGIAS_CHAT_BUNDLE_ID: args.context.env.PUBLIC_GORGIAS_CHAT_BUNDLE_ID,
    },
  };
}

export const meta = ({ data }: MetaArgs<typeof loader>) => {
  return getSeoMeta(data?.seo as SeoConfig);
};

function App() {
  const data = useRouteLoaderData<RootLoader>("root");
  const gorgiasBundleId = data?.env?.PUBLIC_GORGIAS_CHAT_BUNDLE_ID;

  useEffect(() => {
    if (gorgiasBundleId) {
      const script = document.createElement("script");
      script.src = `https://config.gorgias.chat/bundle-loader/${gorgiasBundleId}`;
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [gorgiasBundleId]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: Error }) {
  const routeError: { status?: number; data?: any } = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  let pageType = "page";

  if (isRouteError && routeError.status === 404) {
    pageType = routeError.data || pageType;
  }

  return isRouteError ? (
    routeError.status === 404 ? (
      <NotFound type={pageType} />
    ) : (
      <GenericError
        error={{ message: `${routeError.status} ${routeError.data}` }}
      />
    )
  ) : (
    <GenericError error={error instanceof Error ? error : undefined} />
  );
}

export function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>("root");
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;
  const { topbarHeight, topbarText, favicon } = useThemeSettings();
  const shouldShowNewsletterPopup = useShouldRenderNewsletterPopup();
  if (
    location.pathname === "/subrequest-profiler" ||
    location.pathname === "/graphiql"
  ) {
    return children;
  }
  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={styles} />
        <Meta />
        <link rel="icon" href={favicon?.url || "/favicon.ico"} />
        <Links />
        <GlobalStyle />

        {data?.env?.ADOBE_PROJECT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${data.env.ADOBE_PROJECT_ID}.css`}
          />
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
        :root {
          --body-font-family: ${data?.env?.FONT_FAMILY || "ui-sans-serif, system-ui, sans-serif"};
          --heading-font-family: ${data?.env?.HEADING_FONT_FAMILY || "ui-serif, Georgia, serif"};
        }
      `,
          }}
        />
      </head>
      <body
        style={
          {
            opacity: 0,
            "--initial-topbar-height": `${topbarText ? topbarHeight : 0}px`,
          } as CSSProperties
        }
        className="bg-background text-body antialiased opacity-100! transition-opacity duration-300"
      >
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <TooltipProvider disableHoverableContent>
              <div
                className="flex min-h-screen flex-col"
                key={`${locale.language}-${locale.country}`}
              >
                <div className="">
                  <a href="#mainContent" className="sr-only">
                    Skip to content
                  </a>
                </div>
                <ScrollingAnnouncement />
                <Header />
                <main id="mainContent" className="grow">
                  {children}
                </main>
                <Footer />
              </div>
              <AgeVerificationPopup />
              {shouldShowNewsletterPopup && <NewsletterPopup />}
            </TooltipProvider>
            <CustomAnalytics />
          </Analytics.Provider>
        ) : (
          children
        )}
        <GlobalLoading />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export const Layout = withWeaverse(RootLayout);

export default App;
