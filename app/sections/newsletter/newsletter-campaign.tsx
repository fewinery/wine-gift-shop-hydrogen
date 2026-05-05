import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import NewsLetterForm from "./newsletter-form";

interface Props extends HydrogenComponentProps {
  buttonText?: string;
  placeholder?: string;
  width?: number;
  helpText?: string;
}

const EmailFormCampaign = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { buttonText, placeholder, width, helpText, ...rest } = props;

  return (
    <div ref={ref} {...rest}>
      <NewsLetterForm
        formType="campaign"
        buttonText={buttonText || "Get Access"}
        placeholder={placeholder || "Enter your email"}
        width={width || 500}
        helpText={helpText}
      />
    </div>
  );
});

export default EmailFormCampaign;

export const schema = createSchema({
  type: "newsletter-campaign",
  title: "Email Form Campaign",
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
          name: "buttonText",
          label: "Button text",
          placeholder: "Subscribe",
          defaultValue: "Get Access",
        },
      ],
    },
  ],
});
