import { createSchema } from "@weaverse/hydrogen";
import { Section, type SectionProps, sectionSettings } from "~/components/section";

interface TierMembershipProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
}

function TierMembership(props: TierMembershipProps) {
  const { children, ref, heading, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="mb-12 text-center font-henderson-slab text-[45px] uppercase">
          {heading}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </Section>
  );
}

export default TierMembership;

export const schema = createSchema({
  type: "tier-membership",
  title: "Tier Membership",
  childTypes: ["tier-membership--item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Complimentary Tastings for Our WinePlus Loyalty Members",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    heading: "Complimentary Tastings for Our WinePlus Loyalty Members",
    gap: 16,
    children: [
      {
        type: "tier-membership--item",
        title: "WINEPLUS",
        tierName: "BRONZE",
        description: "<p>EMAIL & SMS SIGNUP</p>",
        benefits: "<ul><li>Access to wine tasting reservations at standard tasting fees</li><li>Standard shipping rates</li><li>5% off wines and gift sets across the brand portfolio</li><li>5% off merchandise across the brand portfolio</li><li>Access to new releases and library wines</li><li>Access to special promotions and member-only offers</li></ul>",
      },
      {
        type: "tier-membership--item",
        title: "WINEPLUS",
        tierName: "SILVER",
        description: "<p>SPEND $300+ A YEAR<br>LIFETIME STATUS AFTER $3,000 SPEND</p>",
        benefits: "<ul><li>One complimentary wine tasting per year (up to X guests)</li><li>$15 flat-rate ground shipping</li><li>15% off wines and gift sets across the brand portfolio</li><li>15% off merchandise across the brand portfolio</li><li>Exclusive access to new releases, library wines, and member-only wines</li><li>Exclusive access to special promotions and member-only offers</li><li>Milestone bonus</li></ul>",
      },
      {
        type: "tier-membership--item",
        title: "WINEPLUS",
        tierName: "GOLD",
        description: "<p>SPEND $800+ A YEAR<br>LIFETIME STATUS AFTER $5,000 SPEND</p>",
        benefits: "<ul><li>Two complimentary wine tastings per year (up to X guests)</li><li>$10 flat-rate ground shipping</li><li>20% off wines and gift sets across the brand portfolio</li><li>15% off merchandise across the brand portfolio</li><li>Exclusive access to new releases, library wines, and member-only wines</li><li>Exclusive access to special promotions & member-only offers</li><li>Milestone bonus</li></ul>",
      },
      {
        type: "tier-membership--item",
        title: "WINEPLUS",
        tierName: "PLATINUM",
        description: "<p>SPEND $1500+ A YEAR<br>LIFETIME STATUS AFTER $10,000 SPEND</p>",
        benefits: "<ul><li>Four complimentary wine tastings per year (up to X guests)</li><li>Free ground shipping</li><li>25% off wines and gift sets across the brand portfolio</li><li>20% off merchandise across the brand portfolio</li><li>Priority access to new releases, library wines, and member-only wines</li><li>Priority access to special promotions and member-only offers</li><li>Milestone bonus</li><li>Personalized annual birthday gift</li></ul>",
      },
    ],
  },
});
