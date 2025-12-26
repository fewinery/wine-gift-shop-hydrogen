import { createSchema } from "@weaverse/hydrogen";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { BreadCrumb } from "~/components/breadcrumb";
import { Image } from "~/components/image";
import { Section, type SectionProps } from "~/components/section";
import { Filters } from "./filters";
import { ProductsPagination } from "./products-pagination";
import { ToolsBar } from "./tools-bar";

export interface CollectionFiltersData {
  showBreadcrumb: boolean;
  showDescription: boolean;
  showBanner: boolean;
  showOverlay: boolean;
  bannerHeightDesktop: number;
  bannerHeightMobile: number;
  enableSort: boolean;
  showProductsCount: boolean;
  enableFilter: boolean;
  filtersPosition: "sidebar" | "drawer";
  expandFilters: boolean;
  showFiltersCount: boolean;
  enableSwatches: boolean;
  displayAsButtonFor: string;
  productsPerRowDesktop: number;
  productsPerRowMobile: number;
  loadPrevText: string;
  loadMoreText: string;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}

interface CollectionFiltersProps extends SectionProps, CollectionFiltersData {
  ref: React.Ref<HTMLElement>;
}

export default function CollectionFilters(props: CollectionFiltersProps) {
  const {
    ref,
    showBreadcrumb,
    showDescription,
    showBanner,
    showOverlay,
    bannerHeightDesktop,
    bannerHeightMobile,
    enableSort,
    showFiltersCount,
    enableFilter,
    filtersPosition,
    expandFilters,
    showProductsCount,
    enableSwatches,
    displayAsButtonFor,
    productsPerRowDesktop,
    productsPerRowMobile,
    loadPrevText,
    loadMoreText,
    titlePricesAlignment,
    contentAlignment,
    showViewProductButton,
    ...rest
  } = props;

  const { collection, collections } = useLoaderData<
    CollectionQuery & {
      collections: Array<{ handle: string; title: string }>;
    }
  >();

  const [gridSizeDesktop, setGridSizeDesktop] = useState(
    Number(productsPerRowDesktop) || 3,
  );
  const [gridSizeMobile, setGridSizeMobile] = useState(
    props.productsPerRowMobile,
  );
  const [showSidebar, setShowSidebar] = useState(enableFilter);

  useEffect(() => {
    setGridSizeDesktop(Number(productsPerRowDesktop) || 3);
    setGridSizeMobile(Number(productsPerRowMobile) || 1);
  }, [productsPerRowDesktop, productsPerRowMobile]);

  useEffect(() => {
    setShowSidebar(enableFilter);
  }, [enableFilter]);

  if (collection?.products && collections) {
    const banner = collection.metafield
      ? collection.metafield.reference.image
      : collection.image;
    return (
      <Section ref={ref} {...rest} overflow="unset">
        <div className="">
          {showBreadcrumb && (
            <BreadCrumb page={collection.title} className="mb-2.5" />
          )}
          {(!showBanner || !banner) && (
            <h3 className="text-center py-10">{collection.title}</h3>
          )}
          {showDescription && collection.description && (
            <p className="mt-2.5 text-body-subtle">{collection.description}</p>
          )}
          {showBanner && banner && (
            <div
              className={clsx([
                "overflow-hidden bg-gray-100 relative flex items-center justify-center",
                "rounded-(--banner-border-radius)",
                "h-(--banner-height-mobile) lg:h-(--banner-height-desktop)",
              ])}
              style={
                {
                  "--banner-height-desktop": `${bannerHeightDesktop}px`,
                  "--banner-height-mobile": `${bannerHeightMobile}px`,
                } as React.CSSProperties
              }
            >
              <Image
                data={banner}
                sizes="auto"
                width={2000}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {showOverlay && (
                <div className="absolute inset-0 bg-[#00000099]" />
              )}
              <h3 className="relative z-[1] text-center font-henderson-slab text-white text-[25.6px] font-medium uppercase">
                {collection.title}
              </h3>
            </div>
          )}
        </div>

        <div className="flex">
          {filtersPosition === "sidebar" && showSidebar && (
            <div className="hidden w-72 shrink-0 px-8 my-16 border-r lg:block">
              <div className="sticky top-[calc(var(--height-nav)+40px)] space-y-4">
                <Filters />
              </div>
            </div>
          )}
          <div className="flex-1 p-8">
            <ToolsBar
              width={rest.width}
              gridSizeDesktop={gridSizeDesktop}
              gridSizeMobile={gridSizeMobile}
              onGridSizeChange={(v) => {
                if (v > 2) {
                  setGridSizeDesktop(v);
                } else {
                  setGridSizeMobile(v);
                }
              }}
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
              {...props}
            />
            <ProductsPagination
              gridSizeDesktop={gridSizeDesktop}
              gridSizeMobile={gridSizeMobile}
              loadPrevText={loadPrevText}
              loadMoreText={loadMoreText}
              titlePricesAlignment={titlePricesAlignment}
              contentAlignment={contentAlignment}
              showViewProductButton={showViewProductButton}
            />
          </div>
        </div>
      </Section>
    );
  }
  return <Section ref={ref} {...rest} />;
}

export const schema = createSchema({
  type: "collection-filters",
  title: "Collection filters",
  limit: 1,
  enabledOn: {
    pages: ["COLLECTION"],
  },
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "switch",
          name: "showBreadcrumb",
          label: "Show breadcrumb",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showDescription",
          label: "Show description",
          defaultValue: false,
        },
      ],
    },
    {
      group: "Banner",
      inputs: [
        {
          type: "switch",
          name: "showBanner",
          label: "Show banner",
          defaultValue: true,
          helpText:
            "A custom banner can be stored under `custom.collection_banner` metafield.",
        },
        {
          type: "switch",
          name: "showOverlay",
          label: "Show overlay",
          defaultValue: false,
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
        {
          type: "range",
          name: "bannerHeightDesktop",
          label: "Banner height (desktop)",
          defaultValue: 350,
          configs: {
            min: 100,
            max: 600,
            step: 1,
          },
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
        {
          type: "range",
          name: "bannerHeightMobile",
          label: "Banner height (mobile)",
          defaultValue: 200,
          configs: {
            min: 50,
            max: 400,
            step: 1,
          },
          condition: (data: CollectionFiltersData) => data.showBanner,
        },
      ],
    },
    {
      group: "Filtering and sorting",
      inputs: [
        {
          type: "switch",
          name: "enableSort",
          label: "Enable sorting",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showProductsCount",
          label: "Show products count",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "enableFilter",
          label: "Enable filtering",
          defaultValue: true,
        },
        {
          type: "select",
          name: "filtersPosition",
          label: "Filters position",
          configs: {
            options: [
              { value: "sidebar", label: "Sidebar" },
              { value: "drawer", label: "Drawer" },
            ],
          },
          defaultValue: "sidebar",
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "expandFilters",
          label: "Expand filters",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "showFiltersCount",
          label: "Show filters count",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "switch",
          name: "enableSwatches",
          label: "Enable color/image swatches",
          defaultValue: true,
          condition: (data: CollectionFiltersData) => data.enableFilter,
        },
        {
          type: "text",
          name: "displayAsButtonFor",
          label: "Display as button for:",
          defaultValue: "Size, More filters",
          condition: (data: CollectionFiltersData) => data.enableFilter,
          helpText: "Comma-separated list of filters to display as buttons",
        },
      ],
    },
    {
      group: "Products grid",
      inputs: [
        {
          type: "select",
          name: "productsPerRowDesktop",
          label: "Default products per row (desktop)",
          configs: {
            options: [
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "5", label: "5" },
            ],
          },
          defaultValue: "3",
        },
        {
          type: "select",
          name: "productsPerRowMobile",
          label: "Default products per row (mobile)",
          configs: {
            options: [
              { value: "1", label: "1" },
              { value: "2", label: "2" },
            ],
          },
          defaultValue: "1",
        },
        {
          type: "text",
          name: "loadPrevText",
          label: "Load previous text",
          defaultValue: "↑ Load previous",
          placeholder: "↑ Load previous",
        },
        {
          type: "text",
          name: "loadMoreText",
          label: "Load more text",
          defaultValue: "Load more ↓",
          placeholder: "Load more ↓",
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
          condition: (data: CollectionFiltersData) =>
            data.titlePricesAlignment === "vertical",
        },
        {
          type: "switch",
          name: "showViewProductButton",
          label: "Show View Product button",
          defaultValue: true,
        },
      ],
    },
  ],
});
