import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface AlternatingContentItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function AlternatingContentItems(props: AlternatingContentItemsProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="space-y-10 md:space-y-16 lg:space-y-20">
      {children}
    </div>
  );
}

export default AlternatingContentItems;

export const schema = createSchema({
  type: "alternating-content--items",
  title: "Items",
  childTypes: ["alternating-content-item"],
});
