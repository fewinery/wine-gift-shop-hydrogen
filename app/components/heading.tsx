import {
  createSchema,
  type HydrogenComponentProps,
  type InspectorGroup,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { CSSProperties } from "react";
import { cn } from "~/utils/cn";

const fontSizeVariants = cva("", {
  variants: {
    mobileSize: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
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
    desktopSize: {
      xs: "md:text-xs",
      sm: "md:text-sm",
      base: "md:text-base",
      lg: "md:text-lg",
      xl: "md:text-xl",
      "2xl": "md:text-2xl",
      "3xl": "md:text-3xl",
      "4xl": "md:text-4xl",
      "5xl": "md:text-5xl",
      "6xl": "md:text-6xl",
      "7xl": "md:text-7xl",
      "8xl": "md:text-8xl",
      "9xl": "md:text-9xl",
    },
  },
});

const variants = cva("heading font-heading", {
  variants: {
    size: {
      default: "",
      custom: "",
      scale: "text-scale",
    },
    weight: {
      "100": "font-thin",
      "200": "font-extralight",
      "300": "font-light",
      "400": "font-normal",
      "500": "font-medium",
      "600": "font-semibold",
      "700": "font-bold",
      "800": "font-extrabold",
      "900": "font-black",
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
    size: "default",
    weight: "400",
    letterSpacing: "normal",
    lineHeight: "normal",
    alignment: "center",
  },
});

export interface HeadingProps
  extends VariantProps<typeof variants>,
    VariantProps<typeof fontSizeVariants> {
  ref?: React.Ref<HTMLHeadingElement>;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  content: string;
  color?: string;
  backgroundColor?: string;
  minSize?: number;
  maxSize?: number;
  animate?: boolean;
}

function Heading(props: HeadingProps & Partial<HydrogenComponentProps>) {
  const {
    ref,
    as: Tag = "h4",
    content,
    size,
    mobileSize,
    desktopSize,
    color,
    backgroundColor,
    weight,
    letterSpacing,
    lineHeight,
    alignment,
    minSize,
    maxSize,
    className,
    animate = true,
    ...rest
  } = props;
  let style: CSSProperties = { color, backgroundColor };
  if (size === "scale") {
    style = {
      ...style,
      "--min-size-px": `${minSize}px`,
      "--min-size": minSize,
      "--max-size": maxSize,
    } as CSSProperties;
  }
  if (animate) {
    rest["data-motion"] = "fade-up";
  }
  return (
    <Tag
      ref={ref}
      {...rest}
      style={style}
      className={cn(
        size === "custom" && fontSizeVariants({ mobileSize, desktopSize }),
        variants({
          size,
          weight,
          letterSpacing,
          lineHeight,
          alignment,
          className,
        }),
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default Heading;

export const headingInputs: InspectorGroup["inputs"] = [
  {
    type: "richtext",
    name: "content",
    label: "Content",
    defaultValue: "Section heading",
    placeholder: "Section heading",
  },
  {
    type: "select",
    name: "as",
    label: "Html tag",
    configs: {
      options: [
        { value: "h1", label: "<h1> (heading 1)" },
        { value: "h2", label: "<h2> (heading 2)" },
        { value: "h3", label: "<h3> (heading 3)" },
        { value: "h4", label: "<h4> (heading 4)" },
        { value: "h5", label: "<h5> (heading 5)" },
        { value: "h6", label: "<h6> (heading 6)" },
      ],
    },
    defaultValue: "h4",
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
        { value: "default", label: "Default" },
        { value: "scale", label: "Auto scale" },
        { value: "custom", label: "Custom" },
      ],
    },
    defaultValue: "default",
  },
  {
    type: "range",
    name: "minSize",
    label: "Minimum scale size",
    configs: {
      min: 12,
      max: 32,
      step: 1,
      unit: "px",
    },
    defaultValue: 16,
    condition: (data: HeadingProps) => data.size === "scale",
  },
  {
    type: "range",
    name: "maxSize",
    label: "Maximum scale size",
    configs: {
      min: 40,
      max: 96,
      step: 1,
      unit: "px",
    },
    defaultValue: 64,
    condition: (data: HeadingProps) => data.size === "scale",
    helpText:
      'See how scale text works <a href="https://css-tricks.com/snippets/css/fluid-typography/" target="_blank" rel="noreferrer">here</a>.',
  },
  {
    type: "select",
    name: "mobileSize",
    label: "Mobile text size",
    condition: (data: HeadingProps) => data.size === "custom",
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
    defaultValue: "3xl",
  },
  {
    type: "select",
    name: "desktopSize",
    label: "Desktop text size",
    condition: (data: HeadingProps) => data.size === "custom",
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
    defaultValue: "5xl",
  },
  {
    type: "select",
    name: "weight",
    label: "Weight",
    configs: {
      options: [
        { value: "100", label: "100 - thin" },
        { value: "200", label: "200 - extra light" },
        { value: "300", label: "300 - light" },
        { value: "400", label: "400 - normal" },
        { value: "500", label: "500 - medium" },
        { value: "600", label: "600 - semi bold" },
        { value: "700", label: "700 - bold" },
        { value: "800", label: "800 - extra bold" },
        { value: "900", label: "900 - black" },
      ],
    },
    defaultValue: "400",
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
];

export const schema = createSchema({
  type: "heading",
  title: "Heading",
  settings: [
    {
      group: "Heading",
      inputs: headingInputs,
    },
  ],
});
