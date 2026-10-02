import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";

export interface ParagraphProps
  extends VariantProps<typeof variants>,
    VariantProps<typeof mobileVariants>,
    Partial<HydrogenComponentProps> {
  ref?: React.Ref<HTMLParagraphElement | HTMLDivElement>;
  as?: "p" | "div";
  content: string;
  color?: string;
  enableMobileOverrides?: boolean;
}

const variants = cva("paragraph", {
  variants: {
    textSize: {
      xs: "text-xs",
      sm: "text-sm",
      base: "",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
      "7xl": "text-7xl",
      "8xl": "text-8xl",
      "9xl": "text-9xl",
    },
    width: {
      full: "mx-auto w-full",
      narrow: "mx-auto w-full max-w-4xl md:w-1/2 lg:w-3/4",
    },
    letterSpacing: {
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    lineHeight: {
      none: "leading-none",
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
    alignment: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
    defaultVariants: {
    width: "full",
    textSize: "base",
    letterSpacing: "normal",
    lineHeight: "normal",
  },
});

// Mobile-only overrides. These use the "max-md" variant, which targets
// screens BELOW 768px, so the existing classes above keep driving every
// breakpoint and only the phone view is restyled. Tailwind emits variant
// utilities after unprefixed ones, so these win on mobile without any
// "!important". Nothing here is applied unless the Studio toggle is on.
const mobileVariants = cva("", {
  variants: {
    mobileTextSize: {
      xs: "max-md:text-xs",
      sm: "max-md:text-sm",
      base: "max-md:text-base",
      lg: "max-md:text-lg",
      xl: "max-md:text-xl",
      "2xl": "max-md:text-2xl",
      "3xl": "max-md:text-3xl",
      "4xl": "max-md:text-4xl",
      "5xl": "max-md:text-5xl",
      "6xl": "max-md:text-6xl",
      "7xl": "max-md:text-7xl",
      "8xl": "max-md:text-8xl",
      "9xl": "max-md:text-9xl",
    },
    mobileLetterSpacing: {
      tighter: "max-md:tracking-tighter",
      tight: "max-md:tracking-tight",
      normal: "max-md:tracking-normal",
      wide: "max-md:tracking-wide",
      wider: "max-md:tracking-wider",
      widest: "max-md:tracking-widest",
    },
    mobileLineHeight: {
      none: "max-md:leading-none",
      tight: "max-md:leading-tight",
      snug: "max-md:leading-snug",
      normal: "max-md:leading-normal",
      relaxed: "max-md:leading-relaxed",
      loose: "max-md:leading-loose",
    },
    mobileAlignment: {
      left: "max-md:text-left",
      center: "max-md:text-center",
      right: "max-md:text-right",
    },
  },
});

function Paragraph(props: ParagraphProps) {
  const {
    ref,
    as: Tag = "p",
    width,
    content,
    textSize,
    color,
    letterSpacing,
    lineHeight,
    alignment,
    enableMobileOverrides,
    mobileTextSize,
    mobileLetterSpacing,
    mobileLineHeight,
    mobileAlignment,
    className,
    ...rest
  } = props;
  return (
    <Tag
      ref={ref}
      data-motion="fade-up"
      {...rest}
      style={{ color }}
      className={clsx(
        variants({
          textSize,
          width,
          letterSpacing,
          lineHeight,
          alignment,
          className,
        }),
        enableMobileOverrides &&
          mobileVariants({
            mobileTextSize,
            mobileLetterSpacing,
            mobileLineHeight,
            mobileAlignment,
          }),
      )}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default Paragraph;

export const schema = createSchema({
  type: "paragraph",
  title: "Paragraph",
  settings: [
    {
      group: "Paragraph",
      inputs: [
        {
          type: "richtext",
          name: "content",
          label: "Content",
          defaultValue:
            "Pair large text with an image or full-width video to showcase your brand's lifestyle to describe and showcase an important detail of your products that you can tag on your image.",
          placeholder:
            "Pair large text with an image or full-width video to showcase your brand's lifestyle to describe and showcase an important detail of your products that you can tag on your image.",
        },
        {
          type: "select",
          name: "as",
          label: "Html tag",
          configs: {
            options: [
              { value: "p", label: "<p> (paragraph)" },
              { value: "div", label: "<div> (div)" },
            ],
          },
          defaultValue: "p",
        },
        {
          type: "color",
          name: "color",
          label: "Text color",
        },
        {
          type: "select",
          name: "textSize",
          label: "Text size",
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "toggle-group",
          name: "width",
          label: "Width",
          configs: {
            options: [
              { value: "full", label: "Full", icon: "move-horizontal" },
              {
                value: "narrow",
                label: "Narrow",
                icon: "fold-horizontal",
              },
            ],
          },
          defaultValue: "narrow",
        },
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
          type: "select",
          label: "Letter spacing",
          name: "letterSpacing",
          configs: {
            options: [
              { label: "Tighter (-0.05em)", value: "tighter" },
              { label: "Tight (-0.025em)", value: "tight" },
              { label: "Normal (inherit)", value: "normal" },
              { label: "Wide (0.025em)", value: "wide" },
              { label: "Wider (0.05em)", value: "wider" },
              { label: "Widest (0.1em)", value: "widest" },
            ],
          },
          defaultValue: "normal",
        },
                {
          type: "select",
          label: "Line height",
          name: "lineHeight",
          configs: {
            options: [
              { label: "None (1)", value: "none" },
              { label: "Tight (1.25)", value: "tight" },
              { label: "Snug (1.375)", value: "snug" },
              { label: "Normal (1.5)", value: "normal" },
              { label: "Relaxed (1.625)", value: "relaxed" },
              { label: "Loose (2)", value: "loose" },
            ],
          },
          defaultValue: "normal",
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
            "Restyles this paragraph below 768px only. The settings above keep controlling tablet and desktop.",
        },
        {
          type: "select",
          name: "mobileTextSize",
          label: "Mobile text size",
          condition: (data: ParagraphProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { value: "xs", label: "Extra small (text-xs)" },
              { value: "sm", label: "Small (text-sm)" },
              { value: "base", label: "Base (text-base)" },
              { value: "lg", label: "Large (text-lg)" },
              { value: "xl", label: "Extra large (text-xl)" },
              { value: "2xl", label: "2x large (text-2xl)" },
              { value: "3xl", label: "3x large (text-3xl)" },
              { value: "4xl", label: "4x large (text-4xl)" },
              { value: "5xl", label: "5x large (text-5xl)" },
              { value: "6xl", label: "6x large (text-6xl)" },
              { value: "7xl", label: "7x large (text-7xl)" },
              { value: "8xl", label: "8x large (text-8xl)" },
              { value: "9xl", label: "9x large (text-9xl)" },
            ],
          },
          defaultValue: "base",
        },
        {
          type: "toggle-group",
          name: "mobileAlignment",
          label: "Mobile alignment",
          condition: (data: ParagraphProps) =>
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
        {
          type: "select",
          label: "Mobile letter spacing",
          name: "mobileLetterSpacing",
          condition: (data: ParagraphProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { label: "Tighter (-0.05em)", value: "tighter" },
              { label: "Tight (-0.025em)", value: "tight" },
              { label: "Normal (inherit)", value: "normal" },
              { label: "Wide (0.025em)", value: "wide" },
              { label: "Wider (0.05em)", value: "wider" },
              { label: "Widest (0.1em)", value: "widest" },
            ],
          },
          defaultValue: "normal",
        },
        {
          type: "select",
          label: "Mobile line height",
          name: "mobileLineHeight",
          condition: (data: ParagraphProps) =>
            data.enableMobileOverrides === true,
          configs: {
            options: [
              { label: "None (1)", value: "none" },
              { label: "Tight (1.25)", value: "tight" },
              { label: "Snug (1.375)", value: "snug" },
              { label: "Normal (1.5)", value: "normal" },
              { label: "Relaxed (1.625)", value: "relaxed" },
              { label: "Loose (2)", value: "loose" },
            ],
          },
          defaultValue: "normal",
        },
      ],
    },
  ],
});
