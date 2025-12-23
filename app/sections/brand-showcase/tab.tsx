import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useContext, useEffect } from "react";
import { TabContext, TabIndexContext } from "./index";

interface BrandShowcaseTabProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  label: string;
}

function BrandShowcaseTab(props: BrandShowcaseTabProps) {
  const { ref, label, children, ...rest } = props;
  const tabContext = useContext(TabContext);
  const tabIndex = useContext(TabIndexContext);

  // Register this tab's label with parent
  useEffect(() => {
    if (tabContext && label) {
      tabContext.registerTab(`tab-${tabIndex}`, label);
      return () => {
        tabContext.unregisterTab(`tab-${tabIndex}`);
      };
    }
  }, [tabContext, tabIndex, label]);

  return (
    <div ref={ref} {...rest}>
      {/* Brand Items - flex wrap, 4 items per row, centered */}
      <div className="flex flex-wrap justify-center gap-8">{children}</div>
    </div>
  );
}

export default BrandShowcaseTab;

export const schema = createSchema({
  type: "brand-showcase--tab",
  title: "Tab",
  childTypes: ["brand-showcase--item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "label",
          label: "Tab Label",
          defaultValue: "Sports",
        },
      ],
    },
  ],
  presets: {
    label: "Sports",
    children: [
      { type: "brand-showcase--item", brandName: "Baltimore Ravens" },
      { type: "brand-showcase--item", brandName: "Carolina Panthers" },
      { type: "brand-showcase--item", brandName: "Cincinnati Bengals" },
      { type: "brand-showcase--item", brandName: "Cleveland Browns" },
    ],
  },
});
