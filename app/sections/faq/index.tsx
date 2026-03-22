import { createSchema } from "@weaverse/hydrogen";
import { Link, linkInputs } from "~/components/link";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface FaqSectionProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading: string;
  description: string;
  buttonLabel?: string;
  buttonLink?: string;
  text?: string;
  to?: string;
  variant?: "primary" | "secondary" | "outline" | "custom";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColorHover?: string;
  textColorHover?: string;
  borderColorHover?: string;
}

const FaqSection = (props: FaqSectionProps) => {
  const {
    ref,
    heading,
    description,
    buttonLabel,
    buttonLink,
    text,
    to,
    variant = "primary",
    backgroundColor,
    textColor,
    borderColor,
    backgroundColorHover,
    textColorHover,
    borderColorHover,
    children,
    ...rest
  } = props;

  return (
    <Section ref={ref} {...rest}>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="w-full space-y-4 lg:w-2/5 lg:space-y-6">
          <h2 className="font-heading text-[37px] font-black text-black">
            {heading}
          </h2>
          {description && (
            <div
              className="prose prose-base text-black font-body"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {(text || buttonLabel) && (
            <div className="pt-2">
              <Link
                to={to || buttonLink || "#"}
                text={text || buttonLabel}
                variant={variant}
                backgroundColor={backgroundColor}
                textColor={textColor}
                borderColor={borderColor}
                backgroundColorHover={backgroundColorHover}
                textColorHover={textColorHover}
                borderColorHover={borderColorHover}
              />
            </div>
          )}
        </div>

        <div className="w-full lg:w-3/5">
          <div className="border-t border-black">{children}</div>
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
  settings: [
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
      ],
    },
    {
      group: "Button",
      inputs: linkInputs,
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
