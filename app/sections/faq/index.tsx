import { createSchema } from "@weaverse/hydrogen";
import { Section, type SectionProps, sectionSettings } from "~/components/section";

interface FaqSectionProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
}

const FaqSection = (props: FaqSectionProps) => {
  const {
    ref,
    heading,
    description,
    buttonLabel,
    buttonLink,
    children,
    ...rest
  } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className="flex gap-12">
        <div className="w-2/5 space-y-6">
          <h2 className="font-henderson-slab text-4xl font-black uppercase tracking-tight text-black sm:text-5xl">
            {heading}
          </h2>
          <div
            className="prose prose-base text-black font-body"
            dangerouslySetInnerHTML={{ __html: description }}
          />
          {buttonLabel && (
            <div className="pt-2">
              <a
                href={buttonLink || "#"}
                className="inline-flex items-center justify-center border-2 border-black bg-transparent px-8 py-3 text-base font-bold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
              >
                {buttonLabel}
              </a>
            </div>
          )}
        </div>

        <div className="w-3/5">
          <div className="border-t border-black">
            {children}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default FaqSection;

export const schema = createSchema({
  type: "faq-accordion",
  title: "FAQ Accordion",
  childTypes: ["faq-accordion-item"],
  inspector: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Header",
        },
        {
          type: "richtext",
          name: "description",
          label: "Description",
          defaultValue: "<p>Description</p>",
        },
        {
          type: "text",
          name: "buttonLabel",
          label: "Button Label",
          defaultValue: "Button Label",
        },
        {
          type: "text",
          name: "buttonLink",
          label: "Button Link",
          defaultValue: "#",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    children: [
      {
        type: "faq-accordion-item",
        question: "Question 1",
        answer: "<p>Answer 1</p>",
      },
      {
        type: "faq-accordion-item",
        question: "Question 2",
        answer: "<p>Answer 2</p>",
      },
      {
        type: "faq-accordion-item",
        question: "Question 3",
        answer: "<p>Answer 3</p>",
      },
    ],
  },
});
