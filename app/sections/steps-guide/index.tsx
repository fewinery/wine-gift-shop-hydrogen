import { createSchema } from "@weaverse/hydrogen";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface StepsGuideProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading: string;
}

function StepsGuide(props: StepsGuideProps) {
  const { heading, children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="text-center text-[37px] font-medium">{heading}</h2>
      )}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4 lg:gap-[48px]">
        {children}
      </div>
    </Section>
  );
}

export default StepsGuide;

export const schema = createSchema({
  type: "steps-guide",
  title: "Steps Guide",
  limit: 1,
  childTypes: ["steps-guide--item"],
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
          defaultValue: "STEPS GUIDE",
        },
      ],
    },
  ],
  presets: {
    heading: "STEPS GUIDE",
    children: [
      {
        type: "steps-guide--item",
        stepGuideItem: "Step 1",
        title: "Choose Your Frequency",
        description:
          "Choose between monthly, bi-monthly, quarterly, or bi-annually",
      },
      {
        type: "steps-guide--item",
        itemLabel: "Step 2",
        title: "Customize Your Shipment",
        description:
          "Select 2 to 12 bottles with the option to personalize wine selections",
      },
      {
        type: "steps-guide--item",
        itemLabel: "Step 3",
        title: "Enjoy Your Wine",
        description:
          "Place your order and your wines will ship within 2 business days",
      },
      {
        type: "steps-guide--item",
        itemLabel: "Step 4",
        title: "Earn Loyalty Rewards",
        description:
          "Every dollar spent will go towards your WinePlus loyalty status",
      },
    ],
  },
});
