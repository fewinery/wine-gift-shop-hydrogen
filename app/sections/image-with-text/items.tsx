import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

interface ImageWithTextItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  reverseLayout?: boolean;
  gap?: number;
}

function ImageWithTextItems(props: ImageWithTextItemsProps) {
  const { ref, children, reverseLayout = false, gap = 40, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        "flex flex-col",
        reverseLayout ? "md:flex-row-reverse" : "md:flex-row",
      )}
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
}

export default ImageWithTextItems;

export const schema = createSchema({
  type: "image-with-text--items",
  title: "Items",
  childTypes: ["image-with-text--image", "image-with-text--content"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "switch",
          name: "reverseLayout",
          label: "Reverse layout",
          defaultValue: false,
          helpText: "Switch image and text positions",
        },
        {
          type: "range",
          name: "gap",
          label: "Gap between image and content",
          defaultValue: 40,
          configs: {
            min: 4,
            max: 80,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
});
