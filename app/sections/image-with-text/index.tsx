import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";
import { cn } from "~/utils/cn";

interface ImageWithTextProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
  reverseLayout?: boolean;
}

function ImageWithText(props: ImageWithTextProps) {
  const { children, ref, heading, reverseLayout = false, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="text-center font-henderson-slab text-[30px] uppercase lg:text-[37px]">
          {heading}
        </h2>
      )}
      <div
        className={cn(
          "flex flex-col gap-7 md:gap-10 lg:gap-20",
          reverseLayout ? "md:flex-row-reverse" : "md:flex-row",
        )}
      >
        {children}
      </div>
    </Section>
  );
}

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image With Text",
  childTypes: ["image-with-text--image", "image-with-text--content"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "",
          placeholder: "Enter section heading",
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "switch",
          name: "reverseLayout",
          label: "Reverse Layout",
          defaultValue: false,
          helpText: "Switch image and text positions",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    heading: "In-Home & Virtual Tastings",
    gap: 48,
    children: [
      {
        type: "image-with-text--image",
      },
      {
        type: "image-with-text--content",
        children: [
          {
            type: "subheading",
            content: "Subheading",
          },
          {
            type: "heading",
            content: "Heading for image",
          },
          {
            type: "paragraph",
            content: "<p>Pair large text with an image to tell a story.</p>",
          },
          {
            type: "image-with-text--buttons-wrapper",
          },
        ],
      },
    ],
  },
});
