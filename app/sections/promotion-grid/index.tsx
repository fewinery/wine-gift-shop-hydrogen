import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { backgroundInputs } from "~/components/background-image";
import { overlayInputs } from "~/components/overlay";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface PromotionGridProps
  extends VariantProps<typeof variants>,
  SectionProps {
  ref?: React.Ref<HTMLElement>;
}

const variants = cva("flex flex-col sm:grid gap-10 lg:gap-16", {
  variants: {
    gridSize: {
      "2x2": "sm:grid-cols-2",
      "3x3": "sm:grid-cols-3",
      "4x4": "sm:grid-cols-4",
    },
  },
  defaultVariants: {
    gridSize: "2x2",
  },
});

function PromotionGrid(props: PromotionGridProps) {
  const { children, gridSize, ref, ...rest } = props;
  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={variants({ gridSize })}
    >
      {children}
    </Section>
  );
}

export default PromotionGrid;

export const schema = createSchema({
  type: "promotion-grid",
  title: "Promotion grid",
  settings: [
    {
      group: "Grid",
      inputs: [
        {
          type: "toggle-group",
          name: "layout",
          label: "Item Layout",
          configs: {
            options: [
              { value: "overlay", label: "Overlay" },
              { value: "card", label: "Card" },
            ],
          },
          defaultValue: "overlay",
        },
        {
          type: "toggle-group",
          name: "gridSize",
          label: "Grid size",
          configs: {
            options: [
              { value: "2x2", label: "2x2" },
              { value: "3x3", label: "3x3" },
              { value: "4x4", label: "4x4" },
            ],
          },
          defaultValue: "2x2",
        },
      ],
    },
    { group: "Layout", inputs: layoutInputs },
    { group: "Background", inputs: backgroundInputs },
    { group: "Overlay", inputs: overlayInputs },
  ],
  childTypes: ["promotion-grid-item"],
  presets: {
    gridSize: "2x2",
    layout: "card",
    children: [
      {
        type: "promotion-grid-item",
        contentPosition: "center left",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_3,
        enableOverlay: false,
        children: [
          {
            type: "heading",
            content: "Explore Our Wine Collections",
          },
          {
            type: "paragraph",
            content:
              "Discover the perfect gift for any wine lover with our curated gift collections.",
          },
          {
            type: "promotion-item--buttons",
            children: [
              {
                type: "button",
                variant: "underline",
                text: "Shop >",
              },
            ],
          },
        ],
      },
      {
        type: "promotion-grid-item",
        contentPosition: "center left",
        backgroundImage: IMAGES_PLACEHOLDERS.collection_2,
        enableOverlay: false,
        children: [
          {
            type: "heading",
            content: "Uncover Exclusive Merchandise",
          },
          {
            type: "paragraph",
            content:
              "From stylish apparel to unique collectibles, our merchandise is designed for true fans.",
          },
          {
            type: "promotion-item--buttons",
            children: [
              {
                type: "button",
                variant: "underline",
                text: "Browse >",
              },
            ],
          },
        ],
      },
    ],
  },
});
