import { createSchema } from "@weaverse/hydrogen";
import { useEffect, useRef, useState } from "react";
import PhoneInput from "react-phone-number-input";
import { useFetcher } from "react-router";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";
import "react-phone-number-input/style.css";

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
  const fetcher = useFetcher<{
    ok: boolean;
    message?: string;
    error?: string;
  }>();
  const formRef = useRef<HTMLFormElement>(null);
  const [phone, setPhone] = useState<string>();

  const isSubmitting = fetcher.state !== "idle";
  const isSuccess = fetcher.data?.ok;
  const errorMessage = fetcher.data?.error;

  useEffect(() => {
    if (isSuccess && formRef.current) {
      formRef.current.reset();
      setPhone(undefined);
    }
  }, [isSuccess]);

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
      <fetcher.Form
        method="post"
        action="/api/contact"
        ref={formRef}
        className="mx-auto max-w-3xl"
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                First Name <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
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
                placeholder="Last Name"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Phone Number */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Phone Number <span className="text-red-600">*</span>
              </span>
              <PhoneInput
                international
                defaultCountry="US"
                value={phone}
                onChange={setPhone}
                className="w-full [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-[--color-line-subtle] [&_.PhoneInputInput]:bg-white [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:py-3 [&_.PhoneInputInput]:transition-colors [&_.PhoneInputInput]:focus:border-[--color-line] [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:focus:ring-1 [&_.PhoneInputInput]:focus:ring-[--color-line]"
                required
              />
              <input type="hidden" name="phone" value={phone || ""} />
            </label>

            {/* Email Address */}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Email Address <span className="text-red-600">*</span>
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full rounded border border-[--color-line-subtle] bg-white px-4 py-3 transition-colors focus:border-[--color-line] focus:outline-none focus:ring-1 focus:ring-[--color-line]"
                required
              />
            </label>
          </div>

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

        {/* Feedback Messages */}
        {isSuccess && (
          <div className="mt-6 rounded bg-green-50 p-4 text-center text-green-800">
            {fetcher.data?.message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-6 rounded bg-red-50 p-4 text-center text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-10 text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-block min-w-[280px] bg-black px-8 py-3 font-henderson-slab font-bold uppercase tracking-wide text-white transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : submitButtonText}
          </button>
        </div>
      </fetcher.Form>
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
