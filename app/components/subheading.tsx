import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "~/utils/cn";

const variants = cva("subheading", {
  variants: {
    size: {
      base: "text-base",
      large: "text-lg",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
    },
    alignment: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    alignment: "center",
  },
});

// Mobile-only overrides. These use the "max-md" variant, which targets
// screens BELOW 768px, so the existing classes above keep driving every
// breakpoint and only the phone view is restyled. Tailwind emits variant
// utilities after unprefixed ones, so these win on mobile without any
// "!important". Nothing here is applied unless the Studio toggle is on.
const mobileVariants = cva("", {
  variants: {
    mobileSize: {
      base: "max-md:text-base",
      large: "max-md:text-lg",
    },
    mobileWeight: {
      normal: "max-md:font-normal",
      medium: "max-md:font-medium",
    },
    mobileAlignment: {
      left: "max-md:text-left",
      center: "max-md:text-center",
      right: "max-md:text-right",
    },
  },
});

interface SubHeadingProps
  extends VariantProps<typeof variants>,
    VariantProps<typeof mobileVariants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement>;
  as?: "h4" | "h5" | "h6" | "div" | "p";
  color?: string;
  content: string;
  enableMobileOverrides?: boolean;
}
function SubHeading(props: SubHeadingProps) {
  const {
    ref,
    as: Tag = "p",
    content,
    color,
    size,
    weight,
    alignment,
    enableMobileOverrides,
    mobileSize,
    mobileWeight,
    mobileAlignment,
    className,
    ...rest
  } = props;
  return (
    <Tag
      ref={ref}
      {...rest}
      data-motion="fade-up"
      style={{ color }}
      className={cn(
        variants({ size, weight, alignment, className }),
        enableMobileOverrides &&
          mobileVariants({ mobileSize, mobileWeight, mobileAlignment }),
      )}
    >
      {content}
    </Tag>
  );
}

export default SubHeading;

export const schema = createSchema({
  type: "subheading",
  title: "Subheading",
  settings: [
    {
      group: "Subheading",
      inputs: [
        {
          type: "select",
          name: "as",
          label: "Tag name",
          configs: {
            options: [
              { value: "h4", label: "Heading 4" },
              { value: "h5", label: "Heading 5" },
              { value: "h6", label: "Heading 6" },
              { value: "p", label: "Paragraph" },
              { value: "div", label: "Div" },
            ],
          },
          defaultValue: "p",
        },
        {
          type: "text",
          name: "content",
          label: "Content",
          defaultValue: "Section subheading",
          placeholder: "Section subheading",
        },
        {
          type: "color",
          name: "color",
          label: "Text color",
        },
        {
          type: "select",
          name: "size",
          label: "Text size",
          configs: {
            options: [
              { value: "base", label: "Base" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "select",
          name: "weight",
          label: "Weight",
          configs: {
            options: [
              { value: "normal", label: "Normal" },
              { value: "medium", label: "Medium" },
            ],
          },
          defaultValue: "normal",
        },
        {
                  {
          type: "toggle-group",
          name: "alignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "center",
        },
        {
          type: "heading",
          label: "Mobile overrides",
        },
        {
          type: "switch",
          name: "enableMobileOverrides",
          label: "Different settings on mobile",
          defaultValue: false,
          helpText:
            "Restyles this subheading below 768px only. The settings above keep controlling tablet and desktop.",
        },
        {
          type: "select",
          name: "mobileSize",
          label: "Mobile text size",
          condition: (data: SubHeadingProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { value: "base", label: "Base" },
              { value: "large", label: "Large" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "select",
          name: "mobileWeight",
          label: "Mobile weight",
          condition: (data: SubHeadingProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { value: "normal", label: "Normal" },
              { value: "medium", label: "Medium" },
            ],
          },
          defaultValue: "normal",
        },
        {
          type: "toggle-group",
          name: "mobileAlignment",
          label: "Mobile alignment",
          condition: (data: SubHeadingProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "center",
        },
      ],
    },
  ],
});
          name: "alignment",
          label: "Alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "center",
        },
      ],
    },
  ],
});
