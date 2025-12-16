import {
  type ComponentLoaderArgs,
  createSchema,
  type HydrogenComponentProps,
} from "@weaverse/hydrogen";
import type React from "react";
import SelectionWizardContainer from "~/components/wine-clubs/selection-wizard-container";
import type { WineClubDetails } from "~/types/winehub";
import { cn } from "~/utils/cn";
import { fetchWineClubDetails } from "~/utils/winehub";

/**
 * Wine Club Selection Wizard Section
 *
 * @description Weaverse section for the 5-step wine club selection process
 * Integrates with Winehub API for real-time wine club data
 *
 * User Story 2 (P2): Wine Club Selection Process
 * Features: Visual editor integration, server-side data loading, responsive design
 */

interface WineClubSelectionWizardProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLElement>;
  loaderData?: WineClubDetails;
  heading?: string;
  description?: string;
  showStepNumbers?: boolean;
  allowStepNavigation?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export default function WineClubSelectionWizard(
  props: WineClubSelectionWizardProps,
) {
  const {
    ref,
    loaderData,
    heading,
    description,
    showStepNumbers,
    allowStepNavigation,
    backgroundColor,
    textColor,
    ...rest
  } = props;

  const wineClub = loaderData;

  if (!wineClub) {
    return (
      <section ref={ref} {...rest} className={cn("py-12", backgroundColor)}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <h2 className="text-xl font-medium text-yellow-800 mb-2">
                Wine Club Not Available
              </h2>
              <p className="text-yellow-700">
                This wine club is currently unavailable or has been removed.
                Please browse our other wine clubs or contact us for assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      {...rest}
      className={cn("py-12", backgroundColor, textColor)}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        {(heading || description) && (
          <div className="text-center mb-12">
            {heading && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>
            )}
            {description && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Selection Wizard */}
        <SelectionWizardContainer
          wineClub={wineClub}
          showStepNumbers={showStepNumbers}
          allowStepNavigation={allowStepNavigation}
          onComplete={(state) => {
            console.log("Wine club selection completed:", state);
            // Handle completion analytics, etc.
          }}
          className="max-w-none"
        />

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              Our wine experts are here to help you choose the perfect wine
              club.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Contact Support
              </a>
              <a
                href="/wine-clubs"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Browse Other Clubs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Server-side loader for wine club data
 */
export const loader = async ({ weaverse, data }: ComponentLoaderArgs) => {
  try {
    // Get wine club ID from component settings
    const wineClubId = data?.wineClubId as string;

    if (!wineClubId) {
      console.warn("[WineClubSelectionWizard] No wine club ID provided");
      return null;
    }

    // Fetch wine club details from Winehub API
    const wineClubDetails = await fetchWineClubDetails({
      context: weaverse as any,
      clubId: wineClubId,
    });

    return wineClubDetails;
  } catch (error) {
    console.error(
      "[WineClubSelectionWizard] Failed to load wine club details:",
      error,
    );
    return null;
  }
};

/**
 * Weaverse schema definition
 */
export const schema = createSchema({
  type: "wine-club-selection-wizard",
  title: "Wine Club Selection Wizard",
  category: "Wine Clubs",
  description:
    "5-step wine club selection process with case size, frequency, quantity, add-ons, and review steps",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Join Our Wine Club",
          helpText: "Main heading for the selection wizard",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Complete our 5-step selection process to customize your perfect wine club membership.",
          helpText: "Description text below the heading",
        },
        {
          type: "text",
          name: "wineClubId",
          label: "Wine Club ID",
          helpText:
            "ID of the wine club to load from Winehub API. Leave blank for auto-detection from URL.",
        },
      ],
    },
    {
      group: "Behavior",
      inputs: [
        {
          type: "switch",
          name: "showStepNumbers",
          label: "Show Step Numbers",
          defaultValue: true,
          helpText: "Display step numbers in the progress bar",
        },
        {
          type: "switch",
          name: "allowStepNavigation",
          label: "Allow Step Navigation",
          defaultValue: false,
          helpText:
            "Allow users to click on progress bar to navigate between steps",
        },
      ],
    },
    {
      group: "Style",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background Color",
          defaultValue: "#ffffff",
          helpText: "Background color for the section",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text Color",
          defaultValue: "#111827",
          helpText: "Primary text color for the section",
        },
      ],
    },
  ],
});

/**
 * Component usage example for documentation
 */
export const usageExample = `
// Basic usage with default settings
<WineClubSelectionWizard
  wineClubId="premium-wine-club"
  heading="Join Our Premium Wine Club"
  description="Select your preferences and start your wine journey today."
/>

// Advanced usage with custom behavior
<WineClubSelectionWizard
  wineClubId="premium-wine-club"
  heading="Custom Wine Club Selection"
  description="Experience our curated selection process."
  showStepNumbers={true}
  allowStepNavigation={true}
  backgroundColor="#f9fafb"
  onComplete={(state) => {
    // Handle completion
    analytics.track('wine_club_completed', {
      clubId: state.wineClub.id,
      selections: state.selectedProducts.length
    });
  }}
/>
`;
