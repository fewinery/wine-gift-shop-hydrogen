import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";

interface FeaturedWineClubsProps extends SectionProps {
  ref: React.Ref<HTMLElement>;
}

export default function FeaturedWineClubs(props: FeaturedWineClubsProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest} overflow="unset">
      {children}
    </Section>
  );
}

export const schema = createSchema({
  type: "featured-wine-clubs",
  title: "Featured wine clubs",
  childTypes: ["featured-wine-clubs--header", "featured-wine-clubs--items"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    gap: 32,
    children: [
      { type: "featured-wine-clubs--header" },
      { type: "featured-wine-clubs--items" },
    ],
  },
});
