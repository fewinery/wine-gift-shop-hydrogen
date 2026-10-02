import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { EntryFormApiPayload } from "~/routes/api/entry-form";
import { cn } from "~/utils/cn";

interface EntryFormProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLElement>;
  klaviyoListId: string;
  sourceTag: string;
  heading: string;
  description: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
  dateOfBirthLabel: string;
  buttonText: string;
  successMessage: string;
  consentText: string;
  width: "narrow" | "medium" | "wide";
}

const widths = {
  narrow: "max-w-md",
  medium: "max-w-xl",
  wide: "max-w-3xl",
};

const FIELD_CLASS =
  "w-full border border-line bg-white p-3 leading-tight focus:outline-hidden";

function EntryForm(props: EntryFormProps) {
  const {
    ref,
    klaviyoListId,
    sourceTag,
    heading,
    description,
    firstNameLabel,
    lastNameLabel,
    emailLabel,
    dateOfBirthLabel,
    buttonText,
    successMessage,
    consentText,
    width,
    ...rest
  } = props;

  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const result = fetcher.data as EntryFormApiPayload | undefined;
  const submitted = Boolean(result?.ok);
  const showError = state === "idle" && result && !result.ok;

  return (
    <section ref={ref} {...rest} className="w-full px-4 py-12">
      <div className={cn("mx-auto w-full", widths[width] || widths.medium)}>
        {heading && (
          <h2 className="mb-4 text-center font-heading text-3xl">{heading}</h2>
        )}
        {description && (
          <div
            className="mb-8 text-center"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {submitted ? (
          <div
            className="entry-form-success text-center text-lg leading-relaxed [&_a]:underline"
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
                className={FIELD_CLASS}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={state === "submitting"}
            >
              {buttonText || "Submit"}
            </Button>

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
      </div>
    </section>
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
            "Written to every entry as the Klaviyo profile property 'Signup Source' and as the consent record's source. Use it to tell real entrants apart from spam in segments and suppression rules.",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "select",
          name: "width",
          label: "Form width",
          defaultValue: "medium",
          configs: {
            options: [
              { value: "narrow", label: "Narrow" },
              { value: "medium", label: "Medium" },
              { value: "wide", label: "Wide" },
            ],
          },
        },
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Enter to Win",
          placeholder: "Enter to Win",
        },
        {
          type: "richtext",
          name: "description",
          label: "Description",
          defaultValue:
            "<p>Fill in your details below for your chance to win.</p>",
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
      ],
    },
  ],
  presets: {
    width: "medium",
    heading: "Enter to Win",
  },
});
