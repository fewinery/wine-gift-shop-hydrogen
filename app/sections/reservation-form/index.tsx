import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface ReservationFormProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function ReservationForm(props: ReservationFormProps) {
  const { ref, children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default ReservationForm;

export const schema = createSchema({
  type: "reservation-form",
  title: "Reservation form",
  childTypes: ["reservation-form--header", "reservation-form--content"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    children: [
      {
        type: "reservation-form--header",
        children: [
          {
            type: "heading",
            content: "Reserve Your Tasting",
            as: "h2",
          },
          {
            type: "paragraph",
            content:
              "To request your tasting experience, please fill out the form below and our team will be in touch to assist you. Appointments are required for all Napa Valley visits.",
          },
        ],
      },
      {
        type: "reservation-form--content",
      },
    ],
  },
});
