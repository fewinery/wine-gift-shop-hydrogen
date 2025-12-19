import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/api/customer";

interface NewsLetterInputProps extends HydrogenComponentProps {
  width: number;
  placeholder: string;
  buttonText: string;
  helpText: string;
  successText?: string;
  ref?: React.Ref<HTMLDivElement>;
}

function NewsLetterForm(props: NewsLetterInputProps) {
  const {
    buttonText,
    width,
    placeholder,
    helpText,
    successText,
    ref,
    ...rest
  } = props;
  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const data = fetcher.data as CustomerApiPlayLoad;
  const { ok, errorMessage } = data || {};

  return (
    <div ref={ref} {...rest} className="mx-auto max-w-full">
      <Form
        method="POST"
        action="/api/customer"
        className="flex w-full items-center justify-center"
        data-motion="fade-up"
      >
        <input
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="bg-white p-3 leading-tight focus:outline-hidden w-full border my-2.5 mx-1.5"
          style={{ width }}
        />
        <Button
          type="submit"
          className="gap-3"
          loading={state === "submitting"}
        >
          {buttonText}
        </Button>
      </Form>
      {helpText && (
        <div
          className="text-center px-[6px] py-2.5 text-sm"
          data-motion="fade-up"
          dangerouslySetInnerHTML={{ __html: helpText }}
        />
      )}
      <div
        className={clsx(
          "mx-auto mt-4 text-center font-medium",
          state === "idle" && data ? "visible" : "invisible",
          ok ? "text-green-700" : "text-red-700",
        )}
      >
        {ok ? successText : errorMessage || "Something went wrong"}
      </div>
    </div>
  );
}

export default NewsLetterForm;

export const schema = createSchema({
  type: "newsletter-form",
  title: "Form",
  settings: [
    {
      group: "Form",
      inputs: [
        {
          type: "range",
          name: "width",
          label: "Input width",
          configs: {
            min: 300,
            max: 600,
            step: 10,
            unit: "px",
          },
          defaultValue: 500,
        },
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Enter your email",
          placeholder: "Enter your email",
        },
        {
          type: "richtext",
          name: "helpText",
          label: "Help text",
          defaultValue:
            '<div>We care about the protection of your data. Read our <a href="/policies/privacy-policy" style="color: #007AFF; text-decoration: underline;">Privacy Policy</a>.</div>',
        },
        {
          type: "text",
          name: "successText",
          label: "Success message",
          placeholder: "🎉 Thank you for subscribing!",
          defaultValue: "🎉 Thank you for subscribing!",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          placeholder: "Subscribe",
          defaultValue: "Subscribe",
        },
      ],
    },
  ],
});
