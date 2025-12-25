import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  useThemeSettings,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface HeroImageData extends VariantProps<typeof variants> {
  heightOnDesktop?: number;
  heightOnMobile?: number;
}

export interface HeroImageProps extends HeroImageData {
  ref: React.Ref<HTMLElement>;
}

const variants = cva(
  "flex flex-col [&_.paragraph]:mx-[unset] [&_.heading]:max-w-[700px] [&_.paragraph]:max-w-[700px]",
  {
    variants: {
      height: {
        small: "min-h-[40vh] lg:min-h-[50vh]",
        medium: "min-h-[50vh] lg:min-h-[60vh]",
        large: "min-h-[70vh] lg:min-h-[80vh]",
        full: "",
        custom: "",
      },
      enableTransparentHeader: {
        true: "",
        false: "",
      },
      contentPosition: {
        "top left": "items-start justify-start [&_.paragraph]:text-left",
        "top center": "items-center justify-start [&_.paragraph]:text-center",
        "top right": "items-end justify-start [&_.paragraph]:text-right",
        "center left": "items-start justify-center [&_.paragraph]:text-left",
        "center center":
          "items-center justify-center [&_.paragraph]:text-center",
        "center right": "items-end justify-center [&_.paragraph]:text-right",
        "bottom left": "items-start justify-end [&_.paragraph]:text-left",
        "bottom center": "items-center justify-end [&_.paragraph]:text-center",
        "bottom right": "items-end justify-end [&_.paragraph]:text-right",
      },
    },
    compoundVariants: [
      {
        height: "full",
        enableTransparentHeader: true,
        className: "h-screen-no-topbar",
      },
      {
        height: "full",
        enableTransparentHeader: false,
        className: "h-screen-dynamic",
      },
    ],
    defaultVariants: {
      height: "large",
      contentPosition: "center center",
    },
  },
);

export default function HeroImage(props: HeroImageProps & SectionProps) {
  const {
    ref,
    children,
    height,
    heightOnDesktop,
    heightOnMobile,
    contentPosition,
    ...rest
  } = props;
  const { enableTransparentHeader } = useThemeSettings();

  const customStyle =
    height === "custom"
      ? ({
          "--desktop-height": `${heightOnDesktop}px`,
          "--mobile-height": `${heightOnMobile}px`,
        } as React.CSSProperties)
      : undefined;

  return (
    <Section
      ref={ref}
      {...rest}
      style={customStyle}
      containerClassName={`${variants({
        contentPosition,
        height,
        enableTransparentHeader,
      })} ${height === "custom" ? "min-h-(--mobile-height) lg:min-h-(--desktop-height)" : ""}`}
    >
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "hero-image",
  title: "Hero image",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "height",
          label: "Section height",
          configs: {
            options: [
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "full", label: "Fullscreen" },
              { value: "custom", label: "Custom" },
            ],
          },
        },
        {
          type: "range",
          name: "heightOnDesktop",
          label: "Height on desktop",
          defaultValue: 650,
          configs: {
            min: 400,
            max: 900,
            step: 10,
            unit: "px",
          },
          condition: (data: HeroImageProps) => data.height === "custom",
        },
        {
          type: "range",
          name: "heightOnMobile",
          label: "Height on mobile",
          defaultValue: 400,
          configs: {
            min: 250,
            max: 600,
            step: 10,
            unit: "px",
          },
          condition: (data: HeroImageProps) => data.height === "custom",
        },
        {
          type: "position",
          name: "contentPosition",
          label: "Content position",
          defaultValue: "center center",
        },
        ...layoutInputs.filter(
          (inp) => inp.name !== "divider" && inp.name !== "borderRadius",
        ),
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
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    height: "large",
    contentPosition: "center center",
    backgroundImage: IMAGES_PLACEHOLDERS.banner_1,
    backgroundFit: "cover",
    enableOverlay: true,
    overlayOpacity: 40,
    children: [
      {
        type: "subheading",
        content: "Subheading",
        color: "#ffffff",
      },
      {
        type: "heading",
        content: "Hero image with text overlay",
        as: "h2",
        color: "#ffffff",
        size: "default",
      },
      {
        type: "paragraph",
        content:
          "Use this text to share information about your brand with your customers. Describe a product, share announcements, or welcome customers to your store.",
        color: "#ffffff",
      },
    ],
  },
});
