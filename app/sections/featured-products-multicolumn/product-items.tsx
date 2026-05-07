import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { FeaturedProductsQuery } from "storefront-api.generated";
import { ProductCard } from "~/components/product/product-card";

const variants = cva("grid gap-6", {
  variants: {
    gridSize: {
      "3": "grid-cols-2 lg:grid-cols-3",
      "4": "grid-cols-2 lg:grid-cols-4",
      "5": "grid-cols-2 lg:grid-cols-5",
    },
  },
  defaultVariants: {
    gridSize: "3",
  },
});

interface ProductItemsProps extends VariantProps<typeof variants> {
  ref?: React.Ref<HTMLDivElement>;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}

function ProductItems(props: ProductItemsProps) {
  const {
    ref,
    gridSize,
    titlePricesAlignment,
    contentAlignment,
    showViewProductButton,
    ...rest
  } = props;

  const parent = useParentInstance();

  const products: FeaturedProductsQuery["featuredProducts"] =
    parent.data?.loaderData?.products;

  return (
    <div
      ref={ref}
      {...rest}
      className={variants({ gridSize })}
    >
      {products?.nodes?.map((product) => (
        <div key={product.id} className="flex">
          <ProductCard
            product={product}
            className="w-full"
            titlePricesAlignment={titlePricesAlignment}
            contentAlignment={contentAlignment}
            showViewProductButton={showViewProductButton}
          />
        </div>
      ))}
    </div>
  );
}

export default ProductItems;

export const schema = createSchema({
  type: "featured-products-multicolumn-items",
  title: "Product items",
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "gridSize",
          label: "Grid size",
          configs: {
            options: [
              { value: "3", label: "3 columns" },
              { value: "4", label: "4 columns" },
              { value: "5", label: "5 columns" },
            ],
          },
          defaultValue: "3",
        },
      ],
    },
    {
      group: "Product card",
      inputs: [
        {
          type: "select",
          name: "titlePricesAlignment",
          label: "Title & prices alignment",
          configs: {
            options: [
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ],
          },
          defaultValue: "horizontal",
        },
        {
          type: "toggle-group",
          name: "contentAlignment",
          label: "Content alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
          condition: (data: ProductItemsProps) =>
            data.titlePricesAlignment === "vertical",
        },
        {
          type: "switch",
          name: "showViewProductButton",
          label: "Show view product button",
          defaultValue: true,
        },
      ],
    },
  ],
});
