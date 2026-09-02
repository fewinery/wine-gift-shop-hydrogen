import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect } from "react";
import { hasRichTextContent } from "~/utils/misc";

const MAX_DURATION = 80;

function Bar({ id, text, height, textColor, bgColor, gap, speed }: { ... }) {
  return (
    <div id={id} className="relative flex items-center overflow-hidden whitespace-nowrap text-center" style={{ ... }}>
      {/* same marquee content as before, now parameterized */}
    </div>
  );
}

export function ScrollingAnnouncement() {
  const themeSettings = useThemeSettings();
  const {
    enableScrollingAnnouncement, topbarText, topbarHeight, topbarTextColor,
    topbarBgColor, topbarScrollingGap, topbarScrollingSpeed,
    enableSecondaryScrollingAnnouncement, secondaryTopbarText, secondaryTopbarHeight,
    secondaryTopbarTextColor, secondaryTopbarBgColor,
    secondaryTopbarScrollingGap, secondaryTopbarScrollingSpeed,
  } = themeSettings;

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
      {primaryEnabled && <Bar id="announcement-bar" text={topbarText} height={topbarHeight} textColor={topbarTextColor} bgColor={topbarBgColor} gap={topbarScrollingGap} speed={topbarScrollingSpeed} />}
      {secondaryEnabled && <Bar id="announcement-bar-secondary" text={secondaryTopbarText} height={secondaryTopbarHeight} textColor={secondaryTopbarTextColor} bgColor={secondaryTopbarBgColor} gap={secondaryTopbarScrollingGap} speed={secondaryTopbarScrollingSpeed} />}
    </>
  );
}
