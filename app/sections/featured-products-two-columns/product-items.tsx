import {
  createSchema,
  useParentInstance,
  type HydrogenComponentProps,
} from "@weaverse/hydrogen";
import type { FeaturedProductsQuery } from "storefront-api.generated";
import { ProductCard } from "~/components/product/product-card";

interface ProductItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}

function ProductItems(props: ProductItemsProps) {
  const {
    ref,
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
      className={`flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-6 w-full max-w-5xl mx-auto ${rest.className || ""}`}
    >
      {products?.nodes?.map((product) => (
        <div key={product.id} className="w-full sm:w-[calc(50%-12px)] max-w-md flex justify-center">
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
  type: "featured-products-two-columns-items",
  title: "Product items",
  settings: [
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
