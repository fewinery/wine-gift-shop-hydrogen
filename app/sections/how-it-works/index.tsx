import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { type SectionProps, layoutInputs } from "~/components/section";
import { Section } from "~/components/section";

interface HowItWorksProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading: string;
}

function HowItWorks(props: HowItWorksProps) {
  const { heading, children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="mb-12 text-center text-[40px] font-medium uppercase md:mb-16">
          {heading}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </Section>
  );
}

export default HowItWorks;

export const schema = createSchema({
  type: "how-it-works",
  title: "How It Works",
  limit: 1,
  childTypes: ["how-it-works--step"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs,
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Section Heading",
          defaultValue: "HOW IT WORKS",
        },
      ],
    },
  ],
  presets: {
    heading: "HOW IT WORKS",
    children: [
      {
        type: "how-it-works--step",
        stepLabel: "Step 1",
        title: "Choose Your Frequency",
        description:
          "Choose between monthly, bi-monthly, quarterly, or bi-annually",
      },
      {
        type: "how-it-works--step",
        stepLabel: "Step 2",
        title: "Customize Your Shipment",
        description:
          "Select 2 to 12 bottles with the option to personalize wine selections",
      },
      {
        type: "how-it-works--step",
        stepLabel: "Step 3",
        title: "Enjoy Your Wine",
        description:
          "Place your order and your wines will ship within 2 business days",
      },
      {
        type: "how-it-works--step",
        stepLabel: "Step 4",
        title: "Earn Loyalty Rewards",
        description:
          "Every dollar spent will go towards your WinePlus loyalty status",
      },
    ],
  },
});
