import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import type { ElementType } from "react";
import { cva } from "class-variance-authority";
import { BackgroundImage } from "~/components/background-image";
import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { cn } from "~/utils/cn";
import { FooterMenu } from "./menu/footer-menu";

const variants = cva("", {
  variants: {
    width: {
      full: "",
      stretch: "",
      fixed: "mx-auto max-w-(--page-width)",
    },
    padding: {
      full: "",
      stretch: "px-3 md:px-10 lg:px-16",
      fixed: "mx-auto px-3 md:px-4 lg:px-6",
    },
  },
});

export function Footer() {
  const { shopName } = useShopMenu();
  const {
    footerLayout,
    footerWidth,
    socialFacebook,
    socialInstagram,
    socialLinkedIn,
    socialX,
    footerLogoData,
    footerLogoWidth,
    bio,
    copyright,
    addressTitle,
    storeAddress,
    storeEmail,
    storePhone,
    footerBackgroundImage,
    showFooterBranding,
    footerBrandingImage,
  } = useThemeSettings();

  const SOCIAL_ACCOUNTS = [
    {
      name: "Facebook",
      to: socialFacebook,
      Icon: FacebookLogoIcon,
    },
    {
      name: "Instagram",
      to: socialInstagram,
      Icon: InstagramLogoIcon,
    },
    {
      name: "X",
      to: socialX,
      Icon: XLogoIcon,
    },
    {
      name: "LinkedIn",
      to: socialLinkedIn,
      Icon: LinkedinLogoIcon,
    },
  ].filter((acc) => acc.to && acc.to.trim() !== "");

  // Opt-in per storefront. Every other brand falls through to the standard
  // footer below, unchanged.
  if (footerLayout === "twoLogoColumns") {
    return <FooterTwoLogoColumns socialAccounts={SOCIAL_ACCOUNTS} />;
  }

  return (
    <footer
      className={cn(
        "relative isolate w-full bg-(--color-footer-bg) py-9 md:py-12 lg:py-16 text-(--color-footer-text)",
        variants({ padding: footerWidth }),
      )}
    >
      <BackgroundImage backgroundImage={footerBackgroundImage} />
      <div className={cn("h-full w-full", variants({ width: footerWidth }))}>
        <div className="grid w-full lg:grid-cols-2 gap-y-12">
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {footerLogoData ? (
                <div className="relative" style={{ width: footerLogoWidth }}>
                  <Image
                    data={footerLogoData}
                    sizes="auto"
                    width={500}
                    className="h-full w-full object-contain object-left"
                  />
                </div>
              ) : (
                <div className="font-bold text-lg font-heading">
                  {shopName}
                </div>
              )}
              {bio && bio !== "<p><br></p>" && (
                <div
                  className="w-3/4"
                  dangerouslySetInnerHTML={{ __html: bio }}
                />
              )}
            </div>
            <div
              className="flex flex-col space-y-1.5 font-heading"
              style={{
                fontSize: "var(--footer-font-size)",
                letterSpacing: "var(--footer-letter-spacing)",
                fontWeight: "var(--footer-font-weight)",
              }}
            >
              <div className="font-bold">
                {addressTitle}
              </div>
              {storeAddress && <p>{storeAddress}</p>}
              {storeEmail && <p>{storeEmail}</p>}
              {storePhone && <p>{storePhone}</p>}
            </div>
            <div className="flex gap-4">
              {SOCIAL_ACCOUNTS.map(({ to, name, Icon }) => (
                <Link
                  key={name}
                  to={to}
                  target="_blank"
                  className="flex items-center gap-2 text-lg"
                >
                  <Icon className="h-5 w-5" weight="regular" />
                </Link>
              ))}
            </div>
          </div>

          <div className="w-full border-t border-white/20 lg:hidden" />

          <div className="flex justify-start">
            <FooterMenu />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-t-[3px] border-white pt-8 mt-20 font-heading text-center lg:text-left">
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: copyright }}
          />
          <div className="flex flex-wrap w-full lg:w-auto justify-center lg:justify-end items-center gap-4 text-sm sm:gap-8">
            <Link to="/policies/privacy-policy" className="whitespace-nowrap">
              Privacy Policy
            </Link>
            <Link to="/policies/terms-of-service" className="whitespace-nowrap">
              Terms of Service
            </Link>
            <Link to="#" className="whitespace-nowrap">
              Cookies Settings
            </Link>
          </div>
        </div>
        {showFooterBranding && footerBrandingImage && (
          <Image
            data={footerBrandingImage}
            width={400}
            className="object-contain mt-5"
          />
        )}
      </div>
    </footer>
  );
}

// Plain anchor so tel:, mailto: and external URLs all work. React Router's
// Link is for in-app navigation only and mangles those schemes.
function FooterTextLink({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag: ElementType = href ? "a" : "span";
  const linkProps = href ? { href } : {};

  return (
    <Tag {...linkProps} className={className}>
      {children}
    </Tag>
  );
}

// Mirrors the Cuvaison DTC footer: two logos side by side, the shop menu as
// columns on the right, contact details as links, and a bottom bar carrying
// the copyright, social icons and policy links.
function FooterTwoLogoColumns({
  socialAccounts,
}: {
  socialAccounts: {
    name: string;
    to: string;
    Icon: ElementType;
  }[];
}) {
  const { shopName } = useShopMenu();
  const {
    footerWidth,
    footerLogoData,
    footerLogoWidth,
    footerLogo2Data,
    footerLogo2Width,
    footerLogoGap,
    storeAddress,
    storeEmail,
    storePhone,
    footerAddressUrl,
    copyright,
    footerBackgroundImage,
    footerPrivacyLabel,
    footerPrivacyUrl,
    footerAccessibilityLabel,
    footerAccessibilityUrl,
    footerShowBottomDivider,
    footerBottomFontSize,
  } = useThemeSettings();

  const contactStyle = {
    fontSize: "var(--footer-font-size)",
    letterSpacing: "var(--footer-letter-spacing)",
    fontWeight: "var(--footer-font-weight)",
  };

  return (
    <footer
      className={cn(
        "relative isolate w-full bg-(--color-footer-bg) py-9 md:py-12 lg:py-16 text-(--color-footer-text)",
        variants({ padding: footerWidth }),
      )}
    >
      <BackgroundImage backgroundImage={footerBackgroundImage} />
      <div className={cn("h-full w-full", variants({ width: footerWidth }))}>
        <div className="grid gap-y-12 lg:grid-cols-2">
          <div
            className="flex flex-wrap items-start"
            style={{ gap: footerLogoGap ? `${footerLogoGap}px` : "40px" }}
          >
            {footerLogoData ? (
              <div className="relative" style={{ width: footerLogoWidth }}>
                <Image
                  data={footerLogoData}
                  sizes="auto"
                  width={500}
                  className="h-full w-full object-contain object-left"
                />
              </div>
            ) : (
              <div className="font-bold text-lg font-heading">{shopName}</div>
            )}
            {footerLogo2Data && (
              <div className="relative" style={{ width: footerLogo2Width }}>
                <Image
                  data={footerLogo2Data}
                  sizes="auto"
                  width={500}
                  className="h-full w-full object-contain object-left"
                />
              </div>
            )}
          </div>

          <div className="flex justify-start">
            <FooterMenu compact />
          </div>
        </div>

        <div
          className="mt-12 flex flex-col gap-3 font-heading lg:mt-16"
          style={contactStyle}
        >
          {storeAddress && (
            <FooterTextLink href={footerAddressUrl} className="underline w-fit">
              {storeAddress}
            </FooterTextLink>
          )}
          {(storePhone || storeEmail) && (
            <div className="flex flex-col">
              {storePhone && (
                <FooterTextLink
                  href={`tel:${storePhone.replace(/[^+\d]/g, "")}`}
                  className="underline w-fit"
                >
                  {storePhone}
                </FooterTextLink>
              )}
              {storeEmail && (
                <FooterTextLink
                  href={`mailto:${storeEmail}`}
                  className="underline w-fit"
                >
                  {storeEmail}
                </FooterTextLink>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "mt-12 flex flex-col items-center gap-6 pt-8 font-heading lg:flex-row lg:justify-between lg:gap-8 lg:text-left",
            footerShowBottomDivider !== false && "border-t border-current/20",
          )}
          style={{
            fontSize: footerBottomFontSize
              ? `${footerBottomFontSize}px`
              : "14px",
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: copyright }} />
          {socialAccounts.length > 0 && (
            <div className="flex gap-4">
              {socialAccounts.map(({ to, name, Icon }) => (
                <Link key={name} to={to} target="_blank" className="text-lg">
                  <Icon className="h-5 w-5" weight="regular" />
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-end lg:gap-8">
            {footerPrivacyUrl && (
              <FooterTextLink
                href={footerPrivacyUrl}
                className="whitespace-nowrap underline"
              >
                {footerPrivacyLabel || "Privacy policy"}
              </FooterTextLink>
            )}
            {footerAccessibilityUrl && (
              <FooterTextLink
                href={footerAccessibilityUrl}
                className="whitespace-nowrap underline"
              >
                {footerAccessibilityLabel || "Accessibility Statement"}
              </FooterTextLink>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
