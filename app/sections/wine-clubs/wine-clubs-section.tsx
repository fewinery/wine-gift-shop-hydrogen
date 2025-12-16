import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
} from "@weaverse/hydrogen";
import { WineClubCard } from "~/components/wine-clubs/wine-club-card";
import type { WineClub } from "~/types/winehub";
import { cn } from "~/utils/cn";
import { fetchWineClubs } from "~/utils/winehub";

interface WineClubsSectionLoaderData {
  clubs: WineClub[];
  error: boolean;
}

interface WineClubsSectionProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLElement>;
  heading: string;
  description?: string;
  layout: "grid" | "list";
  columnsDesktop: number;
  columnsMobile: number;
  showDescriptions: boolean;
  loaderData?: WineClubsSectionLoaderData;
}

/**
 * WineClubsSection - Weaverse parent section for wine club listings
 *
 * @description Server-side rendered section that displays all wine clubs
 * Implements React 19 direct ref pattern (Constitutional Principle II)
 * Uses component loader for server-side data fetching (Research Decision 5)
 *
 * User Story 1 (P1): Wine Club Discovery
 * FR-009: Wine clubs listing MUST be implemented as Weaverse parent section with server-side data loader
 * FR-013: Support configurable settings (heading, description, layout, columns)
 */
export default function WineClubsSection(props: WineClubsSectionProps) {
  const {
    ref,
    heading,
    description,
    layout,
    columnsDesktop,
    columnsMobile,
    showDescriptions,
    loaderData,
    ...rest
  } = props;

  const clubs = loaderData?.clubs || [];
  const hasError = loaderData?.error;

  // Error state (FR-007: Handle API errors gracefully)
  if (hasError) {
    return (
      <section ref={ref} {...rest} className="py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">
              Wine clubs are currently unavailable. Please check back later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (clubs.length === 0) {
    return (
      <section ref={ref} {...rest} className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-3xl font-bold">{heading}</h2>
          {description && (
            <p className="mb-8 text-lg text-gray-600">{description}</p>
          )}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-600">
              No wine clubs available at this time.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Grid or list layout classes
  const gridClasses = cn(
    layout === "grid"
      ? `grid gap-6 grid-cols-${columnsMobile} md:grid-cols-${columnsDesktop}`
      : "flex flex-col gap-4",
  );

  return (
    <section ref={ref} {...rest} className="py-12">
      <div className="container mx-auto px-4">
        {/* Heading and Description */}
        <h2 className="mb-4 text-3xl font-bold">{heading}</h2>
        {description && (
          <p className="mb-8 text-lg text-gray-600">{description}</p>
        )}

        {/* Wine Clubs Grid/List */}
        <div className={gridClasses}>
          {clubs.map((club) => (
            <WineClubCard
              key={club.id}
              club={club}
              showDescription={showDescriptions}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Weaverse schema for visual editor configuration
 *
 * @description Defines configurable settings in Weaverse Studio
 * FR-013: Heading, description, layout, columns, showDescriptions
 */
export const schema = createSchema({
  type: "wine-clubs-section",
  title: "Wine Clubs",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Explore Our Wine Clubs",
          placeholder: "Enter section heading",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue: "",
          placeholder: "Enter optional description",
        },
        {
          type: "switch",
          name: "showDescriptions",
          label: "Show Club Descriptions",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          name: "layout",
          label: "Layout Style",
          defaultValue: "grid",
          configs: {
            options: [
              { label: "Grid", value: "grid" },
              { label: "List", value: "list" },
            ],
          },
        },
        {
          type: "range",
          name: "columnsDesktop",
          label: "Columns (Desktop)",
          defaultValue: 3,
          configs: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        {
          type: "range",
          name: "columnsMobile",
          label: "Columns (Mobile)",
          defaultValue: 1,
          configs: {
            min: 1,
            max: 2,
            step: 1,
          },
        },
      ],
    },
  ],
});

/**
 * Component loader for server-side data fetching
 *
 * @description Fetches wine clubs from Winehub API on server
 * Implements FR-006: Server-side caching with Cache-Control headers
 * Research Decision 5: Component loader for domain data (Winehub)
 *
 * @returns Wine clubs data or error state
 */
export const loader = async (args: ComponentLoaderArgs) => {
  const { weaverse } = args;
  try {
    const clubs = await fetchWineClubs({ context: weaverse as any });
    console.log("[WineClubsSection] Loader data:", clubs);
    return { clubs, error: false };
  } catch (error) {
    console.error("[WineClubsSection] Loader failed:", error);
    return { clubs: [], error: true };
  }
};
