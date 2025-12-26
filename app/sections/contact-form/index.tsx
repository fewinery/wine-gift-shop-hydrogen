import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface ContactFormProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
  description?: string;
  submitButtonText?: string;
  topicOptions?: string;
}

function ContactForm(props: ContactFormProps) {
  const { ref, heading, description, submitButtonText, topicOptions, ...rest } =
    props;

  // Parse topic options from string
  const topics = topicOptions
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean) || ["General Inquiry", "Wine Club", "Events", "Other"];

  return (
    <Section ref={ref} {...rest}>
      {/* Header */}
      <div className="mb-12 text-center">
        {heading && <h2 className="mb-4 text-[37px] uppercase">{heading}</h2>}
        {description && (
          <p className="mx-auto max-w-2xl text-base text-[--color-text-subtle]">
            {description}
          </p>
        )}
      </div>

      {/* Form */}
      <form className="mx-auto max-w-3xl">
        <div className="space-y-6">
          {/* First Name */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              First Name <span className="text-red-600">*</span>
            </span>
            <input
              type="text"
              name="firstName"
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
              name="lastName"
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
              name="phone"
              className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
              required
            />
          </label>

          {/* Email Address */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Email Address <span className="text-red-600">*</span>
            </span>
            <input
              type="email"
              name="email"
              className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
              required
            />
          </label>

          {/* Topic */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Topic <span className="text-red-600">*</span>
            </span>
            <select
              name="topic"
              className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
              required
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>

          {/* Questions or Comments */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Questions or Comments <span className="text-red-600">*</span>
            </span>
            <textarea
              name="message"
              rows={5}
              placeholder="Let us know how we can help."
              className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors placeholder:text-[--color-text-subtle] focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
              required
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

export default ContactForm;

export const schema = createSchema({
  type: "contact-form",
  title: "Contact Form",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Contact Us",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Have a question? We're happy to assist. Fill out the form below and our team will be in touch as soon as possible.",
        },
        {
          type: "text",
          name: "topicOptions",
          label: "Topic Options (comma-separated)",
          defaultValue:
            "General Inquiry, Wine Club, Events, Private Tastings, Other",
        },
        {
          type: "text",
          name: "submitButtonText",
          label: "Submit Button Text",
          defaultValue: "Submit",
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
    heading: "Contact Us",
    description:
      "Have a question? We're happy to assist. Fill out the form below and our team will be in touch as soon as possible.",
    topicOptions: "General Inquiry, Wine Club, Events, Private Tastings, Other",
    submitButtonText: "Submit",
  },
});
