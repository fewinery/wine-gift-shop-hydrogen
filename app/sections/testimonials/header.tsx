import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface TestimonialsHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function TestimonialsHeader(props: TestimonialsHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}

export default TestimonialsHeader;

export const schema = createSchema({
  type: "testimonials--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
