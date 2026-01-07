import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";

interface ReservationFormContentProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  submitButtonText?: string;
  successMessage?: string;
}

const tastingTypes = [
  "Select a tasting type",
  "Napa Valley",
  "In-Home",
  "Virtual",
];

const membershipOptions = [
  { value: "platinum", label: "Yes, Platinum" },
  { value: "gold", label: "Yes, Gold" },
  { value: "silver", label: "Yes, Silver" },
  { value: "bronze", label: "Yes, Bronze" },
  { value: "none", label: "No, I'm not a member" },
];

function ReservationFormContent(props: ReservationFormContentProps) {
  const {
    ref,
    submitButtonText = "Submit Reservation Request",
    successMessage,
    ...rest
  } = props;
  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const data = fetcher.data as
    | { ok?: boolean; error?: string; message?: string }
    | undefined;
  const { ok, error, message } = data || {};

  return (
    <div ref={ref} {...rest}>
      <Form
        method="POST"
        action="/api/reservation"
        className="mx-auto max-w-4xl"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Personal Information */}
          <div className="space-y-6">
            <h3 className="mb-6 border-b border-[--color-line-subtle] pb-3 font-henderson-slab text-xl uppercase tracking-wide">
              Personal Information
            </h3>

            {/* First Name */}
            <label className="block">
              <span className="mb-2 block font-medium">
                First Name<span className="text-red-600">*</span>:
              </span>
              <input
                name="firstName"
                type="text"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Last Name */}
            <label className="block">
              <span className="mb-2 block font-medium">
                Last Name<span className="text-red-600">*</span>:
              </span>
              <input
                name="lastName"
                type="text"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Email */}
            <label className="block">
              <span className="mb-2 block font-medium">
                Email<span className="text-red-600">*</span>:
              </span>
              <input
                name="email"
                type="email"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Phone Number */}
            <label className="block">
              <span className="mb-2 block font-medium">
                Phone Number<span className="text-red-600">*</span>:
              </span>
              <input
                name="phone"
                type="tel"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>
          </div>

          {/* Right Column - Booking Details */}
          <div className="space-y-6">
            <h3 className="mb-6 border-b border-[--color-line-subtle] pb-3 font-henderson-slab text-xl uppercase tracking-wide">
              Booking Details
            </h3>

            {/* Tasting Type */}
            <label className="block">
              <span className="mb-2 block font-medium">
                What type of tasting are you booking?
                <span className="text-red-600">*</span>:
              </span>
              <select
                name="tastingType"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              >
                {tastingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* No. of Guests */}
            <label className="block">
              <span className="mb-2 block font-medium">
                No. of Guests (including yourself)
                <span className="text-red-600">*</span>:
              </span>
              <input
                name="numberOfGuests"
                type="number"
                min="1"
                defaultValue="2"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* WinePlus Member */}
            <fieldset className="rounded border border-[--color-line-subtle] bg-[#F9F8F6] p-5">
              <legend className="px-2 font-medium">
                Are you a WinePlus Member?
                <span className="text-red-600">*</span>:
              </legend>
              <div className="space-y-3">
                {membershipOptions.map((option, idx) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="membership"
                      value={option.value}
                      required={idx === 0}
                      className="h-4 w-4 border-[--color-line-subtle] text-[--color-line] focus:ring-[--color-line]"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Full Width - Comments */}
        <div className="mt-8">
          <label className="block">
            <span className="mb-2 block font-medium">Comments:</span>
            <textarea
              name="comments"
              rows={5}
              placeholder="Let us know about any dietary restrictions, occasion celebrations, or special requests..."
              className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors placeholder:text-[--color-text-subtle] focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
            />
          </label>
        </div>

        {/* Submit Button */}
        <div className="mt-10 text-center">
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-block min-w-[280px] bg-black px-8 py-3 font-henderson-slab font-bold uppercase tracking-wide text-white transition-opacity disabled:opacity-50"
          >
            {state === "submitting" ? "Submitting..." : submitButtonText}
          </button>
        </div>

        {/* Success/Error Message */}
        <div
          className={clsx(
            "mx-auto mt-6 text-center font-medium text-sm",
            state === "idle" && data ? "visible" : "invisible",
            ok ? "text-green-700" : "text-red-700",
          )}
        >
          {ok
            ? successMessage || message
            : error || "Something went wrong. Please try again."}
        </div>
      </Form>
    </div>
  );
}

export default ReservationFormContent;

export const schema = createSchema({
  type: "reservation-form--content",
  title: "Form Content",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "submitButtonText",
          label: "Submit Button Text",
          defaultValue: "Submit Reservation Request",
        },
        {
          type: "text",
          name: "successMessage",
          label: "Success Message",
          defaultValue:
            "🎉 Thank you! Your reservation request has been received. We'll contact you soon.",
        },
      ],
    },
  ],
});
