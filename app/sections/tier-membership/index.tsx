import { createSchema } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface TierMembershipProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function TierMembership(props: TierMembershipProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default TierMembership;

export const schema = createSchema({
  type: "tier-membership",
  title: "Tier Membership",
  childTypes: ["tier-membership--header", "tier-membership--items"],
  settings: [...sectionSettings],
  presets: {
    gap: 16,
    children: [
      {
        type: "tier-membership--header",
        children: [
          {
            type: "heading",
            content: "Complimentary Tastings for Our WinePlus Loyalty Members",
            as: "h2",
          },
        ],
      },
      {
        type: "tier-membership--items",
        children: [
          {
            type: "tier-membership--item",
            title: "WINEPLUS",
            tierName: "BRONZE",
            description: "<p>EMAIL & SMS SIGNUP</p>",
            benefits:
              "<ul><li>Access to wine tasting reservations at standard tasting fees</li><li>Standard shipping rates</li><li>5% off wines and gift sets across the brand portfolio</li><li>5% off merchandise across the brand portfolio</li><li>Access to new releases and library wines</li><li>Access to special promotions and member-only offers</li></ul>",
          },
          {
            type: "tier-membership--item",
            title: "WINEPLUS",
            tierName: "SILVER",
            description:
              "<p>SPEND $300+ A YEAR<br>LIFETIME STATUS AFTER $3,000 SPEND</p>",
            benefits:
              "<ul><li>One complimentary wine tasting per year (up to X guests)</li><li>$15 flat-rate ground shipping</li><li>15% off wines and gift sets across the brand portfolio</li><li>15% off merchandise across the brand portfolio</li><li>Exclusive access to new releases, library wines, and member-only wines</li><li>Exclusive access to special promotions and member-only offers</li><li>Milestone bonus</li></ul>",
          },
          {
            type: "tier-membership--item",
            title: "WINEPLUS",
            tierName: "GOLD",
            description:
              "<p>SPEND $800+ A YEAR<br>LIFETIME STATUS AFTER $5,000 SPEND</p>",
            benefits:
              "<ul><li>Two complimentary wine tastings per year (up to X guests)</li><li>$10 flat-rate ground shipping</li><li>20% off wines and gift sets across the brand portfolio</li><li>15% off merchandise across the brand portfolio</li><li>Exclusive access to new releases, library wines, and member-only wines</li><li>Exclusive access to special promotions & member-only offers</li><li>Milestone bonus</li></ul>",
          },
          {
            type: "tier-membership--item",
            title: "WINEPLUS",
            tierName: "PLATINUM",
            description:
              "<p>SPEND $1500+ A YEAR<br>LIFETIME STATUS AFTER $10,000 SPEND</p>",
            benefits:
              "<ul><li>Four complimentary wine tastings per year (up to X guests)</li><li>Free ground shipping</li><li>25% off wines and gift sets across the brand portfolio</li><li>20% off merchandise across the brand portfolio</li><li>Priority access to new releases, library wines, and member-only wines</li><li>Priority access to special promotions and member-only offers</li><li>Milestone bonus</li><li>Personalized annual birthday gift</li></ul>",
          },
        ],
      },
    ],
  },
});
