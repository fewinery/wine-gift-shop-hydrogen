import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { CSSProperties } from "react";
import { Image } from "~/components/image";
import Link, { type LinkProps, linkContentInputs } from "~/components/link";
import type { ImageAspectRatio } from "~/types/others";
import { cn } from "~/utils/cn";
import { calculateAspectRatio } from "~/utils/image";

const variants = cva("", {
  variants: {
    size: {
      large: "col-span-6",
      medium: "col-span-4",
    },
    hideOnMobile: {
      true: "hidden sm:block",
      false: "",
    },
  },
});

// Typography for the heading and description. Every option includes a
// "default" value that emits no class at all, which is the default, so an
// untouched column keeps inheriting the theme styles exactly as before.
const textVariants = cva("", {
  variants: {
    textSize: {
      default: "",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
    },
    textWeight: {
      default: "",
      "300": "font-light",
      "400": "font-normal",
      "500": "font-medium",
      "600": "font-semibold",
      "700": "font-bold",
    },
    textLetterSpacing: {
      default: "",
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    textLineHeight: {
      default: "",
      none: "leading-none",
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
  },
  defaultVariants: {
    textSize: "default",
    textWeight: "default",
    textLetterSpacing: "default",
    textLineHeight: "default",
  },
});

type TextStyleProps = VariantProps<typeof textVariants>;

const SIZE_OPTIONS = [
  { value: "default", label: "Default (theme)" },
  { value: "xs", label: "Extra small (text-xs)" },
  { value: "sm", label: "Small (text-sm)" },
  { value: "base", label: "Base (text-base)" },
  { value: "lg", label: "Large (text-lg)" },
  { value: "xl", label: "Extra large (text-xl)" },
  { value: "2xl", label: "2x large (text-2xl)" },
  { value: "3xl", label: "3x large (text-3xl)" },
  { value: "4xl", label: "4x large (text-4xl)" },
  { value: "5xl", label: "5x large (text-5xl)" },
];

const WEIGHT_OPTIONS = [
  { value: "default", label: "Default (theme)" },
  { value: "300", label: "300 - light" },
  { value: "400", label: "400 - normal" },
  { value: "500", label: "500 - medium" },
  { value: "600", label: "600 - semi bold" },
  { value: "700", label: "700 - bold" },
];

const LETTER_SPACING_OPTIONS = [
  { value: "default", label: "Default (theme)" },
  { value: "tighter", label: "Tighter (-0.05em)" },
  { value: "tight", label: "Tight (-0.025em)" },
  { value: "normal", label: "Normal (0)" },
  { value: "wide", label: "Wide (0.025em)" },
  { value: "wider", label: "Wider (0.05em)" },
  { value: "widest", label: "Widest (0.1em)" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "default", label: "Default (theme)" },
  { value: "none", label: "None (1)" },
  { value: "tight", label: "Tight (1.25)" },
  { value: "snug", label: "Snug (1.375)" },
  { value: "normal", label: "Normal (1.5)" },
  { value: "relaxed", label: "Relaxed (1.625)" },
  { value: "loose", label: "Loose (2)" },
];

interface ColumnWithImageItemProps
  extends VariantProps<typeof variants>,
    Pick<LinkProps, "variant" | "text" | "to">,
    HydrogenComponentProps {
  imageSrc: WeaverseImage;
  imageAspectRatio: ImageAspectRatio;
  imageBorderRadius: number;
  heading: string;
  content: string;
  headingSize?: TextStyleProps["textSize"];
  headingWeight?: TextStyleProps["textWeight"];
  headingLetterSpacing?: TextStyleProps["textLetterSpacing"];
  headingLineHeight?: TextStyleProps["textLineHeight"];
  contentSize?: TextStyleProps["textSize"];
  contentWeight?: TextStyleProps["textWeight"];
  contentLetterSpacing?: TextStyleProps["textLetterSpacing"];
  contentLineHeight?: TextStyleProps["textLineHeight"];
  ref?: React.Ref<HTMLDivElement>;
}

function ColumnWithImageItem(props: ColumnWithImageItemProps) {
  const {
    imageSrc,
    imageAspectRatio,
    imageBorderRadius,
    heading,
    content,
    headingSize,
    headingWeight,
    headingLetterSpacing,
    headingLineHeight,
    contentSize,
    contentWeight,
    contentLetterSpacing,
    contentLineHeight,
    text,
    to,
    variant,
    hideOnMobile,
    size,
    ref,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      data-motion="slide-in"
      className={variants({ size, hideOnMobile })}
      style={{ "--radius": `${imageBorderRadius}px` } as CSSProperties}
    >
      <Image
        data={typeof imageSrc === "object" ? imageSrc : { url: imageSrc }}
        sizes="auto"
        className="h-auto rounded-(--radius)"
        aspectRatio={calculateAspectRatio(imageSrc, imageAspectRatio)}
      />
      <div className="mt-6 w-full space-y-3.5 text-center">
        {heading && (
          <h6
            className={cn(
              textVariants({
                textSize: headingSize,
                textWeight: headingWeight,
                textLetterSpacing: headingLetterSpacing,
                textLineHeight: headingLineHeight,
              }),
            )}
          >
            {heading}
          </h6>
        )}
        {content && (
          <p
            className={cn(
              textVariants({
                textSize: contentSize,
                textWeight: contentWeight,
                textLetterSpacing: contentLetterSpacing,
                textLineHeight: contentLineHeight,
              }),
            )}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
        {text && (
          <Link variant={variant} to={to}>
            {text}
          </Link>
        )}
      </div>
    </div>
  );
}

export default ColumnWithImageItem;

export const schema = createSchema({
  type: "column-with-image--item",
  title: "Column",
  settings: [
    {
      group: "Column",
      inputs: [
        {
          type: "select",
          name: "size",
          label: "Column size",
          configs: {
            options: [
              {
                label: "Large",
                value: "large",
              },
              {
                label: "Medium",
                value: "medium",
              },
            ],
          },
          defaultValue: "medium",
        },
        {
          type: "switch",
          label: "Hide on Mobile",
          name: "hideOnMobile",
          defaultValue: false,
        },
        {
          type: "heading",
          label: "Image",
        },
        {
          type: "image",
          name: "imageSrc",
          label: "Image",
        },
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          defaultValue: "adapt",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "range",
          name: "imageBorderRadius",
          label: "Image border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
        },
        {
          type: "heading",
          label: "Content",
        },
        {
          type: "text",
          name: "heading",
          label: "Heading",
          placeholder: "Example heading",
          defaultValue: "Example heading",
        },
        {
          type: "richtext",
          label: "Description",
          name: "content",
          placeholder:
            "Use this section to promote content throughout every page of your site. Add images for further impact.",
          defaultValue:
            "Use this section to promote content throughout every page of your site. Add images for further impact.",
        },
        {
          type: "heading",
          label: "Heading style",
        },
        {
          type: "select",
          name: "headingSize",
          label: "Heading size",
          defaultValue: "default",
          configs: { options: SIZE_OPTIONS },
        },
        {
          type: "select",
          name: "headingWeight",
          label: "Heading weight",
          defaultValue: "default",
          configs: { options: WEIGHT_OPTIONS },
        },
        {
          type: "select",
          name: "headingLetterSpacing",
          label: "Heading letter spacing",
          defaultValue: "default",
          configs: { options: LETTER_SPACING_OPTIONS },
        },
        {
          type: "select",
          name: "headingLineHeight",
          label: "Heading line height",
          defaultValue: "default",
          configs: { options: LINE_HEIGHT_OPTIONS },
        },
        {
          type: "heading",
          label: "Description style",
        },
        {
          type: "select",
          name: "contentSize",
          label: "Description size",
          defaultValue: "default",
          configs: { options: SIZE_OPTIONS },
        },
        {
          type: "select",
          name: "contentWeight",
          label: "Description weight",
          defaultValue: "default",
          configs: { options: WEIGHT_OPTIONS },
        },
        {
          type: "select",
          name: "contentLetterSpacing",
          label: "Description letter spacing",
          defaultValue: "default",
          configs: { options: LETTER_SPACING_OPTIONS },
        },
        {
          type: "select",
          name: "contentLineHeight",
          label: "Description line height",
          defaultValue: "default",
          configs: { options: LINE_HEIGHT_OPTIONS },
        },
        {
          type: "heading",
          label: "Button (optional)",
        },
        ...linkContentInputs,
      ],
    },
  ],
  presets: {
    imageSrc: IMAGES_PLACEHOLDERS.product_4,
  },
});
