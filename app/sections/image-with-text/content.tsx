import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";

const variants = cva(
  "flex w-full flex-col justify-center gap-6 md:flex-1 [&_.paragraph]:mx-[unset] [&_.paragraph]:w-auto items-center",
  {
    variants: {
      alignment: {
        left: "md:items-start",
        center: "md:items-center",
        right: "md:items-end",
      },
      // The base class list above centres every child on mobile, which makes
      // a short heading look centred even when its own alignment is Left:
      // "items-center" shrinks each child to its content width. This variant
      // targets screens below 768px so mobile can be set independently. The
      // default reproduces the previous behaviour exactly.
      mobileAlignment: {
        left: "max-md:items-start",
        center: "max-md:items-center",
        right: "max-md:items-end",
      },
    },
    defaultVariants: {
      alignment: "center",
      mobileAlignment: "center",
    },
  },
);

interface ImageWithTextContentProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ImageWithTextContent(props: ImageWithTextContentProps) {
  const { alignment, mobileAlignment, children, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(variants({ alignment, mobileAlignment }))}
    >
      {children}
    </div>
  );
}

export default ImageWithTextContent;

export const schema = createSchema({
  type: "image-with-text--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "alignment",
          label: "Alignment (desktop)",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          },
          helpText:
            "This will override the default alignment setting of all children components.",
        },
        {
          type: "select",
          name: "mobileAlignment",
          label: "Alignment (mobile)",
          defaultValue: "center",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ],
          },
          helpText:
            "Applies below 768px. Leave on Center to keep the previous behaviour.",
        },
      ],
    },
  ],
  childTypes: [
    "subheading",
    "heading",
    "paragraph",
    "image-with-text--buttons-wrapper",
  ],
  presets: {
    alignment: "center",
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
        content: "Pair large text with an image to tell a story.",
      },
      {
        type: "image-with-text--buttons-wrapper",
      },
    ],
  },
});
