import { createSchema } from "@weaverse/hydrogen";
import { createContext, useContext } from "react";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

interface NewsLetterProps extends SectionProps {
  successBannerHeading: string;
  successBannerHeadingColor: string;
  successBannerDescription: string;
  successBannerDescriptionColor: string;
  successBannerBg: string;
  successBannerButtonText: string;
  successBannerButtonBg: string;
  successBannerButtonTextColor: string;
  ref?: React.Ref<HTMLElement>;
}

const NewsLetterContext = createContext<Partial<NewsLetterProps>>({});

export const useNewsLetterSettings = () => useContext(NewsLetterContext);

function NewsLetter(props: NewsLetterProps) {
  const {
    children,
    ref,
    successBannerHeading,
    successBannerHeadingColor,
    successBannerDescription,
    successBannerDescriptionColor,
    successBannerBg,
    successBannerButtonText,
    successBannerButtonBg,
    successBannerButtonTextColor,
    ...rest
  } = props;
  return (
    <NewsLetterContext.Provider
      value={{
        successBannerHeading,
        successBannerHeadingColor,
        successBannerDescription,
        successBannerDescriptionColor,
        successBannerBg,
        successBannerButtonText,
        successBannerButtonBg,
        successBannerButtonTextColor,
      }}
    >
      <Section ref={ref} {...rest}>
        {children}
      </Section>
    </NewsLetterContext.Provider>
  );
}

export default NewsLetter;

export const schema = createSchema({
  type: "newsletter",
  title: "Newsletter",
  settings: [
    ...sectionSettings,
    {
      group: "Success Popup",
      inputs: [
        {
          type: "text",
          name: "successBannerHeading",
          label: "Heading",
          defaultValue: "THANK YOU!",
        },
        {
          type: "richtext",
          name: "successBannerDescription",
          label: "Description",
          defaultValue: "You have successfully subscribed to our newsletter.",
        },
        {
          type: "text",
          name: "successBannerButtonText",
          label: "Button Text",
          defaultValue: "Close",
        },
        {
          type: "color",
          name: "successBannerBg",
          label: "Background Color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "successBannerHeadingColor",
          label: "Heading Color",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          name: "successBannerDescriptionColor",
          label: "Description Color",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          name: "successBannerButtonBg",
          label: "Button Background",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          name: "successBannerButtonTextColor",
          label: "Button Text Color",
          defaultValue: "#000000",
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "newsletter-form", "newsletter-campaign"],
  presets: {
    gap: 20,
    children: [
      {
        type: "heading",
        content: "SIGN UP & SAVE 15%",
      },
      {
        type: "paragraph",
        content:
          "Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.",
      },
      { type: "newsletter-form" },
    ],
  },
});
