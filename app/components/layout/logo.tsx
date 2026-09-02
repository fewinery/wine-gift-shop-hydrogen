import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { ElementType } from "react";
import { Link } from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { cn } from "~/utils/cn";

function LogoBadge({
  image,
  link,
  size,
}: {
  image: Parameters<typeof Image>[0]["data"];
  link?: string;
  size?: number;
}) {
  // Renders as a real link when a URL is set in Studio, otherwise as a plain
  // block so an unlinked badge is still shown.
  const Tag: ElementType = link ? "a" : "div";
  const linkProps = link
    ? { href: link, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Tag
      {...linkProps}
      className="block w-auto shrink-0"
      style={{ height: size ? `${size}px` : "20px" }}
    >
      <Image
        data={image}
        sizes="auto"
        className="h-full w-auto object-contain"
        width={80}
      />
    </Tag>
  );
}

// Optional row of small clickable badge images, rendered by the header on its
// own line directly above the main header row. It is opt-in per site via the
// "logoWithBadges" layout, so every other storefront renders nothing here and
// its header is untouched.
export function LogoBadges({ className }: { className?: string }) {
  const {
    headerLogoLayout,
    headerBadge1Image,
    headerBadge1Link,
    headerBadge1Size,
    headerBadge2Image,
    headerBadge2Link,
    headerBadge2Size,
    headerBadgeGap,
    headerBadgeBarHeight,
  } = useThemeSettings();

  const showBadges =
    headerLogoLayout === "logoWithBadges" &&
    (headerBadge1Image || headerBadge2Image);

  if (!showBadges) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-end justify-center lg:justify-start",
        className,
      )}
      style={{
        height: headerBadgeBarHeight ? `${headerBadgeBarHeight}px` : "40px",
      }}
    >
      <div className="flex flex-col items-center gap-1 pb-1">
        <div
          className="flex shrink-0 items-center"
          style={{ gap: headerBadgeGap ? `${headerBadgeGap}px` : "8px" }}
        >
          {headerBadge1Image && (
            <LogoBadge
              image={headerBadge1Image}
              link={headerBadge1Link}
              size={headerBadge1Size}
            />
          )}
          {headerBadge2Image && (
            <LogoBadge
              image={headerBadge2Image}
              link={headerBadge2Link}
              size={headerBadge2Size}
            />
          )}
        </div>
        <div className="h-px w-8 bg-current" />
      </div>
    </div>
  );
}

export function Logo() {
  const { shopName } = useShopMenu();
  const { logoData, transparentLogoData, logoWidth } = useThemeSettings();

  return (
    <Link
      to="/"
      prefetch="intent"
      className="z-30 flex h-full w-full items-center justify-center lg:h-fit lg:w-fit"
    >
      <div
        className="relative h-full"
        style={{ width: logoData ? logoWidth : "auto" }}
      >
        {logoData ? (
          <>
            <Image
              data={logoData}
              sizes="auto"
              className={clsx(
                "main-logo",
                "mx-auto h-full max-w-full object-contain",
                "transition-opacity duration-300 ease-in group-hover/header:opacity-100",
              )}
              width={500}
              style={{ width: "auto" }}
            />
            {transparentLogoData && (
              <Image
                data={transparentLogoData}
                sizes="auto"
                className={clsx(
                  "transparent-logo",
                  "absolute top-0 left-0 mx-auto h-full max-w-full object-contain",
                  "transition-opacity duration-300 ease-in group-hover/header:opacity-0",
                )}
                width={500}
                style={{ width: "auto" }}
              />
            )}
          </>
        ) : (
          <div className="line-clamp-1 font-medium text-lg sm:text-2xl">
            {shopName}
          </div>
        )}
      </div>
    </Link>
  );
}
