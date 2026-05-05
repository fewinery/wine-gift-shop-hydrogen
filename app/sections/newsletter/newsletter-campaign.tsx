import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import NewsLetterForm from "./newsletter-form";

interface Props extends HydrogenComponentProps {
  buttonText?: string;
  placeholder?: string;
}

const EmailFormCampaign = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { buttonText, placeholder, ...rest } = props;

  return (
    <div ref={ref} {...rest}>
      <NewsLetterForm
        formType="campaign"
        buttonText={buttonText || "Get Access"}
        placeholder={placeholder || "Enter your email"}
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
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Get Access",
        },
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Enter your email",
        },
      ],
    },
  ],
});
