import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface TierMembershipHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function TierMembershipHeader(props: TierMembershipHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default TierMembershipHeader;

export const schema = createSchema({
  type: "tier-membership--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
