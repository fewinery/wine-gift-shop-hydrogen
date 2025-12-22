import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface AlternatingContentProps extends SectionProps {
  heading: string;
  ref?: React.Ref<HTMLElement>;
}

function AlternatingContent(props: AlternatingContentProps) {
  const { heading, children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="text-center text-[40px] font-medium font-henderson-slab">
          {heading}
        </h2>
      )}
      <div className="space-y-20">{children}</div>
    </Section>
  );
}

export default AlternatingContent;

export const schema = createSchema({
  type: "alternating-content",
  title: "Alternating Content",
  childTypes: ["alternating-content-item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Section Heading",
          defaultValue: "Section Heading",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    heading: "Section Heading",
    children: [
      {
        type: "alternating-content-item",
        imagePosition: "left",
        heading: "Heading 1",
        description: "<p>Description</p>",
      },
      {
        type: "alternating-content-item",
        imagePosition: "right",
        heading: "Heading 2",
        description: "<p>Description</p>",
      },
      {
        type: "alternating-content-item",
        imagePosition: "left",
        heading: "Heading 3",
        description: "<p>Description</p>",
      },
    ],
  },
});
