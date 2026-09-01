import { MagnifyingGlassIcon, UserIcon } from "@phosphor-icons/react";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { Suspense } from "react";
import {
  Await,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import useWindowScroll from "react-use/esm/useWindowScroll";
import { CartDrawer } from "~/components/cart/cart-drawer";
import Link from "~/components/link";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";
import { Logo } from "./logo";
import { DesktopMenu } from "./menu/desktop-menu";
import { MobileMenu } from "./menu/mobile-menu";
import { PredictiveSearchButton } from "./predictive-search";

const variants = cva("", {
  variants: {
    width: {
      full: "h-full w-full",
      stretch: "h-full w-full",
      fixed: "mx-auto h-full w-full max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-3 md:px-4 lg:px-6",
    },
  },
});

function useIsHomeCheck() {
  const { pathname } = useLocation();
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale ?? DEFAULT_LOCALE;
  return pathname.replace(selectedLocale.pathPrefix, "") === "/";
}

export function Header() {
  const { enableTransparentHeader, headerBehavior, headerWidth } =
    useThemeSettings();
  const isHome = useIsHomeCheck();
  const { y } = useWindowScroll();
  const routeError = useRouteError();

  const scrolled = y >= 50;

  // Resolve behavior: "auto" (or unset) falls back to the legacy toggle
  let behavior: "scroll" | "solid" | "transparent" =
    headerBehavior && headerBehavior !== "auto"
      ? headerBehavior
      : enableTransparentHeader
        ? "scroll"
        : "solid";
  // Transparent modes only apply on the home page and never on error pages
  if (behavior !== "solid" && !(isHome && !routeError)) {
    behavior = "solid";
  }

  // "scroll": fixed, transparent at top, turns solid after scrolling
  // "transparent": absolute (not sticky), stays transparent, scrolls away
  const enableTransparent = behavior === "scroll";
  const isStatic = behavior === "transparent";
  const isTransparent = isStatic || (enableTransparent && !scrolled);

  return (
    <header
      className={cn(
        "z-10 w-full",
        "transition-all duration-300 ease-in-out",
        "bg-(--color-header-bg) hover:bg-(--color-header-bg)",
        "text-(--color-header-text) hover:text-(--color-header-text)",
        "border-line-subtle border-b",
        variants({ padding: headerWidth }),
        scrolled && !isStatic ? "shadow-header" : "shadow-none",
        enableTransparent && [
          "group/header fixed w-full",
          "top-(--topbar-height,var(--initial-topbar-height))",
        ],
        isStatic && [
          "group/header absolute w-full",
          "top-(--initial-topbar-height,0px)",
        ],
        !(enableTransparent || isStatic) && "sticky top-0",
        isTransparent
          ? [
            "border-transparent bg-transparent",
            "text-(--color-transparent-header-text)",
            "[&_.cart-count]:text-(--color-header-text)",
            "[&_.cart-count]:bg-(--color-transparent-header-text)",
            "hover:[&_.cart-count]:bg-(--color-header-text)",
            "hover:[&_.cart-count]:text-(--color-transparent-header-text)",
            "[&_.main-logo]:opacity-0 hover:[&_.main-logo]:opacity-100",
            "[&_.transparent-logo]:opacity-100 hover:[&_.transparent-logo]:opacity-0",
            "[&_.main-logo]:absolute [&_.main-logo]:inset-0",
            "[&_.transparent-logo]:relative [&_.transparent-logo]:top-auto [&_.transparent-logo]:left-auto",
          ]
          : [
            "[&_.cart-count]:text-(--color-header-bg)",
            "[&_.cart-count]:bg-(--color-header-text)",
            "[&_.main-logo]:opacity-100",
            "[&_.transparent-logo]:opacity-0",
          ],
      )}
    >
      <div
        className={cn(
          "flex h-(--height-nav) items-center justify-between gap-2 py-1.5 lg:gap-8 lg:py-3",
          variants({ width: headerWidth }),
        )}
      >
        <MobileMenu />
        <Link to="/search" className="p-1.5 lg:hidden">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </Link>
        <Logo />
        <DesktopMenu />
        <div className="z-1 flex items-center gap-1">
          <AccountLink className="relative flex h-8 w-8 items-center justify-center" />
          <PredictiveSearchButton />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}

function AccountLink({ className }: { className?: string }) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Link to="/account" className={clsx("transition-none", className)}>
      <Suspense fallback={<UserIcon className="h-5 w-5" />}>
        <Await
          resolve={isLoggedIn}
          errorElement={<UserIcon className="h-5 w-5" />}
        >
          {(loggedIn) =>
            loggedIn ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <UserIcon className="h-5 w-5" />
            )
          }
        </Await>
      </Suspense>
    </Link>
  );
}
