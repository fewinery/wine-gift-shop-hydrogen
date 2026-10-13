import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect } from "react";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";

const MAX_DURATION = 80;

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    topbarText,
    topbarHeight,
    topbarTextColor,
    topbarBgColor,
    topbarScrollingGap,
    topbarScrollingSpeed,
    b2bBarTextColor,
    b2bBarBgColor,
  } = themeSettings;
  // B2B storefronts only: a logged-in buyer sees "Ordering for <location>"
  // in this bar instead of the scrolling text. Everyone else is unchanged.
  const b2bLocation = useRouteLoaderData<RootLoader>("root")?.b2bLocation;
  const showBar = Boolean(b2bLocation) || Boolean(topbarText);

  function updateStyles() {
    if (showBar) {
      document.body.style.setProperty(
        "--topbar-height",
        `${Math.max(topbarHeight - window.scrollY, 0)}px`,
      );
    } else {
      document.body.style.setProperty("--topbar-height", "0px");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    updateStyles();
    window.addEventListener("scroll", updateStyles);
    return () => window.removeEventListener("scroll", updateStyles);
  }, [showBar]);

  if (b2bLocation) {
    return (
      <div
        id="announcement-bar"
        className="relative flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap px-3 text-center"
        style={{
          height: `${topbarHeight}px`,
          backgroundColor: b2bBarBgColor || topbarBgColor,
          color: b2bBarTextColor || topbarTextColor,
        }}
      >
        {b2bLocation.companyName && (
          <>
            <span className="font-medium">{b2bLocation.companyName}</span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>
          Ordering for <strong>{b2bLocation.locationName}</strong>
        </span>
      </div>
    );
  }

  if (topbarText?.replace(/<[^>]*>/g, "").trim() === "") {
    return null;
  }

  return (
    <div
      id="announcement-bar"
      className="relative flex items-center overflow-hidden whitespace-nowrap text-center"
      style={
        {
          height: `${topbarHeight}px`,
          backgroundColor: topbarBgColor,
          color: topbarTextColor,
          "--marquee-duration": `${MAX_DURATION / topbarScrollingSpeed}s`,
          "--gap": `${topbarScrollingGap}px`,
        } as React.CSSProperties
      }
    >
      {new Array(10).fill("").map((_, idx) => {
        return (
          <div
            className="animate-marquee [animation-duration:var(--marquee-duration)] px-[calc(var(--gap)/2)]"
            key={idx}
          >
            <div
              className="flex items-center gap-(--gap) whitespace-nowrap [&_p]:flex [&_p]:items-center [&_p]:gap-2"
              dangerouslySetInnerHTML={{ __html: topbarText }}
            />
          </div>
        );
      })}
    </div>
  );
}
