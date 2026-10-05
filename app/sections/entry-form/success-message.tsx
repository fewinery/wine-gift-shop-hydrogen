import type { InspectorGroup } from "@weaverse/hydrogen";
import Heading, {
  type HeadingProps,
  headingInputs,
} from "~/components/heading";
import { cn } from "~/utils/cn";

export interface EntryFormSuccessProps {
  successTitle: string;
  successTitleAs: HeadingProps["as"];
  successTitleColor: string;
  successTitleSize: HeadingProps["size"];
  successTitleMobileSize: HeadingProps["mobileSize"];
  successTitleDesktopSize: HeadingProps["desktopSize"];
  successTitleMinSize: number;
  successTitleMaxSize: number;
  successTitleWeight: HeadingProps["weight"];
  successTitleLetterSpacing: HeadingProps["letterSpacing"];
  successTitleLineHeight: HeadingProps["lineHeight"];
  successTitleAlignment: HeadingProps["alignment"];
  successMessage: string;
  successMessageSize: string;
  keepContentAfterSubmit: boolean;
}

const alignments = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Shown in place of the form once an entry is accepted. The title is the
 * theme's own Heading component, so it carries the same tag, size, weight,
 * letter spacing, line height and alignment controls as any other heading.
 */
export function EntryFormSuccess(props: EntryFormSuccessProps) {
  const {
    successTitle,
    successTitleAs,
    successTitleColor,
    successTitleSize,
    successTitleMobileSize,
    successTitleDesktopSize,
    successTitleMinSize,
    successTitleMaxSize,
    successTitleWeight,
    successTitleLetterSpacing,
    successTitleLineHeight,
    successTitleAlignment,
    successMessage,
    successMessageSize,
  } = props;

  return (
    <div className="entry-form-success space-y-4">
      {successTitle && (
        <Heading
          as={successTitleAs}
          content={successTitle}
          color={successTitleColor || undefined}
          size={successTitleSize}
          mobileSize={successTitleMobileSize}
          desktopSize={successTitleDesktopSize}
          minSize={successTitleMinSize}
          maxSize={successTitleMaxSize}
          weight={successTitleWeight}
          letterSpacing={successTitleLetterSpacing}
          lineHeight={successTitleLineHeight}
          alignment={successTitleAlignment}
          className="[&_a]:underline"
        />
      )}
      {successMessage && (
        <div
          className={cn(
            "leading-relaxed [&_a]:underline [&_p+p]:mt-4",
            // The description follows the title's alignment rather than
            // carrying a second control that could disagree with it.
            alignments[successTitleAlignment || "center"],
            successMessageSize || "text-lg",
          )}
          data-motion="fade-up"
          dangerouslySetInnerHTML={{ __html: successMessage }}
        />
      )}
    </div>
  );
}

// Which value of the title's "Text size" each conditional input belongs to.
const SIZE_CONDITIONS: Record<string, string> = {
  minSize: "scale",
  maxSize: "scale",
  mobileSize: "custom",
  desktopSize: "custom",
};

function successTitleName(name: string) {
  if (name === "content") {
    return "successTitle";
  }
  return `successTitle${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

// The theme's heading controls, renamed so they cannot collide with the
// section's own settings, and re-pointed at the renamed "Text size".
const titleInputs = headingInputs.map((input) => {
  const originalName = String((input as { name?: unknown }).name ?? "");
  const next = { ...input, name: successTitleName(originalName) } as Record<
    string,
    unknown
  >;
  const requiredSize = SIZE_CONDITIONS[originalName];
  if (requiredSize) {
    next.condition = (data: Record<string, unknown>) =>
      data.successTitleSize === requiredSize;
  }
  if (originalName === "content") {
    next.label = "Title";
    next.defaultValue = "<p>Your entry has been received. Good luck!</p>";
    next.helpText =
      "Shown in place of the form once an entry is accepted. Leave empty for no title.";
  }
  return next;
}) as InspectorGroup["inputs"];

export const successMessageInputs: InspectorGroup["inputs"] = [
  ...titleInputs,
  {
    type: "richtext",
    name: "successMessage",
    label: "Description",
    defaultValue:
      '<p>In the meantime, <a href="https://obbligatonapa.com/">CLICK HERE</a> to explore our full wine collection and the Obbligato Club Membership, offering flexible membership options, shipping discounts, savings of up to 20%, and instant rewards through our WinePlus Loyalty Program.</p>',
    helpText: "Sits under the title. Links are allowed.",
  },
  {
    type: "select",
    name: "successMessageSize",
    label: "Description size",
    defaultValue: "text-lg",
    configs: {
      options: [
        { value: "text-sm", label: "Small" },
        { value: "text-base", label: "Medium" },
        { value: "text-lg", label: "Large" },
        { value: "text-xl", label: "Extra large" },
        { value: "text-2xl", label: "Huge" },
      ],
    },
  },
  {
    type: "switch",
    name: "keepContentAfterSubmit",
    label: "Keep heading and text",
    defaultValue: true,
    helpText:
      "Off leaves only the success message on screen once an entry is accepted.",
  },
];
