import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface ReservationFormProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
  description?: string;
  submitButtonText?: string;
}

// Tasting type options
const tastingTypes = [
  "Select a tasting type",
  "Napa Valley",
  "In-Home",
  "Virtual",
];

// Membership options
const membershipOptions = [
  { value: "platinum", label: "Yes, Platinum" },
  { value: "gold", label: "Yes, Gold" },
  { value: "silver", label: "Yes, Silver" },
  { value: "bronze", label: "Yes, Bronze" },
  { value: "none", label: "No, I'm not a member" },
];

function ReservationForm(props: ReservationFormProps) {
  const { ref, heading, description, submitButtonText, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {/* Header */}
      <div className="mb-12 text-center">
        {heading && (
          <h2 className="mb-4 font-henderson-slab text-[37px] uppercase">
            {heading}
          </h2>
        )}
        {description && (
          <p className="mx-auto max-w-2xl text-base text-[--color-text-subtle]">
            {description}
          </p>
        )}
      </div>

      {/* Form */}
      <form className="mx-auto max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Personal Information */}
          <div className="space-y-6">
            <h3 className="mb-6 border-b border-[--color-line-subtle] pb-3 font-henderson-slab text-xl uppercase tracking-wide">
              Personal Information
            </h3>

            {/* First Name */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                First Name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Last Name */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Last Name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Email <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* Phone Number */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Phone Number <span className="text-red-600">*</span>
              </span>
              <input
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
              <span className="mb-2 block text-sm font-medium">
                Tasting Type <span className="text-red-600">*</span>
              </span>
              <select className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]">
                {tastingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* No. of Guests */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Number of Guests <span className="text-red-600">*</span>
              </span>
              <input
                type="number"
                min="1"
                defaultValue="2"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>

            {/* WinePlus Member */}
            <fieldset className="rounded border border-[--color-line-subtle] bg-[#F9F8F6] p-5">
              <legend className="px-2 text-sm font-medium">
                WinePlus Member? <span className="text-red-600">*</span>
              </legend>
              <div className="space-y-3">
                {membershipOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="membership"
                      value={option.value}
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
            <span className="mb-2 block text-sm font-medium">
              Special Requests or Comments
            </span>
            <textarea
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
            className="inline-block min-w-[280px] bg-black px-8 py-3 font-henderson-slab font-bold uppercase tracking-wide text-white"
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </Section>
  );
}

export default ReservationForm;

export const schema = createSchema({
  type: "reservation-form",
  title: "Reservation Form",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Reserve Your Tasting",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Experience our curated wine collection in an intimate setting. Complete the form below and our hospitality team will confirm your appointment.",
        },
        {
          type: "text",
          name: "submitButtonText",
          label: "Submit Button Text",
          defaultValue: "Request Reservation",
        },
      ],
    },
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (i) => i.name !== "gap" && i.name !== "borderRadius",
      ),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    heading: "Reserve Your Tasting",
    description:
      "Experience our curated wine collection in an intimate setting. Complete the form below and our hospitality team will confirm your appointment.",
    submitButtonText: "Request Reservation",
  },
});
