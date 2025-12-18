import * as Slider from "@radix-ui/react-slider";

import type { ProductFilter } from "@shopify/hydrogen/storefront-api-types";
import clsx from "clsx";
import { useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type { CollectionQuery } from "storefront-api.generated";
import { FILTER_URL_PREFIX } from "~/utils/const";
import { filterInputToParams } from "./filter-utils";

export function PriceRangeFilter({
  collection,
}: {
  collection: CollectionQuery["collection"];
}) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const thumbRef = useRef<"from" | "to" | null>(null);

  const { minVariantPrice, maxVariantPrice } = getPricesRange(collection);
  const { min, max } = getPricesFromFilter(params);

  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  function handleFilter() {
    let paramsClone = new URLSearchParams(params);
    if (minPrice === undefined && maxPrice === undefined) {
      paramsClone.delete(`${FILTER_URL_PREFIX}price`);
    } else {
      const price = {
        ...(minPrice === undefined ? {} : { min: minPrice }),
        ...(maxPrice === undefined ? {} : { max: maxPrice }),
      };
      paramsClone = filterInputToParams({ price }, paramsClone);
    }
    if (params.toString() !== paramsClone.toString()) {
      navigate(`${location.pathname}?${paramsClone.toString()}`, {
        preventScrollReset: true,
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span>${minPrice ?? minVariantPrice}</span>
        <span>${maxPrice ?? maxVariantPrice}</span>
      </div>
      <Slider.Root
        min={minVariantPrice}
        max={maxVariantPrice}
        step={1}
        minStepsBetweenThumbs={1}
        value={[minPrice || minVariantPrice, maxPrice || maxVariantPrice]}
        onValueChange={([newMin, newMax]) => {
          if (thumbRef.current) {
            if (thumbRef.current === "from") {
              if (maxPrice === undefined || newMin < maxPrice) {
                setMinPrice(newMin);
              }
            } else if (minPrice === undefined || newMax > minPrice) {
              setMaxPrice(newMax);
            }
          } else {
            setMinPrice(newMin);
            setMaxPrice(newMax);
          }
        }}
        onValueCommit={handleFilter}
        className="relative flex h-4 w-full items-center"
      >
        <Slider.Track className="relative h-[3px] grow bg-gray-200">
          <Slider.Range className="absolute h-full bg-black" />
        </Slider.Track>
        {["from", "to"].map((s: "from" | "to") => (
          <Slider.Thumb
            key={s}
            onPointerUp={() => {
              thumbRef.current = null;
            }}
            onPointerDown={() => {
              thumbRef.current = s;
            }}
            className={clsx(
              "block h-3.5 w-3.5 cursor-grab rounded-full bg-black outline-none",
              "focus-visible:outline-hidden",
            )}
            aria-label={s === "from" ? "Min price" : "Max price"}
          />
        ))}
      </Slider.Root>
    </div>
  );
}

function getPricesRange(collection: CollectionQuery["collection"]) {
  const { highestPriceProduct, lowestPriceProduct } = collection;
  const minVariantPrice =
    lowestPriceProduct.nodes[0]?.priceRange?.minVariantPrice;
  const maxVariantPrice =
    highestPriceProduct.nodes[0]?.priceRange?.maxVariantPrice;
  return {
    minVariantPrice: Number(minVariantPrice?.amount) || 0,
    maxVariantPrice: Number(maxVariantPrice?.amount) || 1000,
  };
}

function getPricesFromFilter(params: URLSearchParams) {
  const priceFilter = params.get(`${FILTER_URL_PREFIX}price`);
  const price = priceFilter
    ? (JSON.parse(priceFilter) as ProductFilter["price"])
    : undefined;
  const min = Number.isNaN(Number(price?.min)) ? undefined : Number(price?.min);
  const max = Number.isNaN(Number(price?.max)) ? undefined : Number(price?.max);
  return { min, max };
}
