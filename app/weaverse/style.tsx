import { useThemeSettings } from "@weaverse/hydrogen";
import { extend } from "colord";
import namesPlugin from "colord/plugins/names";

extend([namesPlugin]);

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
      pageWidth,
    } = settings;

    return (
      <style
        key="global-theme-style"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Layout */
              --height-nav: ${settings.navHeightMobile}rem;
              --page-width: ${pageWidth}px;

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

              /* Nav menu typography */
              --nav-font-size: ${navBaseSize}px;
              --nav-mobile-font-size: ${navMobileBaseSize}px;
              --nav-letter-spacing: ${navBaseSpacing};
              --nav-font-weight: ${navBaseWeight};
            }

            @media (min-width: 32em) {
              body {
                --height-nav: ${navHeightTablet}rem;
              }
            }
            @media (min-width: 48em) {
              body {
                --height-nav: ${navHeightDesktop}rem;
              }
            }
          `,
        }}
      />
    );
  }
  return null;
}
