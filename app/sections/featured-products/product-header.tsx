import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface HeaderContainerProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { ref, gap, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between font-henderson-slab"
      style={{ gap: `${gap}px` }}
    >
      {children}
    </div>
  );
};

export default HeaderContainer;

export const schema = createSchema({
  type: "featured-products--header",
  title: "Products header",
  childTypes: ["heading", "subheading", "paragraph", "view-all-button"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "heading",
        content: "Featured Products",
        as: "h2",
      },
      {
        type: "view-all-button",
      },
    ],
  },
});
