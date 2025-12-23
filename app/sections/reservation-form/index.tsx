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
      <div className="mb-8 text-center">
        {heading && (
          <h2 className="mb-4 font-henderson-slab text-[40px] uppercase">
            {heading}
          </h2>
        )}
        {description && <p>{description}</p>}
      </div>

      {/* Form */}
      <form className="mx-auto max-w-xl space-y-6">
        {/* Tasting Type */}
        <label className="block">
          <span className="mb-1 block text-sm">
            What type of tasting are you booking?*:
          </span>
          <select className="w-full border border-gray-300 bg-white px-4 py-3">
            {tastingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        {/* First Name */}
        <label className="block">
          <span className="mb-1 block text-sm">First Name*:</span>
          <input
            type="text"
            className="w-full border border-gray-300 px-4 py-3"
            required
          />
        </label>

        {/* Last Name */}
        <label className="block">
          <span className="mb-1 block text-sm">Last Name*:</span>
          <input
            type="text"
            className="w-full border border-gray-300 px-4 py-3"
            required
          />
        </label>

        {/* Email */}
        <label className="block">
          <span className="mb-1 block text-sm">Email*:</span>
          <input
            type="email"
            className="w-full border border-gray-300 px-4 py-3"
            required
          />
        </label>

        {/* Phone Number */}
        <label className="block">
          <span className="mb-1 block text-sm">Phone Number*:</span>
          <input
            type="tel"
            className="w-full border border-gray-300 px-4 py-3"
            required
          />
        </label>

        {/* WinePlus Member */}
        <fieldset className="border border-gray-300 p-4">
          <legend className="px-2 text-sm">Are you a WinePlus Member?*</legend>
          <div className="space-y-3">
            {membershipOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="membership"
                  value={option.value}
                  className="h-4 w-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* No. of Guests */}
        <label className="block">
          <span className="mb-1 block text-sm">
            No. of Guests (including yourself)*:
          </span>
          <input
            type="number"
            min="1"
            className="w-full border border-gray-300 px-4 py-3"
            required
          />
        </label>

        {/* Comments */}
        <label className="block">
          <span className="mb-1 block text-sm">Comments:</span>
          <textarea
            rows={4}
            placeholder="Let us know about any special requests."
            className="w-full border border-gray-300 px-4 py-3"
          />
        </label>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-black p-2.5 font-henderson-slab font-bold uppercase text-white"
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
          defaultValue: "Reserve Now",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "To request your tasting experience, please fill out the form below and our team will be in touch to assist you. Appointments are required for all Napa Valley visits.",
        },
        {
          type: "text",
          name: "submitButtonText",
          label: "Submit Button Text",
          defaultValue: "Submit Reservation Request",
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
    heading: "Reserve Now",
    description:
      "To request your tasting experience, please fill out the form below and our team will be in touch to assist you. Appointments are required for all Napa Valley visits.",
    submitButtonText: "Submit Reservation Request",
  },
});
