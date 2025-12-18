import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import { Link } from "~/components/link";

import type { SectionProps } from "~/components/section";

interface ImageWithTextData {
  image: WeaverseImage | string;
  heading: string;
  headingColor: string;
  paragraph: string;
  paragraphColor: string;
  buttonText: string;
  buttonLink: string;
  buttonTextColor: string;
  buttonBgColor: string;
}

interface ImageWithTextProps extends ImageWithTextData, SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function ImageWithText(props: ImageWithTextProps) {
  const {
    ref,
    backgroundColor,
    image = IMAGES_PLACEHOLDERS.image,
    heading,
    headingColor,
    paragraph,
    paragraphColor,
    buttonText,
    buttonLink,
    buttonTextColor,
    buttonBgColor,
    ...rest
  } = props;

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: "Image" } : image;

  return (
    <section ref={ref} {...rest} className="py-16 md:py-[68px]" style={{ backgroundColor }}>
      <div className="mx-auto flex max-w-[1300px] gap-20">
        {/* image */}
        <div className="relative w-1/2 h-[500px]">
          <Image
            data={imageData}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="absolute left-0 top-0 h-full w-full object-cover object-left rounded-[10px]"
          />
        </div>

        {/* content */}
        <div className="flex w-1/2 flex-col items-start justify-center">
          {heading && (
            <h2
              className="text-[33px] font-medium tracking-[0.5px]"
              style={{ color: headingColor }}
            >
              {heading}
            </h2>
          )}
          {paragraph && (
            <div
              className="text-[18px] tracking-normal mt-[15px]"
              style={{ color: paragraphColor }}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          )}

          {buttonText && buttonLink && (
            <Link to={buttonLink}>
              <button
                type="button"
                className="px-6 py-3 w-[200px] mt-8 laeding-none text-sm"
                style={{
                  color: buttonTextColor || "#000000",
                  backgroundColor: buttonBgColor || "#F5A623",
                }}
              >
                {buttonText}
              </button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image with text",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#FFFFFF",
        },
      ],
    },
    {
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "heading",
          label: "Heading",
        },
        {
          type: "text",
          name: "heading",
          label: "Heading text",
          defaultValue: "Section heading",
          placeholder: "Section heading",
        },
        {
          type: "color",
          name: "headingColor",
          label: "Heading color",
          defaultValue: "#000000",
        },
        {
          type: "heading",
          label: "Paragraph",
        },
        {
          type: "richtext",
          name: "paragraph",
          label: "Content",
          defaultValue: "Pair text with an image to tell a story.",
          placeholder: "Pair text with an image to tell a story.",
        },
        {
          type: "color",
          name: "paragraphColor",
          label: "Paragraph color",
          defaultValue: "#333333",
        },
        {
          type: "heading",
          label: "Button",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Button text",
          placeholder: "Button text",
        },
        {
          type: "url",
          name: "buttonLink",
          label: "Button link",
          defaultValue: "/pages/about",
          placeholder: "/pages/about",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "buttonBgColor",
          label: "Button background color",
          defaultValue: "#FFFFFF",
        },
      ],
    },
  ],
  presets: {
    backgroundColor: "#FFFFFF",
    image: IMAGES_PLACEHOLDERS.image,
    heading: "Section heading",
    headingColor: "#000000",
    paragraph: "Pair text with an image to tell a story.",
    paragraphColor: "#333333",
    buttonText: "Button text",
    buttonLink: "/pages/about",
    buttonTextColor: "#000000",
    buttonBgColor: "#FFFFFF",
  },
});
