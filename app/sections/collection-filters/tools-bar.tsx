import { SlidersIcon, XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { useLoaderData } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { Button } from "~/components/button";
import { ScrollArea } from "~/components/scroll-area";
import { cn } from "~/utils/cn";
import { Filters } from "./filters";
import type { LayoutSwitcherProps } from "./layout-switcher";
import { Sort } from "./sort";

interface ToolsBarProps extends LayoutSwitcherProps {
  enableSort: boolean;
  showProductsCount: boolean;
  enableFilter: boolean;
  filtersPosition: "sidebar" | "drawer";
  expandFilters: boolean;
  showFiltersCount: boolean;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  filterWidth?: number;
  filterTitleSize?: number;
  filterOptionSize?: number;
  filterCountSize?: number;
  filterSectionSpacing?: number;
}

export function ToolsBar({
  enableSort,
  enableFilter,
  filtersPosition,
  showProductsCount,
  showSidebar,
  setShowSidebar,
  filterWidth,
  filterTitleSize,
  filterOptionSize,
  filterCountSize,
  filterSectionSpacing,
}: ToolsBarProps) {
  const { collection } = useLoaderData<CollectionQuery>();
  return (
    <div className="pt-4 pb-12">
      <div className="flex w-full items-center justify-between gap-4 md:gap-8">
        {showProductsCount && (
          <span className="hidden text-center uppercase md:inline font-henderson-slab my-4">
            PRODUCTS {collection?.products.nodes.length}
          </span>
        )}
        {(enableSort || enableFilter || filtersPosition === "sidebar") && (
          <div className="flex gap-2">
            {filtersPosition === "sidebar" && (
              <button
                type="button"
                className="hidden h-[43px] items-center justify-between gap-1.5 whitespace-nowrap rounded-none border border-(--btn-outline-text) bg-transparent px-4 py-3 text-base font-normal leading-tight text-(--btn-outline-text) transition-colors hover:border-(--btn-outline-text) hover:bg-(--btn-outline-text) hover:text-background focus-visible:outline-hidden lg:inline-flex"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <span>Filters</span>
                <SlidersIcon size={18} />
              </button>
            )}
            {enableSort && <Sort />}
            {enableFilter && (
              <FiltersDrawer
                filtersPosition={filtersPosition}
                filterWidth={filterWidth}
                filterTitleSize={filterTitleSize}
                filterOptionSize={filterOptionSize}
                filterCountSize={filterCountSize}
                filterSectionSpacing={filterSectionSpacing}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
  filterWidth,
  filterTitleSize,
  filterOptionSize,
  filterCountSize,
  filterSectionSpacing,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
  filterWidth?: number;
  filterTitleSize?: number;
  filterOptionSize?: number;
  filterCountSize?: number;
  filterSectionSpacing?: number;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-[43px] items-center gap-1.5 border py-2",
            filtersPosition === "sidebar" && "lg:hidden",
          )}
          animate={false}
        >
          <SlidersIcon size={18} />
          <span>Filter</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade-in fixed inset-0 z-10 bg-black/50" />
        <Dialog.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={clsx([
            "fixed inset-y-0 z-10 w-full bg-background py-4 md:w-auto",
            "-translate-x-full left-0 data-[state=open]:translate-x-0 data-[state=open]:animate-enter-from-left",
          ])}
          style={{ maxWidth: `${filterWidth}px` }}
          aria-describedby={undefined}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 px-4">
              <Dialog.Title asChild className="py-2.5 font-bold">
                <span>Filters</span>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="translate-x-2 p-2"
                  aria-label="Close filters drawer"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <ScrollArea className="max-h-[calc(100vh-4.5rem)]" size="sm">
              <Filters
                className="px-4"
                filterTitleSize={filterTitleSize}
                filterOptionSize={filterOptionSize}
                filterCountSize={filterCountSize}
                filterSectionSpacing={filterSectionSpacing}
              />
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
