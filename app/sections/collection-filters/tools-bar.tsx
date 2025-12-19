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
}

export function ToolsBar({
  enableSort,
  enableFilter,
  filtersPosition,
  showProductsCount,
  gridSizeDesktop,
  gridSizeMobile,
  onGridSizeChange,
  showSidebar,
  setShowSidebar,
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
                className="hidden h-[43px] items-center gap-2.5 border bg-white p-2.5 text-base rounded focus-visible:outline-hidden lg:flex"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <span>Filters</span>
                <SlidersIcon size={18} />
              </button>
            )}
            {enableSort && <Sort />}
            {enableFilter && (
              <FiltersDrawer filtersPosition={filtersPosition} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FiltersDrawer({
  filtersPosition,
}: {
  filtersPosition: ToolsBarProps["filtersPosition"];
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-12 items-center gap-1.5 border py-2",
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
            "fixed inset-y-0 z-10 w-full bg-background py-4 md:w-[360px]",
            "-translate-x-full left-0 data-[state=open]:translate-x-0 data-[state=open]:animate-enter-from-left",
          ])}
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
              <Filters className="px-4" />
            </ScrollArea>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
