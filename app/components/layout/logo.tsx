function LogoBadge({ image, link }: { image: ...; link?: string }) {
  return (
    
      href={link || undefined}
      target={link ? "_blank" : undefined}
      rel={link ? "noopener noreferrer" : undefined}
      className="block h-4 w-auto shrink-0 lg:h-5"
    >
      <Image data={image} sizes="auto" className="h-full w-auto object-contain" width={80} />
    </a>
  );
}

export function Logo() {
  const { shopName } = useShopMenu();
  const {
    logoData, transparentLogoData, logoWidth,
    headerLogoLayout, headerBadge1Image, headerBadge1Link,
    headerBadge2Image, headerBadge2Link,
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
        showBadges ? "w-full min-h-0 flex-1 lg:w-fit" : "h-full w-full lg:h-fit lg:w-fit",
      )}
    >
      {/* ...exact same inner logo <div>/<Image> markup as before... */}
    </Link>
  );

  if (!showBadges) {
    return logoLink;
  }

  return (
    <div className="flex h-full max-h-full flex-col items-center justify-center gap-1">
      <div className="flex shrink-0 items-center gap-2">
        {headerBadge1Image && <LogoBadge image={headerBadge1Image} link={headerBadge1Link} />}
        {headerBadge2Image && <LogoBadge image={headerBadge2Image} link={headerBadge2Link} />}
      </div>
      {logoLink}
    </div>
  );
}
