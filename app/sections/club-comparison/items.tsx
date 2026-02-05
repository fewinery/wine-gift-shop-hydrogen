import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { CSSProperties } from "react";

interface ClubComparisonItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  columns: number;
  columnsTablet: number;
}

function ClubComparisonItems(props: ClubComparisonItemsProps) {
  const { ref, children, columns, columnsTablet, ...rest } = props;

  const style = {
    "--columns": columns,
    "--columns-tablet": columnsTablet,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      {...rest}
      style={style}
      className="flex flex-wrap justify-center gap-6"
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
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "columns",
          label: "Items per row (Desktop)",
          defaultValue: 3,
          configs: {
            min: 2,
            max: 4,
            step: 1,
          },
        },
        {
          type: "range",
          name: "columnsTablet",
          label: "Items per row (Tablet)",
          defaultValue: 2,
          configs: {
            min: 1,
            max: 3,
            step: 1,
          },
        },
      ],
    },
  ],
});
