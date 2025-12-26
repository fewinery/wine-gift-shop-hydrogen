import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { CheckIcon } from "~/components/icons";

interface TierMembershipItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  title: string;
  tierName: string;
  description: string;
  benefits: string;
}

// Parse benefits HTML to extract text items
function parseBenefits(html: string): string[] {
  const matches = html.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
  return matches.map((item) => item.replace(/<\/?li[^>]*>/gi, "").trim());
}

const TierMembershipItem = (props: TierMembershipItemProps) => {
  const { ref, title, tierName, description, benefits, ...rest } = props;
  const benefitItems = parseBenefits(benefits);

  return (
    <div
      ref={ref}
      {...rest}
      className="flex h-full flex-col border border-black p-8 text-black"
    >
      <div className="pb-8 mb-8 h-[170px] space-y-2 border-b">
        <h4 className="font-henderson-slab text-[20px] font-medium uppercase">
          {title}
        </h4>
        <h3 className="font-henderson-slab text-[30px] uppercase">
          {tierName}
        </h3>
        <div dangerouslySetInnerHTML={{ __html: description }} />
      </div>

      <ul className="space-y-3">
        {benefitItems.map((item, index) => (
          <li key={index} className="flex gap-2.5">
            <CheckIcon className="w-5 h-5 mt-0.5 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TierMembershipItem;

export const schema = createSchema({
  type: "tier-membership--item",
  title: "Tier Item",
  settings: [
    {
      group: "Header",
      inputs: [
        {
          type: "text",
          name: "title",
          label: "Small Title",
          defaultValue: "WINEPLUS",
        },
        {
          type: "text",
          name: "tierName",
          label: "Tier Name",
          defaultValue: "BRONZE",
        },
        {
          type: "richtext",
          name: "description",
          label: "Description",
          defaultValue: "<p>EMAIL & SMS SIGNUP</p>",
        },
      ],
    },
    {
      group: "Benefits",
      inputs: [
        {
          type: "richtext",
          name: "benefits",
          label: "Benefits List",
          defaultValue:
            "<ul><li>Access to wine tasting reservations at standard tasting fees</li><li>Standard shipping rates</li><li>5% off wines and gift sets across the brand portfolio</li><li>5% off merchandise across the brand portfolio</li></ul>",
          helpText:
            "Use a bullet list for benefits. They will be styled with checkmarks automatically.",
        },
      ],
    },
  ],
});
