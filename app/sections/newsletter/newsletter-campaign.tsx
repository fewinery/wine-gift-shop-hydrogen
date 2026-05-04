import { createSchema } from "@weaverse/hydrogen";
import NewsLetterForm from "./newsletter-form";

interface Props {
  buttonText?: string;
  placeholder?: string;
}

export default function EmailFormCampaign(props: Props) {
  return (
    <NewsLetterForm
      {...props}
      formType="campaign"
      buttonText={props.buttonText || "Get Access"}
      placeholder={props.placeholder || "Enter your email"}
    />
  );
}

export const schema = createSchema({
  type: "newsletter-campaign", // ⚠️ no cambiar
  title: "Email Form Campaign", // 👈 esto verás en Weaverse
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
