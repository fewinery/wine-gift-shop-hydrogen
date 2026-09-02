import { Image } from "@shopify/hydrogen";
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

function BadgeLink({
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

// A plain, static bar (no marquee/scrolling) that shows the two optional
// "logo badge" images side by side, with a thin underline. It reserves
// space the exact same way the announcement bars do, so it stacks cleanly
// above them and above the header, regardless of header behavior.
function BadgesBar({
  height,
  gap,
  badge1Image,
  badge1Link,
  badge1Size,
  badge2Image,
  badge2Link,
  badge2Size,
}: {
  height: number;
  gap: number;
  badge1Image?: Parameters<typeof Image>[0]["data"];
  badge1Link?: string;
  badge1Size?: number;
  badge2Image?: Parameters<typeof Image>[0]["data"];
  badge2Link?: string;
  badge2Size?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1"
      style={{ height: `${height}px` }}
    >
      <div
        className="flex shrink-0 items-center"
        style={{ gap: gap ? `${gap}px` : "8px" }}
      >
        {badge1Image && (
          <BadgeLink image={badge1Image} link={badge1Link} size={badge1Size} />
        )}
        {badge2Image && (
          <BadgeLink image={badge2Image} link={badge2Link} size={badge2Size} />
        )}
      </div>
      <div className="h-px w-8 bg-(--color-transparent-header-text)" />
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
    headerLogoLayout,
    headerBadge1Image,
    headerBadge1Link,
    headerBadge1Size,
    headerBadge2Image,
    headerBadge2Link,
    headerBadge2Size,
    headerBadgeGap,
    headerBadgeBarHeight,
  } = themeSettings;

  // Enabled only when each toggle is on AND there is real (non-empty) content.
  const primaryEnabled =
    enableScrollingAnnouncement !== false && hasRichTextContent(topbarText);
  // Off by default on every site — only turns on where explicitly enabled.
  const secondaryEnabled =
    enableSecondaryScrollingAnnouncement === true &&
    hasRichTextContent(secondaryTopbarText);
  // "logoWithBadges" is an opt-in layout selected in Weaverse Studio; every
  // site defaults to "standard" (or has no value at all), so this is false
  // and nothing here renders unless a site turns it on.
  const badgesEnabled =
    headerLogoLayout === "logoWithBadges" &&
    (headerBadge1Image || headerBadge2Image);

  // Combined reserved space for whichever bars are visible. The header only
  // ever reads this single --topbar-height variable, so it needs no changes
  // to support additional stacked bars.
  const combinedHeight =
    (primaryEnabled ? topbarHeight : 0) +
    (secondaryEnabled ? secondaryTopbarHeight : 0) +
    (badgesEnabled ? headerBadgeBarHeight : 0);

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

  if (!(primaryEnabled || secondaryEnabled || badgesEnabled)) {
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
      {badgesEnabled && (
        <BadgesBar
          height={headerBadgeBarHeight}
          gap={headerBadgeGap}
          badge1Image={headerBadge1Image}
          badge1Link={headerBadge1Link}
          badge1Size={headerBadge1Size}
          badge2Image={headerBadge2Image}
          badge2Link={headerBadge2Link}
          badge2Size={headerBadge2Size}
        />
      )}
    </>
  );
}
