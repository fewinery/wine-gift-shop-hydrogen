import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface BrandStoryProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function BrandStory(props: BrandStoryProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className="flex gap-20">{children}</div>
    </Section>
  );
}

export default BrandStory;

export const schema = createSchema({
  type: "brand-story",
  title: "Brand Story",
  childTypes: ["brand-story--image", "brand-story--content"],
  settings: [...sectionSettings],
  presets: {
    gap: 80,
    children: [
      { type: "brand-story--image", image: IMAGES_PLACEHOLDERS.image },
      { type: "brand-story--content" },
    ],
  },
});
