import { Image as HydrogenImage } from "@shopify/hydrogen";
import type { Image as ImageType } from "@shopify/hydrogen/storefront-api-types";
import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "~/utils/cn";

type Crop = "center" | "top" | "bottom" | "left" | "right";

export interface ImageProps
  extends Omit<React.ComponentPropsWithRef<"img">, "ref"> {
  ref?: React.Ref<HTMLDivElement>;
  aspectRatio?: string;
  crop?: "center" | "top" | "bottom" | "left" | "right";
  data?: Partial<
    ImageType & {
      recurseIntoArrays: true;
    }
  >;
  loader?: (params: {
    src?: ImageType["url"];
    width?: number;
    height?: number;
    crop?: Crop;
  }) => string;
  srcSetOptions?: {
    intervals: number;
    startingWidth: number;
    incrementSize: number;
    placeholderWidth: number;
  };
}

export function Image({ ref, className, onLoad, ...rest }: ImageProps) {
  /**
   * Use useRef for HydrogenImage, so we can access the HydrogenImage's ref
   * even when using ref prop for the outer div
   */
  const hydrogenImageRef = useRef<HTMLImageElement>(null);

  // Images that finished loading before the page became interactive never
  // fire onLoad, so notify the caller (e.g. the product card spinner) here.
  useEffect(() => {
    if (hydrogenImageRef.current?.complete) {
      onLoad?.({} as React.SyntheticEvent<HTMLImageElement>);
    }
  }, [onLoad]);

  return (
    <div ref={ref} className={cn("h-full w-full overflow-hidden", className)}>
      <HydrogenImage
        ref={hydrogenImageRef}
        className="h-full max-h-full w-full object-cover object-center"
        onLoad={onLoad}
        {...rest}
      />
    </div>
  );
}
