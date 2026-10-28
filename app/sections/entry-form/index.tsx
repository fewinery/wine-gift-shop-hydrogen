import { createSchema, type WeaverseImage } from "@weaverse/hydrogen";
import clsx from "clsx";
import { type CSSProperties, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
import type { EntryFormApiPayload } from "~/routes/api/entry-form";
import { cn } from "~/utils/cn";
import {
  EntryFormSuccess,
  type EntryFormSuccessProps,
  successMessageInputs,
} from "./success-message";

interface EntryFormProps extends SectionProps, EntryFormSuccessProps {
  ref?: React.Ref<HTMLElement>;
  klaviyoListId: string;
  sourceTag: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
  dateOfBirthLabel: string;
  dateFieldStyle: "calendar" | "split" | "dropdown";
  labelSize: string;
  dateLabelSize: string;
  inputTextSize: string;
  buttonTextSize: string;
  consentTextSize: string;
  buttonText: string;
  consentText: string;
  // Named "formWidth" rather than "width" because Section already owns a
  // "width" setting for the section container itself.
  formWidth: "narrow" | "medium" | "wide";
  textColor: string;
  errorTextColor: string;
  fieldBackgroundColor: string;
  fieldBorderColor: string;
  fieldTextColor: string;
  buttonWidth: "full" | "auto";
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonBackgroundColorHover: string;
  buttonTextColorHover: string;
  prizeImage?: WeaverseImage | string;
  prizeImagePosition?: "above" | "below" | "left" | "right";
  prizeImageMobilePosition?: "top" | "after-heading" | "bottom";
  prizeImageWidth?: number;
  prizeImageRadius?: number;
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
  labelClassName,
  children,
}: {
  htmlFor: string;
  label: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "block text-center font-medium uppercase tracking-wide",
          labelClassName || "text-xs",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function getPrize(value: EntryFormProps["prizeImage"]) {
  return value && typeof value === "object" && value.url ? value : null;
}

// Side by side needs more room than the form alone, so it uses a wider
// container: one column on phones, two columns from tablet up.
function sideLayoutClass(position: EntryFormProps["prizeImagePosition"]) {
  return cn(
    "mx-auto max-w-5xl",
    "flex flex-col gap-5 space-y-0 lg:space-y-0",
    "md:grid md:items-start md:gap-x-10 md:gap-y-5",
    position === "left"
      ? "md:grid-cols-[minmax(0,var(--prize-w))_minmax(0,1fr)]"
      : "md:grid-cols-[minmax(0,1fr)_minmax(0,var(--prize-w))]",
  );
}

function PrizeImage({
  image,
  isSide,
  position,
  mobilePosition,
  radius,
}: {
  image: WeaverseImage;
  isSide: boolean;
  position: EntryFormProps["prizeImagePosition"];
  mobilePosition: EntryFormProps["prizeImageMobilePosition"];
  radius: number;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        isSide && [
          // Phone: a single column, ordered by the mobile setting.
          mobilePosition === "top" && "order-first",
          mobilePosition === "bottom" && "order-last",
          // Desktop: its own column, spanning heading and form.
          "md:order-none md:row-span-2 md:row-start-1 md:self-center",
          position === "left" ? "md:col-start-1" : "md:col-start-2",
        ],
      )}
      style={{ borderRadius: `${radius}px` }}
    >
      <Image
        data={image}
        width={1200}
        sizes={isSide ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
        className="h-auto w-full"
      />
    </div>
  );
}

/**
 * Where the prize image goes and how wide the section is. With no image this
 * returns the section's original width and no image at all.
 */
function prizeLayout({
  image,
  position,
  mobilePosition,
  radius,
  formWidth,
}: {
  image: EntryFormProps["prizeImage"];
  position: EntryFormProps["prizeImagePosition"];
  mobilePosition: EntryFormProps["prizeImageMobilePosition"];
  radius: number;
  formWidth: EntryFormProps["formWidth"];
}) {
  const prize = getPrize(image);
  const isSide =
    Boolean(prize) && (position === "left" || position === "right");
  const imageEl = prize ? (
    <PrizeImage
      image={prize}
      isSide={isSide}
      position={position}
      mobilePosition={mobilePosition}
      radius={radius}
    />
  ) : null;
  const below = position === "below" && !isSide;
  return {
    isSide,
    containerClassName: isSide
      ? sideLayoutClass(position)
      : cn("mx-auto", formWidths[formWidth] || "max-w-xl"),
    imageAbove: below ? null : imageEl,
    imageBelow: below ? imageEl : null,
  };
}

/**
 * The heading and paragraph. Side by side they share one column, so they are
 * wrapped; otherwise they render exactly as before, with no wrapper.
 */
function PrizeIntro({
  isSide,
  position,
  children,
}: {
  isSide: boolean;
  position: EntryFormProps["prizeImagePosition"];
  children: React.ReactNode;
}) {
  if (!isSide) {
    return <>{children}</>;
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:row-start-1",
        position === "left" ? "md:col-start-2" : "md:col-start-1",
      )}
    >
      {children}
    </div>
  );
}

/**
 * True once an entry is accepted. Inside Studio the "Preview success message"
 * switch also shows it, so it can be styled; the live site ignores the switch.
 */
function useShowSuccess(ok: boolean | undefined, previewSuccess?: boolean) {
  const isDesignMode = useWeaverseStudioCheck();
  return Boolean(ok) || Boolean(isDesignMode && previewSuccess);
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
    labelSize,
    dateLabelSize,
    inputTextSize,
    buttonTextSize,
    consentTextSize,
    buttonText,
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
    keepContentAfterSubmit,
    previewSuccess,
    consentText,
    formWidth,
    textColor,
    errorTextColor,
    fieldBackgroundColor,
    fieldBorderColor,
    fieldTextColor,
    buttonWidth,
    buttonBackgroundColor,
    buttonTextColor,
    buttonBackgroundColorHover,
    buttonTextColorHover,
    prizeImage,
    prizeImagePosition = "above",
    prizeImageMobilePosition = "top",
    prizeImageWidth = 45,
    prizeImageRadius = 0,
    ...rest
  } = props;

  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const result = fetcher.data as EntryFormApiPayload | undefined;
  const submitted = useShowSuccess(result?.ok, previewSuccess);
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

  // Every brand sets its own base font size, so the form's labels need to be
  // tunable per storefront rather than fixed at text-sm.
  const labelClass = cn("block", labelSize || "text-sm");
  const fieldClass = cn(FIELD_CLASS, inputTextSize || "text-base");
  const datePartClass = cn(DATE_PART_CLASS, inputTextSize || "text-base");
  const dateSelectClass = cn(DATE_SELECT_CLASS, inputTextSize || "text-base");

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
    "--prize-w": `${prizeImageWidth}%`,
  } as CSSProperties;

  // Optional prize image. With no image set, nothing below changes: the
  // section renders exactly as it did before this option existed.
  const layout = prizeLayout({
    image: prizeImage,
    position: prizeImagePosition,
    mobilePosition: prizeImageMobilePosition,
    radius: prizeImageRadius,
    formWidth,
  });

  return (
    <Section
      ref={ref}
      {...rest}
      containerClassName={layout.containerClassName}
      style={colorStyle}
    >
      {/* The heading and paragraph are children, so hiding them after a
          successful entry has to happen here rather than inside the block
          below. */}
      <PrizeIntro isSide={layout.isSide} position={prizeImagePosition}>
        {submitted && keepContentAfterSubmit === false ? null : children}
      </PrizeIntro>
      {layout.imageAbove}

      {submitted ? (
        <EntryFormSuccess
          successTitle={successTitle}
          successTitleAs={successTitleAs}
          successTitleColor={successTitleColor}
          successTitleSize={successTitleSize}
          successTitleMobileSize={successTitleMobileSize}
          successTitleDesktopSize={successTitleDesktopSize}
          successTitleMinSize={successTitleMinSize}
          successTitleMaxSize={successTitleMaxSize}
          successTitleWeight={successTitleWeight}
          successTitleLetterSpacing={successTitleLetterSpacing}
          successTitleLineHeight={successTitleLineHeight}
          successTitleAlignment={successTitleAlignment}
          successMessage={successMessage}
          successMessageSize={successMessageSize}
          keepContentAfterSubmit={keepContentAfterSubmit}
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
              <label htmlFor="entry-first-name" className={labelClass}>
                {firstNameLabel || "First Name"}
              </label>
              <input
                id="entry-first-name"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="entry-last-name" className={labelClass}>
                {lastNameLabel || "Last Name"}
              </label>
              <input
                id="entry-last-name"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="entry-email" className={labelClass}>
              {emailLabel || "Email Address"}
            </label>
            <input
              id="entry-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
            />
          </div>

          {dateFieldStyle === "calendar" ? (
            <div className="space-y-1.5">
              <label htmlFor="entry-dob" className={labelClass}>
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
                className={cn(fieldClass, "[color-scheme:light]")}
              />
            </div>
          ) : (
            <fieldset className="space-y-1.5">
              <legend className={labelClass}>
                {dateOfBirthLabel || "Date of Birth"}
              </legend>
              {/* Four columns with the year taking two of them: the row fills
                  the form width and the year stays the widest. */}
              <div className="grid grid-cols-4 items-end gap-3">
                <DatePartCell
                  htmlFor="entry-dob-month"
                  label="MM"
                  labelClassName={dateLabelSize}
                >
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
                      className={dateSelectClass}
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
                      className={datePartClass}
                    />
                  )}
                </DatePartCell>
                <DatePartCell
                  htmlFor="entry-dob-day"
                  label="DD"
                  labelClassName={dateLabelSize}
                >
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
                      className={dateSelectClass}
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
                      className={datePartClass}
                    />
                  )}
                </DatePartCell>
                <DatePartCell
                  htmlFor="entry-dob-year"
                  label="YYYY"
                  className="col-span-2"
                  labelClassName={dateLabelSize}
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
                      className={dateSelectClass}
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
                      className={datePartClass}
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
              className={cn(
                buttonWidth === "auto" ? "" : "w-full",
                buttonTextSize || "text-base",
              )}
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
              className={cn(
                "text-center [&_a]:underline",
                consentTextSize || "text-sm",
              )}
              dangerouslySetInnerHTML={{ __html: consentText }}
            />
          )}

          <div
            className={clsx(
              "text-center font-medium text-sm",
              // Empty keeps the original red, so other brands are unchanged.
              !errorTextColor && "text-red-700",
              showError ? "visible" : "invisible",
            )}
            style={errorTextColor ? { color: errorTextColor } : undefined}
            role="alert"
          >
            {result?.errorMessage || "Something went wrong"}
          </div>
        </Form>
      )}
      {layout.imageBelow}
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
      group: "Text sizes",
      inputs: [
        {
          type: "select",
          name: "labelSize",
          label: "Field labels",
          defaultValue: "text-sm",
          configs: {
            options: [
              { value: "text-xs", label: "Extra small" },
              { value: "text-sm", label: "Small" },
              { value: "text-base", label: "Medium" },
              { value: "text-lg", label: "Large" },
              { value: "text-xl", label: "Extra large" },
            ],
          },
          helpText: "First Name, Last Name, Email Address and Date of Birth.",
        },
        {
          type: "select",
          name: "dateLabelSize",
          label: "MM / DD / YYYY labels",
          defaultValue: "text-xs",
          configs: {
            options: [
              { value: "text-xs", label: "Extra small" },
              { value: "text-sm", label: "Small" },
              { value: "text-base", label: "Medium" },
              { value: "text-lg", label: "Large" },
            ],
          },
        },
        {
          type: "select",
          name: "inputTextSize",
          label: "Text inside the fields",
          defaultValue: "text-base",
          configs: {
            options: [
              { value: "text-sm", label: "Small" },
              { value: "text-base", label: "Medium" },
              { value: "text-lg", label: "Large" },
              { value: "text-xl", label: "Extra large" },
            ],
          },
        },
        {
          type: "select",
          name: "buttonTextSize",
          label: "Button text",
          defaultValue: "text-base",
          configs: {
            options: [
              { value: "text-sm", label: "Small" },
              { value: "text-base", label: "Medium" },
              { value: "text-lg", label: "Large" },
              { value: "text-xl", label: "Extra large" },
            ],
          },
        },
        {
          type: "select",
          name: "consentTextSize",
          label: "Fine print under the button",
          defaultValue: "text-sm",
          configs: {
            options: [
              { value: "text-xs", label: "Extra small" },
              { value: "text-sm", label: "Small" },
              { value: "text-base", label: "Medium" },
              { value: "text-lg", label: "Large" },
            ],
          },
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
          name: "errorTextColor",
          label: "Error message color",
          helpText:
            "Used for messages such as the under-21 warning. Leave empty for the default red.",
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
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "prizeImage",
          label: "Image",
          defaultValue: "",
          helpText:
            "Optional. Leave empty and the form looks exactly as before.",
        },
        {
          type: "select",
          name: "prizeImagePosition",
          label: "Position",
          defaultValue: "above",
          configs: {
            options: [
              { value: "above", label: "Above the form fields" },
              { value: "below", label: "Below the form" },
              { value: "left", label: "Left of the form" },
              { value: "right", label: "Right of the form" },
            ],
          },
          condition: (data: EntryFormProps) => Boolean(data.prizeImage),
        },
        {
          type: "select",
          name: "prizeImageMobilePosition",
          label: "Position on mobile",
          defaultValue: "top",
          configs: {
            options: [
              { value: "top", label: "Above the heading" },
              { value: "after-heading", label: "Between heading and form" },
              { value: "bottom", label: "Below the form" },
            ],
          },
          condition: (data: EntryFormProps) =>
            Boolean(data.prizeImage) &&
            (data.prizeImagePosition === "left" ||
              data.prizeImagePosition === "right"),
        },
        {
          type: "range",
          name: "prizeImageWidth",
          label: "Image width",
          defaultValue: 45,
          configs: { min: 30, max: 60, step: 5, unit: "%" },
          helpText:
            "Share of the row the image takes when it sits next to the form. Side-by-side uses a wider layout than the form width setting.",
          condition: (data: EntryFormProps) =>
            Boolean(data.prizeImage) &&
            (data.prizeImagePosition === "left" ||
              data.prizeImagePosition === "right"),
        },
        {
          type: "range",
          name: "prizeImageRadius",
          label: "Corner radius",
          defaultValue: 0,
          configs: { min: 0, max: 32, step: 2, unit: "px" },
          condition: (data: EntryFormProps) => Boolean(data.prizeImage),
        },
      ],
    },
    {
      group: "After submission",
      inputs: successMessageInputs,
    },
    ...sectionSettings,
  ],
  childTypes: ["subheading", "heading", "paragraph"],
  presets: {
    formWidth: "medium",
    dateFieldStyle: "dropdown",
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
