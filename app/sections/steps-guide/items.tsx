import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface StepsGuideItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function StepsGuideItems(props: StepsGuideItemsProps) {
  const { ref, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4 lg:gap-[48px]"
    >
      {children}
    </div>
  );
}

export default StepsGuideItems;

export const schema = createSchema({
  type: "steps-guide--items",
  title: "Items",
  childTypes: ["steps-guide--item"],
});
