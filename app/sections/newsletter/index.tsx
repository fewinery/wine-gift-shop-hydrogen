import { createSchema } from "@weaverse/hydrogen";
import type { SectionProps } from "~/components/section";
import { Section } from "~/components/section";
import { backgroundInputs } from "~/components/background-image";

interface NewsLetterProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
  paragraph?: string;
}

function NewsLetter(props: NewsLetterProps) {
  const { children, heading, paragraph, ref, ...rest } = props;
  return (
    <Section ref={ref} {...rest} containerClassName="px-16 py-10 flex items-center justify-center">
      <div className="max-w-[700px] px-[5px] py-2.5 flex flex-col items-center justify-center">
        {heading && (
          <div className="text-[30px] font-bold px-1.5 py-2.5 text-center" dangerouslySetInnerHTML={{ __html: heading }} />
        )}
        {paragraph && (
          <div className="text-[18px] px-1.5 py-2.5 text-center" dangerouslySetInnerHTML={{ __html: paragraph }} />
        )}
        {children}
      </div>
    </Section>
  );
}

export default NewsLetter;

export const schema = createSchema({
  type: "newsletter",
  title: "Newsletter",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "richtext",
          name: "heading",
          label: "Heading",
          defaultValue: "Heading",
        },
        {
          type: "richtext",
          name: "paragraph",
          label: "Paragraph",
          defaultValue: "Paragraph",
        },
      ],
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  childTypes: ["newsletter-form"],
  presets: {
    gap: 20,
    heading: "Heading",
    paragraph: "Paragraph",
    children: [
      { type: "newsletter-form" },
    ],
  },
});
