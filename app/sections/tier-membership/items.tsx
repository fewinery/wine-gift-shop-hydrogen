import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface TierMembershipItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function TierMembershipItems(props: TierMembershipItemsProps) {
  const { ref, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {children}
    </div>
  );
}

export default TierMembershipItems;

export const schema = createSchema({
  type: "tier-membership--items",
  title: "Items",
  childTypes: ["tier-membership--item"],
});
