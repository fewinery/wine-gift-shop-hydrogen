import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface AlternatingContentProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function AlternatingContent(props: AlternatingContentProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default AlternatingContent;

export const schema = createSchema({
  type: "alternating-content",
  title: "Alternating Content",
  childTypes: ["alternating-content--header", "alternating-content--items"],
  settings: [...sectionSettings],
  presets: {
    children: [
      {
        type: "alternating-content--header",
        children: [
          {
            type: "heading",
            content: "Section Heading",
            as: "h2",
          },
        ],
      },
      {
        type: "alternating-content--items",
        children: [
          {
            type: "alternating-content-item",
            imagePosition: "left",
          },
          {
            type: "alternating-content-item",
            imagePosition: "right",
          },
          {
            type: "alternating-content-item",
            imagePosition: "left",
          },
        ],
      },
    ],
  },
});
