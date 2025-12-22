import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";

interface BrandStoryProps extends HydrogenComponentProps {
  backgroundColor: string;
  ref?: React.Ref<HTMLElement>;
}

function BrandStory(props: BrandStoryProps) {
  const { ref, backgroundColor, children, ...rest } = props;

  return (
    <section ref={ref} {...rest} className="py-16 md:py-[68px]" style={{ backgroundColor }}>
      <div className="mx-auto flex max-w-[1300px] gap-20">
        {children}
      </div>
    </section>
  );
}

export default BrandStory;

export const schema = createSchema({
  type: "brand-story",
  title: "Brand Story",
  childTypes: ["brand-story--image", "brand-story--content"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#FFFFFF",
        },
      ],
    },
  ],
  presets: {
    backgroundColor: "#FFFFFF",
    children: [
      { type: "brand-story--image", image: IMAGES_PLACEHOLDERS.image },
      { type: "brand-story--content" },
    ],
  },
});
