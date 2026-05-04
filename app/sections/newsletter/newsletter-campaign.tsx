import { createSchema } from "@weaverse/hydrogen";
import { forwardRef } from "react";
import NewsLetterForm from "./newsletter-form";

interface Props {
  buttonText?: string;
  placeholder?: string;
}

const EmailFormCampaign = forwardRef<any, Props>((props, ref) => {
  const { buttonText, placeholder, ...rest } = props;

  return (
    <NewsLetterForm
      ref={ref}
      {...rest}
      formType="campaign"
      buttonText={buttonText || "Get Access"}
      placeholder={placeholder || "Enter your email"}
    />
  );
});

export default EmailFormCampaign;

export const schema = createSchema({
  type: "newsletter-campaign",
  title: "Email Form Campaign",
  settings: [
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
});
