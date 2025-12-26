import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import { BackgroundImage } from "~/components/background-image";
import { Image } from "~/components/image";
import {
  Overlay,
  type OverlayProps,
  overlayInputs,
} from "~/components/overlay";
import type { ImageAspectRatio } from "~/types/others";
import { calculateAspectRatio } from "~/utils/image";

const variants = cva(
  [
    "promotion-grid-item",
    "group/overlay",
    "relative flex flex-col gap-4 overflow-hidden",
    "[&_.paragraph]:mx-[unset]",
  ],
  {
    variants: {
      layout: {
        overlay: "aspect-square p-4",
        card: "aspect-auto p-0",
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
      borderRadius: {
        0: "",
        2: "rounded-xs",
        4: "rounded-sm",
        6: "rounded-md",
        8: "rounded-lg",
        10: "rounded-[10px]",
        12: "rounded-xl",
        14: "rounded-[14px]",
        16: "rounded-2xl",
        18: "rounded-[18px]",
        20: "rounded-[20px]",
        22: "rounded-[22px]",
        24: "rounded-3xl",
        26: "rounded-[26px]",
        28: "rounded-[28px]",
        30: "rounded-[30px]",
        32: "rounded-[32px]",
        34: "rounded-[34px]",
        36: "rounded-[36px]",
        38: "rounded-[38px]",
        40: "rounded-[40px]",
      },
    },
    defaultVariants: {
      layout: "overlay",
    },
  },
);

interface PromotionItemProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps,
    OverlayProps {
  backgroundImage: WeaverseImage | string;
  imageAspectRatio: ImageAspectRatio;
  ref?: React.Ref<HTMLDivElement>;
}
function PromotionGridItem(props: PromotionItemProps) {
  const {
    contentPosition,
    backgroundImage,
    imageAspectRatio,
    borderRadius,
    children,
    enableOverlay,
    overlayColor,
    overlayColorHover,
    overlayOpacity,
    ref,
    ...rest
  } = props;

  const parent = useParentInstance();
  const layout = parent?.data?.layout || "overlay";

  return (
    <div
      ref={ref}
      {...rest}
      data-motion="slide-in"
      className={variants({ contentPosition, borderRadius, layout })}
    >
      {layout === "overlay" ? (
        <>
          <BackgroundImage backgroundImage={backgroundImage} />
          <Overlay
            enableOverlay={enableOverlay}
            overlayColor={overlayColor}
            overlayColorHover={overlayColorHover}
            overlayOpacity={overlayOpacity}
          />
          {children}
        </>
      ) : (
        <>
          {backgroundImage && (
            <div className="w-full shrink-0 overflow-hidden">
              <Image
                data={
                  typeof backgroundImage === "string"
                    ? { url: backgroundImage, altText: "Promotion" }
                    : backgroundImage
                }
                sizes="auto"
                className="h-full w-full object-cover transition-transform duration-500 group-hover/overlay:scale-105"
                aspectRatio={calculateAspectRatio(
                  typeof backgroundImage === "string"
                    ? { url: backgroundImage }
                    : backgroundImage,
                  imageAspectRatio,
                )}
              />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-3 py-6">{children}</div>
        </>
      )}
    </div>
  );
}

export default PromotionGridItem;

export const schema = createSchema({
  type: "promotion-grid-item",
  title: "Promotion",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "position",
          label: "Content position",
          name: "contentPosition",
          defaultValue: "center center",
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
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
        },
      ],
    },
    {
      group: "Background",
      inputs: [
        {
          type: "image",
          name: "backgroundImage",
          label: "Background image",
        },
        {
          type: "heading",
          label: "Overlay",
        },
        ...overlayInputs,
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "promotion-item--buttons"],
  presets: {
    contentPosition: "bottom right",
    backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
    enableOverlay: true,
    overlayColor: "#0c0c0c",
    overlayOpacity: 20,
    children: [
      {
        type: "heading",
        content: "Announce your promotion",
      },
      {
        type: "paragraph",
        content:
          "Include the smaller details of your promotion in text below the title.",
      },
      {
        type: "promotion-item--buttons",
        children: [
          {
            type: "button",
            content: "Shop now",
          },
        ],
      },
    ],
  },
});
