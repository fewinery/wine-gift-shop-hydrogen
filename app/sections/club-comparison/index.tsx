import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface ClubComparisonProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
}

function ClubComparison(props: ClubComparisonProps) {
  const { children, ref, heading, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <h2 className="mb-12 text-center font-henderson-slab text-[30px] uppercase lg:text-[37px]">
          {heading}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </Section>
  );
}

export default ClubComparison;

export const schema = createSchema({
  type: "club-comparison",
  title: "Club Comparison",
  childTypes: ["club-comparison--item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue:
            "Select a Club Membership That Matches Your Wine Preferences and Delivery Frequency.",
        },
      ],
    },
    ...sectionSettings,
  ],
  presets: {
    heading:
      "Select a Club Membership That Matches Your Wine Preferences and Delivery Frequency.",
    gap: 48,
    children: [
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "MONTHLY",
        clubName: "WINE LOVER",
        benefits:
          "<ul><li>Ships 12 times a year</li><li>Choose from 2, 3, or 4 bottles per shipment</li><li>10% off first club shipment</li><li>Option to personalize your wine selections</li><li>Flat-rate club shipping $XX</li><li>Wine Lover club discounted merchandise option</li><li>Spend will automatically go towards your WinePlus loyalty status</li><li>No contracts, no commitment; edit or cancel anytime</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "BI-MONTHLY",
        clubName: "SIGNATURE SELECT",
        benefits:
          "<ul><li>Ships 6 times a year</li><li>Choose from 2, 3, 4 or 6 bottles per shipment</li><li>10% off first club shipment</li><li>Option to personalize your wine selections</li><li>Flat-rate club shipping $XX</li><li>Signature Select club discounted merchandise option</li><li>Spend will automatically go towards your WinePlus loyalty status</li><li>No contracts, no commitment; edit or cancel anytime</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "QUARTERLY",
        clubName: "FOUR SEASONS",
        benefits:
          "<ul><li>Ships 4 times a year</li><li>Choose from 2, 3, 4, or 6 bottles per shipment</li><li>10% off first club shipment</li><li>Option to personalize your wine selections</li><li>Flat-rate club shipping $XX</li><li>Four Seasons club discounted merchandise option</li><li>Spend will automatically go towards your WinePlus loyalty status</li><li>No contracts, no commitment; edit or cancel anytime</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "BI-ANNUAL (3 BOTTLE)",
        clubName: "WINEMAKER SELECT",
        benefits:
          "<ul><li>Ships 2 times a year (Spring & Fall)</li><li>3 bottles of Winemaker's handpicked wines</li><li>Option to personalize your wine selections</li><li>Welcome package and gift ($30 value)</li><li>Optional keepsake 3-bottle wooden crate for $25</li><li>Spend will automatically go towards your WinePlus loyalty status</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "BI-ANNUAL (6 BOTTLE)",
        clubName: "WINEMAKER PREMIUM",
        benefits:
          "<ul><li>Ships 2 times a year (Spring & Fall)</li><li>6 bottles of Winemaker's handpicked wines</li><li>Option to personalize your wine selections</li><li>Welcome package and gift ($30 value)</li><li>Complimentary keepsake 6-bottle wooden crate</li><li>Spend will automatically go towards your WinePlus loyalty status</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
      {
        type: "club-comparison--item",
        image: IMAGES_PLACEHOLDERS.image,
        frequency: "BI-ANNUAL (12 BOTTLE)",
        clubName: "WINEMAKER DELUXE",
        benefits:
          "<ul><li>Ships 2 times a year (Spring & Fall)</li><li>12 bottles of Winemaker's handpicked wines</li><li>Option to personalize your wine selections</li><li>Welcome package and gift ($30 value)</li><li>Complimentary keepsake 6-bottle wooden crate</li><li>Spend will automatically go towards your WinePlus loyalty status</li></ul>",
        buttonText: "GET STARTED",
        buttonLink: "#",
      },
    ],
  },
});
