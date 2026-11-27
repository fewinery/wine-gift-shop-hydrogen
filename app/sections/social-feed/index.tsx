import { createSchema } from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { Section, sectionSettings } from "~/components/section";

interface SocialFeedProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function SocialFeed(props: SocialFeedProps) {
  const { children, ref, ...rest } = props;
  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default SocialFeed;

export const schema = createSchema({
  type: "social-feed",
  title: "Social feed",
  settings: sectionSettings,
  childTypes: ["heading", "subheading", "paragraph", "social-feed--items"],
  presets: {
    children: [
      {
        type: "heading",
        content: "As seen on social",
      },
      {
        type: "paragraph",
        content:
          "Favorite moments from our own channels and from the creators who love our wines.",
      },
      {
        type: "social-feed--items",
        children: [
          {
            type: "social-feed--item",
            postUrl:
              "https://www.tiktok.com/@scout2015/video/6718335390845095173",
            creatorName: "@scout2015",
            source: "influencer",
          },
        ],
      },
    ],
  },
});
