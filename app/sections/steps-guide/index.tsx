import { createSchema } from "@weaverse/hydrogen";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface StepsGuideProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function StepsGuide(props: StepsGuideProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default StepsGuide;

export const schema = createSchema({
  type: "steps-guide",
  title: "Steps Guide",
  limit: 1,
  childTypes: ["steps-guide--header", "steps-guide--items"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs,
    },
  ],
  presets: {
    children: [
      {
        type: "steps-guide--header",
        children: [
          {
            type: "heading",
            content: "STEPS GUIDE",
            as: "h2",
          },
        ],
      },
      {
        type: "steps-guide--items",
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
    ],
  },
});
