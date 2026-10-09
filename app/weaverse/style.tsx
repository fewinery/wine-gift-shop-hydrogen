import { useThemeSettings } from "@weaverse/hydrogen";
import { extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

/**
 * Where the nav menu takes its size from. "custom" keeps the pixel sliders;
 * a heading level or body makes the menu track the theme's own type scale, so
 * retuning headings carries the menu with it instead of leaving it stranded
 * at a number somebody typed once.
 */
const NAV_SIZE_SOURCES: Record<string, { desktop: string; mobile: string }> = {
  h1: { desktop: "var(--h1-base-size)", mobile: "var(--h1-mobile-size)" },
  h2: { desktop: "var(--h2-base-size)", mobile: "var(--h2-mobile-size)" },
  h3: { desktop: "var(--h3-base-size)", mobile: "var(--h3-mobile-size)" },
  h4: { desktop: "var(--h4-base-size)", mobile: "var(--h4-mobile-size)" },
  h5: { desktop: "var(--h5-base-size)", mobile: "var(--h5-mobile-size)" },
  h6: { desktop: "var(--h6-base-size)", mobile: "var(--h6-mobile-size)" },
  body: { desktop: "var(--body-base-size)", mobile: "var(--body-base-size)" },
};

function navFontSize(
  source: string | undefined,
  pixels: number | undefined,
  device: "desktop" | "mobile",
) {
  const mapped = NAV_SIZE_SOURCES[source ?? ""];
  if (mapped) {
    return mapped[device];
  }
  // The clamp guards against a stale or out-of-range saved value; the fallback
  // guards against "undefinedpx", which Safari drops whole declarations over.
  return `clamp(10px, ${pixels ?? 16}px, 32px)`;
}

export function GlobalStyle() {
  const settings = useThemeSettings();
  if (settings) {
    const {
      colorBackground,
      colorText,
      colorTextSubtle,
      colorTextInverse,
      colorLine,
      colorLineSubtle,
      topbarTextColor,
      topbarBgColor,
      headerBgColor,
      headerText,
      transparentHeaderText,
      footerBgColor,
      footerText,
      buttonPrimaryBg,
      buttonPrimaryColor,
      buttonPrimaryBorder,
      buttonPrimaryBgHover,
      buttonPrimaryColorHover,
      buttonPrimaryBorderHover,
      buttonSecondaryBg,
      buttonSecondaryColor,
      buttonSecondaryBorder,
      buttonSecondaryBgHover,
      buttonSecondaryColorHover,
      buttonSecondaryBorderHover,
      buttonOutlineTextAndBorder,
      comparePriceTextColor,
      discountBadge,
      newBadge,
      bestSellerBadge,
      bundleBadgeColor,
      soldOutBadgeColor,
      productReviewsColor,
      bodyBaseSize,
      bodyBaseSpacing,
      bodyBaseLineHeight,
      h1BaseSize,
      h2BaseSize,
      h3BaseSize,
      h4BaseSize,
      h5BaseSize,
      h6BaseSize,
      h1MobileSize,
      h2MobileSize,
      h3MobileSize,
      h4MobileSize,
      h5MobileSize,
      h6MobileSize,
      headingBaseSpacing,
      headingBaseLineHeight,
      navHeightDesktop,
      navHeightTablet,
      navBaseSize,
      navMobileBaseSize,
      navBaseSpacing,
      navBaseWeight,
      navSizeSource,
      pageWidth,
      footerDesktopFontSize,
      footerMobileFontSize,
      footerLetterSpacing,
      footerFontWeight,
      navFontFamily,
      footerFontFamily,
    } = settings;

    return (
      <style
        key="global-theme-style"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Layout */
              --height-nav: ${settings.navHeightMobile ?? 3}rem;
              --page-width: ${pageWidth ?? 1280}px;

              /* Colors (general) */
              --color-background: ${colorBackground};
              --color-text: ${colorText};
              --color-text-subtle: ${colorTextSubtle};
              --color-text-inverse: ${colorTextInverse};
              --color-line: ${colorLine};
              --color-line-subtle: ${colorLineSubtle};

              /* Colors (header & footer) */
              --color-topbar-text: ${topbarTextColor};
              --color-topbar-bg: ${topbarBgColor};
              --color-header-bg: ${headerBgColor};
              --color-header-text: ${headerText};
              --color-transparent-header-text: ${transparentHeaderText};
              --color-footer-bg: ${footerBgColor};
              --color-footer-text: ${footerText};

              /* Colors (buttons & links) */
              --btn-primary-bg: ${buttonPrimaryBg};
              --btn-primary-text: ${buttonPrimaryColor};
              --btn-primary-border: ${buttonPrimaryBorder || buttonPrimaryBg};
              --btn-primary-bg-hover: ${buttonPrimaryBgHover || buttonPrimaryColor};
              --btn-primary-text-hover: ${buttonPrimaryColorHover || buttonPrimaryBg};
              --btn-primary-border-hover: ${buttonPrimaryBorderHover || buttonPrimaryBg};
              --btn-secondary-bg: ${buttonSecondaryBg};
              --btn-secondary-text: ${buttonSecondaryColor};
              --btn-secondary-border: ${buttonSecondaryBorder || "#000000"};
              --btn-secondary-bg-hover: ${buttonSecondaryBgHover || "#000000"};
              --btn-secondary-text-hover: ${buttonSecondaryColorHover || "#ffffff"};
              --btn-secondary-border-hover: ${buttonSecondaryBorderHover || "#000000"};
              --btn-outline-text: ${buttonOutlineTextAndBorder};

              /* Colors (product) */
              --color-compare-price-text: ${comparePriceTextColor};
              --color-discount: ${discountBadge};
              --color-new-badge: ${newBadge};
              --color-best-seller: ${bestSellerBadge};
              --color-bundle-badge: ${bundleBadgeColor};
              --color-sold-out-and-unavailable: ${soldOutBadgeColor};
              --color-product-reviews: ${productReviewsColor};

              /* Typography */
              --body-base-size: ${bodyBaseSize}px;
              --body-base-spacing: ${bodyBaseSpacing};
              --body-base-line-height: ${bodyBaseLineHeight};

              /* Desktop heading sizes */
              --h1-base-size: ${h1BaseSize}px;
              --h2-base-size: ${h2BaseSize}px;
              --h3-base-size: ${h3BaseSize}px;
              --h4-base-size: ${h4BaseSize}px;
              --h5-base-size: ${h5BaseSize}px;
              --h6-base-size: ${h6BaseSize}px;

              /* Mobile heading sizes */
              --h1-mobile-size: ${h1MobileSize}px;
              --h2-mobile-size: ${h2MobileSize}px;
              --h3-mobile-size: ${h3MobileSize}px;
              --h4-mobile-size: ${h4MobileSize}px;
              --h5-mobile-size: ${h5MobileSize}px;
              --h6-mobile-size: ${h6MobileSize}px;

              --heading-base-spacing: ${headingBaseSpacing};
              --heading-base-line-height: ${headingBaseLineHeight};

              /* Nav menu typography
                 Bounds match schema (min/max). Defaults guard against undefined
                 values producing "undefinedpx" — Safari has historically dropped
                 entire declarations on invalid values, leaving fonts inheriting
                 from body and rendering at unexpected sizes. */
              --nav-font-size: ${navFontSize(navSizeSource, navBaseSize, "desktop")};
              --nav-mobile-font-size: ${navFontSize(navSizeSource, navMobileBaseSize, "mobile")};
              --nav-letter-spacing: ${navBaseSpacing ?? "0em"};
              --nav-font-weight: ${navBaseWeight ?? 400};

              /* Footer typography */
              --footer-font-size: ${footerDesktopFontSize}px;
              --footer-mobile-font-size: ${footerMobileFontSize}px;
              --footer-letter-spacing: ${footerLetterSpacing};
              --footer-font-weight: ${footerFontWeight};
            }

            /* Font assignment overrides.
               "font-heading" compiles to font-family: var(--font-heading),
               so redefining that variable on a container retargets every
               descendant - including the "!" variants the menus use, with
               no specificity fight and no component edits. Nothing is
               emitted unless the setting is changed from its default, so
               storefronts that leave it alone are byte-identical. */
            ${
              navFontFamily === "body"
                ? `header, [data-mobile-menu] { --font-heading: var(--body-font-family); }`
                : ""
            }
            ${
              footerFontFamily === "body"
                ? `footer { --font-heading: var(--body-font-family); }`
                : ""
            }

                        /* Header actions (Login / Search / Cart).
               Two reasons this lives here rather than on the element:
               Search and Cart are <button>s, and this project's reset leaves
               buttons on the browser's own font - the same reason the
               existing "uppercase" needs a child selector to reach them. And
               the mobile size needs a media query, which an inline style
               cannot carry, so on phones the actions would otherwise sit at
               the desktop size while the drawer menu beside them did not. */
            .header-actions {
              font-size: var(--nav-mobile-font-size, 16px);
              letter-spacing: var(--nav-letter-spacing, 0em);
              font-weight: var(--nav-font-weight, 400);
            }
            .header-actions a,
            .header-actions button {
              font-family: inherit;
              font-size: inherit;
              letter-spacing: inherit;
              font-weight: inherit;
            }
            @media (min-width: 64em) {
              .header-actions {
                font-size: var(--nav-font-size, 16px);
              }
            }

            @media (min-width: 32em) {
              body {
                --height-nav: ${navHeightTablet ?? 4}rem;
              }
            }
            @media (min-width: 48em) {
              body {
                --height-nav: ${navHeightDesktop ?? 6}rem;
              }
            }
          `,
        }}
      />
    );
  }
  return null;
}
