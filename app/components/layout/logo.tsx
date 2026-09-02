import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Link } from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";

function LogoBadge({
  image,
  link,
}: {
  image: Parameters<typeof Image>[0]["data"];
  link?: string;
}) {
  return (
    
      href={link || undefined}
      target={link ? "_blank" : undefined}
      rel={link ? "noopener noreferrer" : undefined}
      className="block h-4 w-auto shrink-0 lg:h-5"
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
    headerBadge2Image,
    headerBadge2Link,
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
      className={clsx(
        "z-30 flex items-center justify-center",
        showBadges
          ? "w-full min-h-0 flex-1 lg:w-fit"
          : "h-full w-full lg:h-fit lg:w-fit",
      )}
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

  return (
    <div className="flex h-full max-h-full flex-col items-center justify-center gap-1">
      <div className="flex shrink-0 items-center gap-2">
        {headerBadge1Image && (
          <LogoBadge image={headerBadge1Image} link={headerBadge1Link} />
        )}
        {headerBadge2Image && (
          <LogoBadge image={headerBadge2Image} link={headerBadge2Link} />
        )}
      </div>
      {logoLink}
    </div>
  );
}
