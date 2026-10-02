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
  dateFieldStyle: "calendar" | "split" | "dropdown";
  buttonText: string;
  successTitle: string;
  successTitleSize: string;
  successTitleUseHeadingFont: boolean;
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

// The date boxes fill their grid column, so the row spans the same width as
// the email field above it.
const DATE_PART_CLASS = cn(FIELD_CLASS, "text-center");

// Dropdowns keep the native arrow, and "color-scheme: light" stops the
// browser drawing the open list dark over a light field.
const DATE_SELECT_CLASS = cn(FIELD_CLASS, "[color-scheme:light]");

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const OLDEST_YEAR_OFFSET = 110;

const YEAR_OPTIONS = Array.from(
  { length: OLDEST_YEAR_OFFSET + 1 },
  (_, index) => String(new Date().getUTCFullYear() - index),
);

/** Keeps a date box numeric and no longer than its part allows. */
function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

/**
 * Last day of the chosen month. Before a year is picked it assumes a leap
 * year, so February offers 29 rather than hiding a valid birthday.
 */
function daysInMonth(month: string, year: string) {
  const monthNumber = Number(month);
  if (!monthNumber) {
    return 31;
  }
  const yearNumber = Number(year) || 2000;
  return new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();
}

function DatePartCell({
  htmlFor,
  label,
  className,
  children,
}: {
  htmlFor: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-center font-medium text-xs uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
    </div>
  );
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
    successTitle,
    successTitleSize,
    successTitleUseHeadingFont,
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

  const useDropdowns = dateFieldStyle === "dropdown";
  const dayOptions = Array.from(
    { length: daysInMonth(dobMonth, dobYear) },
    (_, index) => String(index + 1).padStart(2, "0"),
  );

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
          className="entry-form-success space-y-4 text-center"
          data-motion="fade-up"
        >
          {successTitle && (
            <div
              className={cn(
                "leading-tight [&_a]:underline [&_p+p]:mt-2",
                successTitleUseHeadingFont === false
                  ? "font-body"
                  : "font-heading",
                successTitleSize || "text-2xl",
              )}
              dangerouslySetInnerHTML={{ __html: successTitle }}
            />
          )}
          {successMessage && (
            <div
              className={cn(
                "leading-relaxed [&_a]:underline [&_p+p]:mt-4",
                successMessageSize || "text-lg",
              )}
              dangerouslySetInnerHTML={{ __html: successMessage }}
            />
          )}
        </div>
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

          {dateFieldStyle === "calendar" ? (
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
          ) : (
            <fieldset className="space-y-1.5">
              <legend className="block text-sm">
                {dateOfBirthLabel || "Date of Birth"}
              </legend>
              {/* Four columns with the year taking two of them: the row fills
                  the form width and the year stays the widest. */}
              <div className="grid grid-cols-4 items-end gap-3">
                <DatePartCell htmlFor="entry-dob-month" label="MM">
                  {useDropdowns ? (
                    <select
                      id="entry-dob-month"
                      required
                      autoComplete="bday-month"
                      aria-label="Birth month"
                      value={dobMonth}
                      onChange={(event) => {
                        const next = event.target.value;
                        setDobMonth(next);
                        // A shorter month can strand a day that was already
                        // picked, so drop it rather than submit the 31st of
                        // February.
                        if (Number(dobDay) > daysInMonth(next, dobYear)) {
                          setDobDay("");
                        }
                      }}
                      className={DATE_SELECT_CLASS}
                    >
                      <option value="">MM</option>
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                      className={DATE_PART_CLASS}
                    />
                  )}
                </DatePartCell>
                <DatePartCell htmlFor="entry-dob-day" label="DD">
                  {useDropdowns ? (
                    <select
                      id="entry-dob-day"
                      required
                      autoComplete="bday-day"
                      aria-label="Birth day"
                      value={dobDay}
                      onChange={(event) => {
                        setDobDay(event.target.value);
                      }}
                      className={DATE_SELECT_CLASS}
                    >
                      <option value="">DD</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                      className={DATE_PART_CLASS}
                    />
                  )}
                </DatePartCell>
                <DatePartCell
                  htmlFor="entry-dob-year"
                  label="YYYY"
                  className="col-span-2"
                >
                  {useDropdowns ? (
                    <select
                      id="entry-dob-year"
                      required
                      autoComplete="bday-year"
                      aria-label="Birth year"
                      value={dobYear}
                      onChange={(event) => {
                        const next = event.target.value;
                        setDobYear(next);
                        // February 29 only exists in a leap year.
                        if (Number(dobDay) > daysInMonth(dobMonth, next)) {
                          setDobDay("");
                        }
                      }}
                      className={DATE_SELECT_CLASS}
                    >
                      <option value="">YYYY</option>
                      {YEAR_OPTIONS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                      className={DATE_PART_CLASS}
                    />
                  )}
                </DatePartCell>
              </div>
              <input type="hidden" name="dateOfBirth" value={dobValue} />
            </fieldset>
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
              { value: "dropdown", label: "Three dropdowns (MM / DD / YYYY)" },
              { value: "split", label: "Three typed boxes (MM / DD / YYYY)" },
            ],
          },
          helpText:
            "Dropdowns open the phone's own scroller and are the easiest on mobile. Typed boxes suit visitors who would rather key the date in. Either one avoids the browser's date picker, so the field looks the same everywhere.",
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
          name: "successTitle",
          label: "Title",
          defaultValue: "<p>Your entry has been received. Good luck!</p>",
          helpText:
            "Shown in place of the form once an entry is accepted. Leave empty for no title.",
        },
        {
          type: "select",
          name: "successTitleSize",
          label: "Title size",
          defaultValue: "text-2xl",
          configs: {
            options: [
              { value: "text-lg", label: "Small" },
              { value: "text-xl", label: "Medium" },
              { value: "text-2xl", label: "Large" },
              { value: "text-3xl", label: "Extra large" },
              { value: "text-4xl", label: "Huge" },
            ],
          },
        },
        {
          type: "switch",
          name: "successTitleUseHeadingFont",
          label: "Title uses the heading font",
          defaultValue: true,
        },
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
      ],
    },
    ...sectionSettings,
  ],
  childTypes: ["subheading", "heading", "paragraph"],
  presets: {
    formWidth: "medium",
    dateFieldStyle: "dropdown",
    successTitleSize: "text-2xl",
    successMessageSize: "text-lg",
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
