import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ClubComparisonItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ClubComparisonItems(props: ClubComparisonItemsProps) {
  const { ref, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {children}
    </div>
  );
}

export default ClubComparisonItems;

export const schema = createSchema({
  type: "club-comparison--items",
  title: "Items",
  childTypes: ["club-comparison--item"],
});
