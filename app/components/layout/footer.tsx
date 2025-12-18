import {
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Image } from "@shopify/hydrogen";
import { useThemeSettings } from "@weaverse/hydrogen";
import { cva } from "class-variance-authority";
import { useShopMenu } from "~/hooks/use-shop-menu";
import { cn } from "~/utils/cn";
import Link from "../link";
import { CountrySelector } from "./country-selector";
import { FooterMenu } from "./menu/footer-menu";
import { BackgroundImage } from "~/components/background-image";

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
        "relative isolate w-full bg-(--color-footer-bg) pt-9 text-(--color-footer-text) lg:p-16",
        variants({ padding: footerWidth }),
      )}
    >
      <BackgroundImage backgroundImage={footerBackgroundImage} />
      <div
        className={cn(
          "h-full w-full",
          variants({ width: footerWidth }),
        )}
      >
        <div className="grid w-full lg:grid-cols-2">
          <div className="flex flex-col gap-8">
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
            {bio ? <div dangerouslySetInnerHTML={{ __html: bio }} /> : null}
            <div className="flex flex-col text-sm">
              <div className="font-bold font-henderson-slab uppercase">{addressTitle}</div>
              {storeEmail && <p className="pt-[5px]">{storeEmail}</p>}
              {storePhone && <p className="pt-[5px]">{storePhone}</p>}
            </div>
            <div className="flex gap-4">
              {SOCIAL_ACCOUNTS.map(({ to, name, Icon }) => (
                <Link
                  key={name}
                  to={to}
                  target="_blank"
                  className="flex items-center gap-2 text-lg"
                >
                  <Icon
                    className="h-5 w-5"
                    weight={
                      ["Facebook", "LinkedIn"].includes(name) ? "fill" : "bold"
                    }
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex justify-start">
            <FooterMenu />
          </div>
        </div>
        <div className="flex flex-col border-t-[3px] pt-8 mt-20 border-white items-center justify-between gap-4 lg:flex-row font-henderson-slab">
          <p className="text-sm">{copyright}</p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/policies/privacy-policy">Privacy Policy</Link>
            <Link to="/policies/terms-of-service">Terms of Service</Link>
            <Link to="#">Cookies Settings</Link>
          </div>
        </div>
        <img src="/paramount-network-copyright-2025.png" alt="Spike Cable Logo" className="w-[400px] object-contain mt-5" />
      </div>
    </footer>
  );
}
