import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface ImageWithTextProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function ImageWithText(props: ImageWithTextProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image with text",
  childTypes: [
    "image-with-text--header",
    "image-with-text--items",
    "heading",
    "subheading",
    "paragraph",
  ],
  settings: [...sectionSettings],
  presets: {
    gap: 48,
    children: [
      {
        type: "image-with-text--header",
        children: [
          {
            type: "heading",
            content: "AWARDED BEST IN CLASS RED WINE",
            as: "h2",
          },
        ],
      },
      {
        type: "image-with-text--items",
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
                content:
                  "<p>Pair large text with an image to tell a story.</p>",
              },
              {
                type: "image-with-text--buttons-wrapper",
              },
            ],
          },
        ],
      },
    ],
  },
});
