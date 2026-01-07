import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ReservationFormHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ReservationFormHeader(props: ReservationFormHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default ReservationFormHeader;

export const schema = createSchema({
  type: "reservation-form--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
