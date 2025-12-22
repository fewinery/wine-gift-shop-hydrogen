import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface BrandStoryContentProps extends HydrogenComponentProps {
  gap?: number;
  ref?: React.Ref<HTMLDivElement>;
}

function BrandStoryContent(props: BrandStoryContentProps) {
  const { children, gap, ref, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex w-1/2 flex-col items-start justify-center"
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
}

export default BrandStoryContent;

export const schema = createSchema({
  type: "brand-story--content",
  title: "Content",
  limit: 1,
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Items spacing",
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
          defaultValue: 20,
        },
      ],
    },
  ],
  childTypes: ["subheading", "heading", "paragraph", "button"],
  presets: {
    gap: 20,
    children: [
      {
        type: "subheading",
        content: "Subheading",
      },
      {
        type: "heading",
        content: "Section heading",
      },
      {
        type: "paragraph",
        content: "Pair text with an image to tell a story.",
      },
      {
        type: "button",
        text: "Button text",
      },
    ],
  },
});
