import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  useParentInstance,
} from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import { Image } from "~/components/image";
import Link from "~/components/link";
import { useAnimation } from "~/hooks/use-animation";
import type { FeaturedCollectionsLoaderData } from ".";

const variants = cva("", {
  variants: {
    gridSize: {
      4: "grid-cols-2 md:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
      6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    },
    gap: {
      8: "gap-2",
      12: "gap-3",
      16: "gap-4",
      20: "gap-5",
      24: "gap-6",
      28: "gap-7",
      32: "gap-8",
    },
  },
});

interface CategoryItemsData extends VariantProps<typeof variants> {
  imageMaxWidth: number;
  ref?: React.Ref<HTMLDivElement>;
}

function CategoryItems(props: CategoryItemsData & HydrogenComponentProps) {
  const { ref, gridSize, gap, imageMaxWidth, ...rest } = props;
  const [scope] = useAnimation(ref);

  const parent = useParentInstance();
  let collections: FeaturedCollectionsLoaderData = parent.data?.loaderData;
  if (!collections?.length) {
    collections = new Array(Number(gridSize)).fill(COLLECTION_PLACEHOLDER);
  }

  return (
    <div
      ref={scope}
      {...rest}
      className={clsx("grid w-full", variants({ gridSize, gap }))}
    >
      {collections.map((collection, ind) => (
        <Link
          key={collection.id + ind}
          to={`/collections/${collection.handle}`}
          className="group flex flex-col items-center text-center"
          data-motion="fade-up"
        >
          {/* Icon/Image */}
          {collection?.image && (
            <div
              className="mb-3 flex items-center justify-center"
              style={{ maxWidth: imageMaxWidth }}
            >
              <Image
                data={collection.image}
                width={collection.image.width || 120}
                height={collection.image.height || 120}
                sizes="120px"
                className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          {/* Collection Name */}
          <span className="font-henderson-slab text-sm uppercase tracking-wide">
            {collection.title}
          </span>
        </Link>
      ))}
    </div>
  );
}

const COLLECTION_PLACEHOLDER: FeaturedCollectionsLoaderData[0] = {
  id: "gid://shopify/Collection/1234567890",
  title: "Collection",
  handle: "collection-handle",
  description: "Collection description",
  image: {
    id: "gid://shopify/CollectionImage/1234567890",
    altText: "Collection thumbnail",
    width: 120,
    height: 120,
    url: IMAGES_PLACEHOLDERS.collection_1,
  },
};

export default CategoryItems;

export const schema = createSchema({
  type: "shop-by-category-items",
  title: "Category items",
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
              { value: "4", label: "4" },
              { value: "5", label: "5" },
              { value: "6", label: "6" },
            ],
          },
          defaultValue: "6",
        },
        {
          type: "range",
          name: "gap",
          label: "Items gap",
          configs: {
            min: 8,
            max: 32,
            step: 4,
          },
          defaultValue: 24,
        },
        {
          type: "range",
          name: "imageMaxWidth",
          label: "Icon/Image max width",
          configs: {
            min: 60,
            max: 200,
            step: 10,
            unit: "px",
          },
          defaultValue: 100,
        },
      ],
    },
  ],
});
