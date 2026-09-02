import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Link } from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";

function LogoBadge({
  image,
  link,
  size,
}: {
  image: Parameters<typeof Image>[0]["data"];
  link?: string;
  size?: number;
}) {
  return (
    <a
      href={link || undefined}
      target={link ? "_blank" : undefined}
      rel={link ? "noopener noreferrer" : undefined}
      className="block w-auto shrink-0"
      style={{ height: size ? `${size}px` : "20px" }}
    >
      <Image
        data={image}
        sizes="auto"
        className="h-full w-auto object-contain"
        width={80}
      />
    </a>
  );
}

export function Logo() {
  const { shopName } = useShopMenu();
  const {
    logoData,
    transparentLogoData,
    logoWidth,
    headerLogoLayout,
    headerBadge1Image,
    headerBadge1Link,
    headerBadge1Size,
    headerBadge2Image,
    headerBadge2Link,
    headerBadge2Size,
    headerBadgeGap,
  } = useThemeSettings();

  // "logoWithBadges" is an opt-in layout selected in Weaverse Studio; every
  // site defaults to "standard" (or has no value at all), so this is false
  // and the logo renders exactly as before unless a site turns it on.
  const showBadges =
    headerLogoLayout === "logoWithBadges" &&
    (headerBadge1Image || headerBadge2Image);

  const logoLink = (
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

  if (!showBadges) {
    return logoLink;
  }

  // Badges render as a floating overlay pinned above the logo, so they take
  // up no space in the header's own layout — the logo, nav, icons and cart
  // stay at exactly the same position/height as the "standard" layout.
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="-translate-x-1/2 absolute bottom-full left-1/2 flex flex-col items-center gap-1 pb-1.5">
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
        <div className="h-px w-8 bg-(--color-transparent-header-text)" />
      </div>
      {logoLink}
    </div>
  );
}
