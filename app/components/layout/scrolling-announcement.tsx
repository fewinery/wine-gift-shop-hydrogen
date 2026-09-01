import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect } from "react";

const MAX_DURATION = 80;

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    enableScrollingAnnouncement,
    topbarText,
    topbarHeight,
    topbarTextColor,
    topbarBgColor,
    topbarScrollingGap,
    topbarScrollingSpeed,
  } = themeSettings;

  // Enabled only when the toggle is on AND there is real (non-empty) content.
  // A cleared rich-text field can still hold markup like "<p></p>", so strip
  // tags before deciding — otherwise the topbar space is reserved for nothing.
  const enabled =
    enableScrollingAnnouncement !== false &&
    Boolean(topbarText?.replace(/<[^>]*>/g, "").trim());

  function updateStyles() {
    if (enabled) {
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
  }, [topbarText]);

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
