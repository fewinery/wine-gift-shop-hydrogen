import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
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
      stretch: "px-3 md:px-4 lg:px-6",
      fixed: "mx-auto px-3 md:px-4 lg:px-6",
    },
  },
});

export function Footer() {
  const { shopName } = useShopMenu();
  const {
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
                <div className="font-bold text-lg uppercase font-henderson-slab">
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
            <div className="flex flex-col text-sm space-y-1.5">
              <div className="font-bold font-henderson-slab uppercase">
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

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 border-t-[3px] border-white pt-8 mt-20 font-henderson-slab text-center lg:text-left">
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: copyright }}
          />
          <div className="flex w-full lg:w-auto justify-center lg:justify-end items-center gap-4 text-sm sm:gap-8">
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
        <img
          src="/paramount-network-copyright-2025.png"
          alt="Spike Cable Logo"
          className="w-[400px] object-contain mt-5"
        />
      </div>
    </footer>
  );
}
