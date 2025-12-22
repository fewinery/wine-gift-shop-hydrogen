import type { HydrogenComponentProps } from "@weaverse/hydrogen";
import { createSchema } from "@weaverse/hydrogen";
import { cn } from "~/utils/cn";

interface ComparisonColumnProps extends HydrogenComponentProps {
  title: string;
  features: string;
  buttonText: string;
  buttonLink: string;
  headerBgColor: string;
  headerTextColor: string;
  ref?: React.Ref<HTMLDivElement>;
}

function ComparisonColumn(props: ComparisonColumnProps) {
  const {
    title,
    features,
    buttonText,
    buttonLink,
    headerBgColor,
    headerTextColor,
    ref,
    ...rest
  } = props;

  const featureList = features ? features.split("\n") : [];

  return (
    <div
      ref={ref}
      {...rest}
      className="flex-1 min-w-[280px] sm:min-w-[200px] flex flex-col border-gray-200"
    >
      {/* Header */}
      <div
        className="h-16 px-4 py-2 flex items-center justify-center text-center font-bold uppercase tracking-wider text-sm md:text-base border-b border-gray-200"
        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
      >
        {title}
      </div>

      {/* Features Rows */}
      <div className="flex-1 flex flex-col">
        {featureList.map((feature, idx) => (
          <div
            key={idx}
            className={cn(
              "h-16 px-4 py-2 flex items-center justify-center text-center text-sm md:text-base border-b border-gray-200",
              idx % 2 === 0 ? "bg-white" : "bg-[#F9F9F9]"
            )}
          >
            <span>{feature}</span>
          </div>
        ))}
        {featureList.length === 0 && <div className="flex-1 min-h-[50px]" />}
      </div>

      {/* Button Footer */}
      <div className="h-16 p-4 bg-[#FAF9F5] flex items-center justify-center border-b border-gray-200">
        {buttonText && (
          <a
            href={buttonLink}
            className="px-6 py-3 bg-black text-white font-bold uppercase text-xs"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

export default ComparisonColumn;

export const schema = createSchema({
  type: "comparison-column",
  title: "Column",
  settings: [
    {
      group: "Column Details",
      inputs: [
        {
          type: "text",
          name: "title",
          label: "Plan Title",
          defaultValue: "Monthly Club",
        },
        {
          type: "color",
          name: "headerBgColor",
          label: "Header Background",
          defaultValue: "#EA9C2C",
        },
        {
          type: "color",
          name: "headerTextColor",
          label: "Header Text Color",
          defaultValue: "#ffffff",
        },
        {
          type: "textarea",
          name: "features",
          label: "Features (One per line)",
          defaultValue: "2\n$99\nFREE\n✓",
          placeholder: "Feature 1 Value\nFeature 2 Value\n...",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button Text",
          defaultValue: "JOIN NOW",
        },
        {
          type: "text",
          name: "buttonLink",
          label: "Button Link",
          defaultValue: "#",
        },
      ],
    },
  ],
});
