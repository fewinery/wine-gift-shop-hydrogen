import {
  createSchema,
  type HydrogenComponentProps,
  useParentInstance,
} from "@weaverse/hydrogen";
import { WineClubCard } from "~/components/wine-clubs/wine-club-card";

interface WineClubItemProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  index: number;
}

/**
 * WineClubItem - Weaverse child component for individual wine club display
 *
 * @description Child component that accesses parent WineClubsSection data
 * Implements React 19 direct ref pattern (Constitutional Principle II)
 * FR-010: Wine club items MUST use useParentInstance() to access parent data
 *
 * User Story 1 (P1): Wine Club Discovery - Individual club display
 */
export default function WineClubItem(props: WineClubItemProps) {
  const { ref, index, ...rest } = props;

  // Access parent WineClubsSection data (FR-010)
  const parent = useParentInstance();
  const clubs = parent?.data?.loaderData?.clubs || [];
  const showDescriptions = parent?.data?.showDescriptions ?? true;

  // Get the wine club at this index
  const club = clubs[index];

  if (!club) {
    return null;
  }

  return (
    <div ref={ref} {...rest}>
      <WineClubCard club={club} showDescription={showDescriptions} />
    </div>
  );
}

/**
 * Weaverse schema for WineClubItem
 *
 * @description Child component schema - inherits data from parent
 * Allows individual wine club customization if needed
 */
export const schema = createSchema({
  type: "wine-club-item",
  title: "Wine Club Item",
  settings: [
    {
      group: "Settings",
      inputs: [
        {
          type: "range",
          name: "index",
          label: "Club Index",
          defaultValue: 0,
          helpText: "Index of the wine club to display (0-based)",
          configs: {
            min: 0,
            max: 20,
            step: 1,
          },
        },
      ],
    },
  ],
});
