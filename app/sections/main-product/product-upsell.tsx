import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ProductCardFragment } from "storefront-api.generated";
import { layoutInputs } from "~/components/section";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { ProductCard } from "~/components/product/product-card";
import { Navigation } from "swiper/modules";
import type { SwiperClass } from "swiper/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { loader as productRouteLoader } from "~/routes/products/product";
import { cn } from "~/utils/cn";

interface ProductUpsellProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  heading: string;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}

export default function ProductUpsell(props: ProductUpsellProps) {
  const {
    ref,
    heading,
    titlePricesAlignment = "vertical",
    contentAlignment = "center",
    showViewProductButton = false,
    className,
    ...rest
  } = props;
  const { product } = useLoaderData<typeof productRouteLoader>();

  const upsellProducts = (
    (product as any)?.goesWellWith?.references?.nodes ?? []
  ) as ProductCardFragment[];

  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  if (!upsellProducts.length) {
    return null;
  }

  function handlePrev() {
    swiper?.slidePrev();
  }
  function handleNext() {
    swiper?.slideNext();
  }

  function handleSwiperInit(s: SwiperClass) {
    setSwiper(s);
    setSnapCount(s.snapGrid?.length || upsellProducts.length || 0);
  }

  const dots = Array.from({ length: snapCount }, (_, i) => i);

  return (
    <div ref={ref} {...rest} className={cn("w-full px-3 md:px-10 lg:px-16 pb-6", className)}>
      {heading && (
        <h2 className="mb-6 font-heading text-2xl uppercase">{heading}</h2>
      )}
      <div className="overflow-hidden">
        <Swiper
          onSwiper={handleSwiperInit}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          onResize={(s) =>
            setSnapCount(s.snapGrid?.length || upsellProducts.length || 0)
          }
          modules={[Navigation]}
          slidesPerView={2}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
          }}
          className="overflow-visible h-auto!"
        >
          {upsellProducts.map((p) => (
            <SwiperSlide key={p.id} className="h-auto! flex">
              <ProductCard
                product={p}
                className="w-full"
                titlePricesAlignment={titlePricesAlignment}
                contentAlignment={contentAlignment}
                showViewProductButton={showViewProductButton}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pt-[30px] flex items-center justify-between">
          <div className="flex gap-2">
            {dots.map((index) => (
              <button
                type="button"
                key={index}
                aria-label={`Go to position ${index + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  index === activeIndex ? "bg-black" : "bg-[#ccc7c0]"
                )}
                onClick={() => swiper?.slideTo(index)}
              />
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              aria-label="Previous"
              onClick={handlePrev}
              className="flex p-2.5 items-center justify-center rounded-full border border-black"
            >
              <ArrowLeft />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={handleNext}
              className="flex p-2.5 items-center justify-center rounded-full border border-black"
            >
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--upsell",
  title: "Goes well with",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs,
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Goes well with",
          placeholder: "Goes well with",
        },
      ],
    },
  ],
});
