import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";
import { cn } from "~/utils/cn";

interface ComparisonTableProps extends SectionProps {
  heading: string;
  featureLabels: string;
  ref?: React.Ref<HTMLElement>;
}

function ComparisonTable(props: ComparisonTableProps) {
  const { heading, featureLabels, children, ref, ...rest } = props;
  const labels = featureLabels ? featureLabels.split("\n") : [];

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="text-center text-[37px] font-medium">{heading}</h2>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[768px] border border-gray-200 shadow-sm flex text-gray-900">
          {/* Feature Labels Column (Fixed Left Column) */}
          <div className="w-1/4 min-w-[240px] flex flex-col border-gray-200 bg-white">
            {/* Empty Header Cell to match columns header height */}
            <div className="h-16 bg-[#EA9C2C] border-b border-gray-200" />

            {/* Label Rows */}
            <div className="flex-1 flex flex-col">
              {labels.map((label, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-16 px-6 py-2 flex items-center text-sm md:text-base font-semibold text-gray-800 border-b border-gray-200",
                    idx % 2 === 0 ? "bg-white" : "bg-[#F9F9F9]",
                  )}
                >
                  {label}
                </div>
              ))}
              {labels.length === 0 && (
                <div className="flex-1 min-h-[50px] bg-white" />
              )}
            </div>

            {/* Footer Spacer to match button height */}
            <div className="h-16 bg-[#FAF9F5] border-b border-gray-200" />
          </div>

          {/* Children Columns (Plans) */}
          {children}
        </div>
      </div>
    </Section>
  );
}

export default ComparisonTable;

export const schema = createSchema({
  type: "comparison-table",
  title: "Comparison Table",
  childTypes: ["comparison-column"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Section Heading",
          defaultValue: "SELECT YOUR WINE CLUB",
        },
        {
          type: "textarea",
          name: "featureLabels",
          label: "Feature Labels (One per line)",
          defaultValue:
            "Number Bottles per Shipment\nAverage Price per Shipment\nShipping Cost on Club Shipments\nCustomizable Shipment",
          placeholder: "Feature 1\nFeature 2...",
          helpText:
            "Labels for the leftmost column. Ensure the number of lines matches the features in each column.",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    children: [
      {
        type: "comparison-column",
        title: "MONTHLY CLUB",
        features: "2\n$99\nFREE\n✓",
        buttonText: "JOIN NOW",
        headerBgColor: "#EA9C2C",
      },
      {
        type: "comparison-column",
        title: "QUARTERLY CLUB",
        features: "3 or 6\n$200-$450\n$15 Flat-Rate\n✓",
        buttonText: "JOIN NOW",
        headerBgColor: "#EA9C2C",
      },
      {
        type: "comparison-column",
        title: "BI-ANNUAL CLUB",
        features: "3 or 6\n$200-$450\n$20 Flat-Rate\n✓",
        buttonText: "JOIN NOW",
        headerBgColor: "#EA9C2C",
      },
    ],
  },
});
