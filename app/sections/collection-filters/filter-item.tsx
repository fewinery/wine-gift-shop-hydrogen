import * as Checkbox from "@radix-ui/react-checkbox";
import type { Filter } from "@shopify/hydrogen/storefront-api-types";
import { useState } from "react";
import {
  useLocation,
  useNavigate,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import type { RootLoader } from "~/root";
import type { AppliedFilter } from "~/types/others";
import { cn } from "~/utils/cn";
import { getAppliedFilterLink, getFilterLink } from "./filter-utils";

type FilterDisplayAs = "swatch" | "button" | "list-item";

export function FilterItem({
  displayAs,
  option,
  appliedFilters,
  showFiltersCount,
  filterOptionSize,
  filterCountSize,
}: {
  displayAs: FilterDisplayAs;
  option: Filter["values"][0];
  appliedFilters: AppliedFilter[];
  showFiltersCount: boolean;
  filterOptionSize?: number;
  filterCountSize?: number;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const { swatchesConfigs } = useRouteLoaderData<RootLoader>("root");

  const filter = appliedFilters.find(
    (flt) => JSON.stringify(flt.filter) === option.input,
  );

  const [checked, setChecked] = useState(Boolean(filter));

  function handleCheckedChange(newChecked: boolean) {
    setChecked(newChecked);
    if (newChecked) {
      const link = getFilterLink(option.input as string, params, location);
      navigate(link, { preventScrollReset: true });
    } else if (filter) {
      const link = getAppliedFilterLink(filter, params, location);
      navigate(link, { preventScrollReset: true });
    }
  }

  if (displayAs === "swatch") {
    const { colors, images } = swatchesConfigs;
    const swatchImage = images.find(({ name }) => name === option.label);
    const swatchColor = colors.find(({ name }) => name === option.label);

    return (
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            className={cn(
              "h-10 w-10 disabled:cursor-not-allowed",
              "border hover:border-body",
              checked ? "border-line p-1" : "border-line-subtle",
              option.count === 0 && "diagonal",
            )}
            onClick={() => handleCheckedChange(!checked)}
            disabled={option.count === 0}
          >
            <span
              className="inline-block h-full w-full"
              style={{
                backgroundImage: swatchImage?.value
                  ? `url(${swatchImage?.value})`
                  : undefined,
                backgroundSize: "cover",
                backgroundColor:
                  swatchColor?.value || option.label.toLowerCase(),
              }}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <FilterLabel
            option={option}
            showFiltersCount={showFiltersCount}
            filterOptionSize={filterOptionSize}
            filterCountSize={filterCountSize}
          />
        </TooltipContent>
      </Tooltip>
    );
  }

  if (displayAs === "button") {
    return (
      <button
        type="button"
        className={cn(
          "border px-3 py-1.5 text-center disabled:cursor-not-allowed",
          option.count === 0 && "diagonal text-body-subtle",
          checked
            ? "border-line bg-body text-background"
            : "border-line-subtle hover:border-line",
        )}
        onClick={() => handleCheckedChange(!checked)}
        disabled={option.count === 0}
      >
        <FilterLabel
          option={option}
          showFiltersCount={showFiltersCount}
          filterOptionSize={filterOptionSize}
          filterCountSize={filterCountSize}
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        option.count === 0 && "text-body-subtle",
      )}
    >
      <Checkbox.Root
        checked={checked}
        onCheckedChange={handleCheckedChange}
        disabled={option.count === 0}
        className={cn(
          "h-5 w-5 shrink-0",
          "border border-line focus-visible:outline-hidden",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Checkbox.Indicator className="flex items-center justify-center text-current">
          <span className="inline-block h-3 w-3 bg-body" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <FilterLabel
        option={option}
        showFiltersCount={showFiltersCount}
        filterOptionSize={filterOptionSize}
        filterCountSize={filterCountSize}
      />
    </div>
  );
}
function FilterLabel({
  option,
  showFiltersCount,
  filterOptionSize,
  filterCountSize,
}: {
  option: Filter["values"][0];
  showFiltersCount: boolean;
  filterOptionSize?: number;
  filterCountSize?: number;
}) {
  if (showFiltersCount) {
    return (
      <span style={{ fontSize: `${filterOptionSize}px` }}>
        {option.label}{" "}
        <span style={{ fontSize: `${filterCountSize}px` }}>
          ({option.count})
        </span>
      </span>
    );
  }
  return (
    <span style={{ fontSize: `${filterOptionSize}px` }}>{option.label}</span>
  );
}
