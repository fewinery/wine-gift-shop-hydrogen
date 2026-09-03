import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import type { ElementType } from "react";
import { Link } from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { cn } from "~/utils/cn";

function LogoBadge({
  image,
  imageUrl,
  link,
  size,
}: {
  image?: Parameters<typeof Image>[0]["data"];
  imageUrl?: string;
  link?: string;
  size?: number;
}) {
  // Renders as a real link when a URL is set in Studio, otherwise as a plain
  // block so an unlinked badge is still shown.
  const Tag: ElementType = link ? "a" : "div";
  const linkProps = link
    ? { href: link, target: "_blank", rel: "noopener noreferrer" }
    : {};

  // A pasted image URL wins over the image picker. The picker writes a full
  // media object, so when it misbehaves in Studio the plain text URL field is
  // a way to set a badge without depending on it.
  return (
    <Tag
      {...linkProps}
      className="block w-auto shrink-0"
      style={{ height: size ? `${size}px` : "20px" }}
    >
      {imageUrl ? (
        <img alt="" className="h-full w-auto object-contain" src={imageUrl} />
      ) : (
        <Image
          data={image}
          sizes="auto"
          className="h-full w-auto object-contain"
          width={80}
        />
      )}
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
    headerBadge1ImageUrl,
    headerBadge1Link,
    headerBadge1Size,
    headerBadge2Image,
    headerBadge2ImageUrl,
    headerBadge2Link,
    headerBadge2Size,
    headerBadgeGap,
    headerBadgeBarHeight,
    headerBadgeLogoGap,
  } = useThemeSettings();

  const hasBadge1 = Boolean(headerBadge1ImageUrl || headerBadge1Image);
  const hasBadge2 = Boolean(headerBadge2ImageUrl || headerBadge2Image);

  const showBadges =
    headerLogoLayout === "logoWithBadges" && (hasBadge1 || hasBadge2);

  if (!showBadges) {
    return null;
  }

  return (
    <div
      className="w-full"
      style={{
        marginBottom: headerBadgeLogoGap ? `${headerBadgeLogoGap}px` : "8px",
      }}
    >
      <div
        className={cn(
          "flex items-end justify-center lg:justify-start",
          className,
        )}
        style={{
          height: headerBadgeBarHeight ? `${headerBadgeBarHeight}px` : "40px",
        }}
      >
        <div
          className="flex shrink-0 items-center pb-1"
          style={{ gap: headerBadgeGap ? `${headerBadgeGap}px` : "8px" }}
        >
          {hasBadge1 && (
            <LogoBadge
              image={headerBadge1Image}
              imageUrl={headerBadge1ImageUrl}
              link={headerBadge1Link}
              size={headerBadge1Size}
            />
          )}
          {hasBadge2 && (
            <LogoBadge
              image={headerBadge2Image}
              imageUrl={headerBadge2ImageUrl}
              link={headerBadge2Link}
              size={headerBadge2Size}
            />
          )}
        </div>
      </div>
      {/* Spans the full header width edge-to-edge, not just the content
          container, matching the reference site's underline. */}
      <div className="h-px w-full bg-current" />
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
