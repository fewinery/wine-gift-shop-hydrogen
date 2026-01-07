import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";

export interface ParagraphProps
  extends VariantProps<typeof variants>,
    Partial<HydrogenComponentProps> {
  ref?: React.Ref<HTMLParagraphElement | HTMLDivElement>;
  as?: "p" | "div";
  content: string;
  color?: string;
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
      ],
    },
  ],
});
