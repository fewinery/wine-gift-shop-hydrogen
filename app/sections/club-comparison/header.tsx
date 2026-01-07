import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ClubComparisonHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ClubComparisonHeader(props: ClubComparisonHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default ClubComparisonHeader;

export const schema = createSchema({
  type: "club-comparison--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
