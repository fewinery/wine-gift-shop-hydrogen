import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect } from "react";
import { hasRichTextContent } from "~/utils/misc";

const MAX_DURATION = 80;

function Bar({
  id,
  text,
  height,
  textColor,
  bgColor,
  gap,
  speed,
}: {
  id: string;
  text: string;
  height: number;
  textColor: string;
  bgColor: string;
  gap: number;
  speed: number;
}) {
  return (
    <div
      id={id}
      className="relative flex items-center overflow-hidden whitespace-nowrap text-center"
      style={
        {
          height: `${height}px`,
          backgroundColor: bgColor,
          color: textColor,
          "--marquee-duration": `${MAX_DURATION / speed}s`,
          "--gap": `${gap}px`,
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
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>
        );
      })}
    </div>
  );
}

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
    enableSecondaryScrollingAnnouncement,
    secondaryTopbarText,
    secondaryTopbarHeight,
    secondaryTopbarTextColor,
    secondaryTopbarBgColor,
    secondaryTopbarScrollingGap,
    secondaryTopbarScrollingSpeed,
  } = themeSettings;

  // Enabled only when each toggle is on AND there is real (non-empty) content.
  const primaryEnabled =
    enableScrollingAnnouncement !== false && hasRichTextContent(topbarText);
  // Off by default on every site — only turns on where explicitly enabled.
  const secondaryEnabled =
    enableSecondaryScrollingAnnouncement === true &&
    hasRichTextContent(secondaryTopbarText);

  // Combined reserved space for whichever bars are visible. The header only
  // ever reads this single --topbar-height variable, so it needs no changes
  // to support a second stacked bar.
  const combinedHeight =
    (primaryEnabled ? topbarHeight : 0) +
    (secondaryEnabled ? secondaryTopbarHeight : 0);

  function updateStyles() {
    document.body.style.setProperty(
      "--topbar-height",
      `${Math.max(combinedHeight - window.scrollY, 0)}px`,
    );
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    updateStyles();
    window.addEventListener("scroll", updateStyles);
    return () => window.removeEventListener("scroll", updateStyles);
  }, [combinedHeight]);

  if (!(primaryEnabled || secondaryEnabled)) {
    return null;
  }

  return (
    <>
      {primaryEnabled && (
        <Bar
          id="announcement-bar"
          text={topbarText}
          height={topbarHeight}
          textColor={topbarTextColor}
          bgColor={topbarBgColor}
          gap={topbarScrollingGap}
          speed={topbarScrollingSpeed}
        />
      )}
      {secondaryEnabled && (
        <Bar
          id="announcement-bar-secondary"
          text={secondaryTopbarText}
          height={secondaryTopbarHeight}
          textColor={secondaryTopbarTextColor}
          bgColor={secondaryTopbarBgColor}
          gap={secondaryTopbarScrollingGap}
          speed={secondaryTopbarScrollingSpeed}
        />
      )}
    </>
  );
}
