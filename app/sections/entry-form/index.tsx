import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { type CSSProperties, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";
import type { EntryFormApiPayload } from "~/routes/api/entry-form";
import { cn } from "~/utils/cn";

interface EntryFormProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  klaviyoListId: string;
  sourceTag: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
  dateOfBirthLabel: string;
  dateFieldStyle: "calendar" | "split";
  buttonText: string;
  successMessage: string;
  successMessageSize: string;
  keepContentAfterSubmit: boolean;
  consentText: string;
  // Named "formWidth" rather than "width" because Section already owns a
  // "width" setting for the section container itself.
  formWidth: "narrow" | "medium" | "wide";
  textColor: string;
  fieldBackgroundColor: string;
  fieldBorderColor: string;
  fieldTextColor: string;
  buttonWidth: "full" | "auto";
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBackgroundColorHover: string;
  buttonTextColorHover: string;
}

const formWidths = {
  narrow: "max-w-md",
  medium: "max-w-xl",
  wide: "max-w-3xl",
};

// Field colors come through CSS variables set on the wrapper so every input
// picks them up without repeating the same four classes on each one.
const FIELD_BASE = cn(
  "p-3 leading-tight focus:outline-hidden",
  "border border-(--entry-field-border)",
  "bg-(--entry-field-bg) text-(--entry-field-text)",
);

const FIELD_CLASS = cn("w-full", FIELD_BASE);

// The MM / DD / YYYY boxes are their own width, so they use the base class
// without "w-full".
const DATE_PART_CLASS = cn(FIELD_BASE, "text-center");

/** Keeps a date box numeric and no longer than its part allows. */
function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function EntryForm(props: EntryFormProps) {
  const {
    ref,
    klaviyoListId,
    sourceTag,
    children,
    firstNameLabel,
    lastNameLabel,
    emailLabel,
    dateOfBirthLabel,
    dateFieldStyle,
    buttonText,
    successMessage,
    successMessageSize,
    keepContentAfterSubmit,
    consentText,
    formWidth,
    textColor,
    fieldBackgroundColor,
    fieldBorderColor,
    fieldTextColor,
    buttonWidth,
    buttonBackgroundColor,
    buttonTextColor,
    buttonBackgroundColorHover,
    buttonTextColorHover,
    ...rest
  } = props;

  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const result = fetcher.data as EntryFormApiPayload | undefined;
  const submitted = Boolean(result?.ok);
  const showError = state === "idle" && result && !result.ok;

  // Split date of birth. The three boxes are what the visitor types in; the
  // hidden field below is what the API reads, always as YYYY-MM-DD.
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const dobDayRef = useRef<HTMLInputElement>(null);
  const dobYearRef = useRef<HTMLInputElement>(null);

  const dobValue =
    dobMonth && dobDay && dobYear.length === 4
      ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
      : "";

  // Only switch the button to its "custom" variant once a color is actually
  // set, so an untouched form keeps the theme's primary button exactly.
  const hasCustomButton = Boolean(
    buttonBackgroundColor ||
      buttonTextColor ||
      buttonBackgroundColorHover ||
      buttonTextColorHover,
  );

  const colorStyle = {
    color: textColor || undefined,
    "--entry-field-bg": fieldBackgroundColor || "#ffffff",
    "--entry-field-border": fieldBorderColor || "var(--color-line)",
    // Not "inherit": the field background defaults to white, so inheriting a
    // light page text color makes typed text and the date placeholder
    // invisible against it.
    "--entry-field-text": fieldTextColor || "#000000",
  } as CSSProperties;

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={cn("mx-auto", formWidths[formWidth] || "max-w-xl")}
      style={colorStyle}
    >
      {/* The heading and paragraph are children, so hiding them after a
          successful entry has to happen here rather than inside the block
          below. */}
      {submitted && keepContentAfterSubmit === false ? null : children}

      {submitted ? (
        <div
          className={cn(
            "entry-form-success text-center leading-relaxed",
            "[&_a]:underline [&_p+p]:mt-4",
            successMessageSize || "text-lg",
          )}
          data-motion="fade-up"
          dangerouslySetInnerHTML={{ __html: successMessage }}
        />
      ) : (
        <Form method="POST" action="/api/entry-form" className="space-y-4">
          {/* HONEYPOT: bots fill it, humans never see it */}
          <div
            style={{ position: "absolute", left: "-10000px" }}
            aria-hidden="true"
          >
            <label htmlFor="entry-company">Leave this empty</label>
            <input
              type="text"
              id="entry-company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="listId" value={klaviyoListId || ""} />
          <input type="hidden" name="sourceTag" value={sourceTag || ""} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="entry-first-name" className="block text-sm">
                {firstNameLabel || "First Name"}
              </label>
              <input
                id="entry-first-name"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className={FIELD_CLASS}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="entry-last-name" className="block text-sm">
                {lastNameLabel || "Last Name"}
              </label>
              <input
                id="entry-last-name"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="entry-email" className="block text-sm">
              {emailLabel || "Email Address"}
            </label>
            <input
              id="entry-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={FIELD_CLASS}
            />
          </div>

          {dateFieldStyle === "split" ? (
            <fieldset className="space-y-1.5">
              <legend className="block text-sm">
                {dateOfBirthLabel || "Date of Birth"}
              </legend>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="entry-dob-month"
                    className="block text-center font-medium text-xs uppercase tracking-wide"
                  >
                    MM
                  </label>
                  <input
                    id="entry-dob-month"
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="bday-month"
                    aria-label="Birth month"
                    placeholder="MM"
                    value={dobMonth}
                    onChange={(event) => {
                      const next = digitsOnly(event.target.value, 2);
                      setDobMonth(next);
                      if (next.length === 2) {
                        dobDayRef.current?.focus();
                      }
                    }}
                    onBlur={() => {
                      setDobMonth((current) =>
                        current ? current.padStart(2, "0") : current,
                      );
                    }}
                    className={cn(DATE_PART_CLASS, "w-16")}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="entry-dob-day"
                    className="block text-center font-medium text-xs uppercase tracking-wide"
                  >
                    DD
                  </label>
                  <input
                    id="entry-dob-day"
                    ref={dobDayRef}
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="bday-day"
                    aria-label="Birth day"
                    placeholder="DD"
                    value={dobDay}
                    onChange={(event) => {
                      const next = digitsOnly(event.target.value, 2);
                      setDobDay(next);
                      if (next.length === 2) {
                        dobYearRef.current?.focus();
                      }
                    }}
                    onBlur={() => {
                      setDobDay((current) =>
                        current ? current.padStart(2, "0") : current,
                      );
                    }}
                    className={cn(DATE_PART_CLASS, "w-16")}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="entry-dob-year"
                    className="block text-center font-medium text-xs uppercase tracking-wide"
                  >
                    YYYY
                  </label>
                  <input
                    id="entry-dob-year"
                    ref={dobYearRef}
                    type="text"
                    inputMode="numeric"
                    required
                    // Four digits, so "19" can never be read as the year 19.
                    pattern="[0-9]{4}"
                    title="Enter a four-digit year, for example 1988"
                    autoComplete="bday-year"
                    aria-label="Birth year"
                    placeholder="YYYY"
                    value={dobYear}
                    onChange={(event) => {
                      setDobYear(digitsOnly(event.target.value, 4));
                    }}
                    className={cn(DATE_PART_CLASS, "w-24")}
                  />
                </div>
              </div>
              <input type="hidden" name="dateOfBirth" value={dobValue} />
            </fieldset>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="entry-dob" className="block text-sm">
                {dateOfBirthLabel || "Date of Birth"}
              </label>
              <input
                id="entry-dob"
                name="dateOfBirth"
                type="date"
                required
                autoComplete="bday"
                // Keeps the native calendar icon and placeholder readable when
                // the surrounding page is dark.
                className={cn(FIELD_CLASS, "[color-scheme:light]")}
              />
            </div>
          )}

          <div className={buttonWidth === "auto" ? "text-center" : ""}>
            <Button
              type="submit"
              className={buttonWidth === "auto" ? "" : "w-full"}
              loading={state === "submitting"}
              {...(hasCustomButton
                ? {
                    variant: "custom" as const,
                    backgroundColor: buttonBackgroundColor,
                    textColor: buttonTextColor,
                    // The button always draws a border, so matching it to the
                    // background keeps a solid button looking solid.
                    borderColor: buttonBackgroundColor,
                    backgroundColorHover: buttonBackgroundColorHover,
                    textColorHover: buttonTextColorHover,
                    borderColorHover: buttonBackgroundColorHover,
                  }
                : {})}
            >
              {buttonText || "Submit"}
            </Button>
          </div>

          {consentText && (
            <div
              className="text-center text-sm [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: consentText }}
            />
          )}

          <div
            className={clsx(
              "text-center font-medium text-red-700 text-sm",
              showError ? "visible" : "invisible",
            )}
          >
            {result?.errorMessage || "Something went wrong"}
          </div>
        </Form>
      )}
    </Section>
  );
}

export default EntryForm;

export const schema = createSchema({
  type: "entry-form",
  title: "Entry form",
  settings: [
    {
      group: "Klaviyo",
      inputs: [
        {
          type: "text",
          name: "klaviyoListId",
          label: "Klaviyo list ID override",
          placeholder: "Leave empty",
          helpText:
            "Normally leave this EMPTY. The list comes from the KLAVIYO_ENTRY_LIST_ID variable on the storefront's Hydrogen app. Only fill this in to point a second form on the same storefront at a different list.",
        },
        {
          type: "text",
          name: "sourceTag",
          label: "Source tag",
          placeholder: "e.g. Klaviyo: Barry Manilow - Obbligato",
          helpText:
            "Written to every entry as the Shopify customer tag, the Klaviyo profile property 'Signup Source' and the consent record's source.",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "formWidth",
          label: "Form width",
          defaultValue: "medium",
          configs: {
            options: [
              { value: "narrow", label: "Narrow" },
              { value: "medium", label: "Medium" },
              { value: "wide", label: "Wide" },
            ],
          },
          helpText:
            "How wide the form itself is. The section's own width is under Layout.",
        },
        {
          type: "text",
          name: "firstNameLabel",
          label: "First name label",
          defaultValue: "First Name",
        },
        {
          type: "text",
          name: "lastNameLabel",
          label: "Last name label",
          defaultValue: "Last Name",
        },
        {
          type: "text",
          name: "emailLabel",
          label: "Email label",
          defaultValue: "Email Address",
        },
        {
          type: "text",
          name: "dateOfBirthLabel",
          label: "Date of birth label",
          defaultValue: "Date of Birth",
        },
        {
          type: "select",
          name: "dateFieldStyle",
          label: "Date of birth field",
          defaultValue: "calendar",
          configs: {
            options: [
              { value: "calendar", label: "Single date picker" },
              { value: "split", label: "Three boxes (MM / DD / YYYY)" },
            ],
          },
          helpText:
            "Three boxes avoids the browser's own date picker, so the field looks the same in every browser.",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Submit",
        },
        {
          type: "richtext",
          name: "consentText",
          label: "Fine print under the button",
          defaultValue:
            '<p>You must be 21 or older to enter. By entering you agree to receive marketing emails. See our <a href="/policies/privacy-policy">Privacy Policy</a>.</p>',
        },
      ],
    },
    {
      group: "Form style",
      inputs: [
        {
          type: "color",
          name: "textColor",
          label: "Text color",
          helpText:
            "Heading, description, labels and fine print. Leave empty to inherit the theme.",
        },
        {
          type: "color",
          name: "fieldBackgroundColor",
          label: "Field background",
        },
        {
          type: "color",
          name: "fieldBorderColor",
          label: "Field border",
        },
        {
          type: "color",
          name: "fieldTextColor",
          label: "Field text",
        },
      ],
    },
    {
      group: "Button style",
      inputs: [
        {
          type: "toggle-group",
          name: "buttonWidth",
          label: "Button width",
          defaultValue: "full",
          configs: {
            options: [
              { value: "full", label: "Full", icon: "move-horizontal" },
              { value: "auto", label: "Auto", icon: "fold-horizontal" },
            ],
          },
        },
        {
          type: "color",
          name: "buttonBackgroundColor",
          label: "Button background",
          helpText:
            "Leave every button color empty to use the theme's primary button.",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text",
        },
        {
          type: "color",
          name: "buttonBackgroundColorHover",
          label: "Button background (hover)",
        },
        {
          type: "color",
          name: "buttonTextColorHover",
          label: "Button text (hover)",
        },
      ],
    },
    {
      group: "After submission",
      inputs: [
        {
          type: "richtext",
          name: "successMessage",
          label: "Success message",
          defaultValue:
            '<p>Your entry has been received. Good luck!</p><p>In the meantime, <a href="https://obbligatonapa.com/">CLICK HERE</a> to explore our full wine collection and the Obbligato Club Membership, offering flexible membership options, shipping discounts, savings of up to 20%, and instant rewards through our WinePlus Loyalty Program.</p>',
          helpText:
            "Replaces the form once an entry is accepted. Links are allowed.",
        },
        {
          type: "select",
          name: "successMessageSize",
          label: "Success message size",
          defaultValue: "text-lg",
          configs: {
            options: [
              { value: "text-base", label: "Small" },
              { value: "text-lg", label: "Medium" },
              { value: "text-xl", label: "Large" },
              { value: "text-2xl", label: "Extra large" },
              { value: "text-3xl", label: "Huge" },
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
      ],
    },
    ...sectionSettings,
  ],
  childTypes: ["subheading", "heading", "paragraph"],
  presets: {
    formWidth: "medium",
    dateFieldStyle: "split",
    successMessageSize: "text-xl",
    keepContentAfterSubmit: false,
    width: "fixed",
    verticalPadding: "medium",
    gap: 20,
    children: [
      {
        type: "heading",
        content: "Enter to Win",
        as: "h2",
      },
      {
        type: "paragraph",
        content: "Fill in your details below for your chance to win.",
      },
    ],
  },
});
