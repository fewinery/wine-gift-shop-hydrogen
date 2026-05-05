import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";

interface Props extends HydrogenComponentProps {
  placeholder?: string;
  buttonText?: string;
}

const EmailFormCampaign = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { placeholder, buttonText, ...rest } = props;

  const fetcher = useFetcher();
  const { Form, state } = fetcher;

  return (
    <div ref={ref} {...rest} className="text-center py-10">
      <Form method="POST" action="/api/customer">
        <input type="hidden" name="formType" value="campaign" />

        <input
          name="email"
          type="email"
          required
          placeholder={placeholder || "Enter your email"}
          className="border p-3 mr-2"
        />

        <Button type="submit" loading={state === "submitting"}>
          {buttonText || "Get Access"}
        </Button>
      </Form>
    </div>
  );
});

export default EmailFormCampaign;

export const schema = createSchema({
  type: "email-form-campaign",
  title: "Email Form Campaign",
  settings: [
    {
      group: "Form",
      inputs: [
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Enter your email",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Get Access",
        },
      ],
    },
  ],
});
