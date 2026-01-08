import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface AlternatingContentHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function AlternatingContentHeader(props: AlternatingContentHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default AlternatingContentHeader;

export const schema = createSchema({
  type: "alternating-content--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
