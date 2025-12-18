import {
  createSchema,
  IMAGES_PLACEHOLDERS,
} from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { Link } from "~/components/link";

export interface HeroImageProps {
  ref: React.Ref<HTMLElement>;
  heading?: string;
  paragraph?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export default function HeroImage(props: HeroImageProps & SectionProps) {
  const {
    ref,
    heading,
    paragraph,
    buttonText,
    buttonLink,
    buttonBgColor,
    buttonTextColor,
    ...rest
  } = props;

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName="flex flex-col items-center justify-center text-center py-[124px] px-16"
    >
      <div className="flex flex-col items-center max-w-[700px]">
        {heading && (
          <div
            className="text-[50px] uppercase tracking-[3px] leading-[51px]"
            dangerouslySetInnerHTML={{ __html: heading }}
          />
        )}
        {paragraph && (
          <div
            className="text-[18px] text-center tracking-normal leading-[23px] mt-5"
            dangerouslySetInnerHTML={{ __html: paragraph }}
          />
        )}
        {buttonText && (
          <Link
            to={buttonLink}
            className="flex items-center justify-center px-6 py-3 text-sm mt-8 w-[200px]"
            style={{
              backgroundColor: buttonBgColor,
              color: buttonTextColor,
            }}
          >
            {buttonText}
          </Link>
        )}
      </div>
    </Section>
  );
}

export const schema = createSchema({
  type: "hero-image",
  title: "Hero image",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "richtext",
          name: "heading",
          label: "Heading",
          defaultValue: "Hero image heading",
        },
        {
          type: "richtext",
          name: "paragraph",
          label: "Paragraph",
          defaultValue:
            "Use this text to share information about your brand with your customers.",
        },
      ],
    },
    {
      group: "Button",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Text",
        },
        {
          type: "text",
          name: "buttonLink",
          label: "Button link",
          defaultValue: "/",
        },
        {
          type: "color",
          name: "buttonBgColor",
          label: "Button background",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text color",
          defaultValue: "#000000",
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        ...backgroundInputs.filter(
          (inp) =>
            inp.name !== "backgroundFor" && inp.name !== "backgroundColor",
        ),
      ],
    },
  ],
  presets: {
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    heading: "Hero image heading",
    paragraph:
      "Use this text to share information about your brand with your customers. Describe a product, share announcements, or welcome customers to your store.",
    buttonText: "Text",
    buttonLink: "/",
    buttonBgColor: "#ffffff",
    buttonTextColor: "#000000",
  },
});
