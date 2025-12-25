import { createSchema, useParentInstance } from "@weaverse/hydrogen";
import { useState } from "react";
import type { FeaturedProductsQuery } from "storefront-api.generated";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperClass } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { ProductCard } from "~/components/product/product-card";

interface ProductItemsProps {
  ref?: React.Ref<HTMLDivElement>;
  titlePricesAlignment?: "horizontal" | "vertical";
  contentAlignment?: "left" | "center" | "right";
  showViewProductButton?: boolean;
}

function ProductItems(props: ProductItemsProps) {
  const { ref, titlePricesAlignment, contentAlignment, showViewProductButton, ...rest } = props;
  const parent = useParentInstance();
  const products: FeaturedProductsQuery["featuredProducts"] =
    parent.data?.loaderData?.products;

  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  const handlePrev = () => swiper?.slidePrev();
  const handleNext = () => swiper?.slideNext();

  const handleSwiperInit = (s: SwiperClass) => {
    setSwiper(s);
    setSnapCount(s.snapGrid?.length || products?.nodes?.length || 0);
  };

  const dots = Array.from({ length: snapCount }, (_, i) => i);

  return (
    <div ref={ref} {...rest} className="overflow-hidden">
      <Swiper
        onSwiper={handleSwiperInit}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        onResize={(s) => setSnapCount(s.snapGrid?.length || products?.nodes?.length || 0)}
        modules={[Navigation]}
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="overflow-visible h-auto!"
      >
        {products?.nodes?.map((product) => (
          <SwiperSlide
            key={product.id}
            className="h-auto! flex"
          >
            <ProductCard
              product={product}
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
              className={`h-2 w-2 rounded-full transition-colors ${index === activeIndex ? "bg-black" : "bg-[#ccc7c0]"
                }`}
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
  );
}

export default ProductItems;

export const schema = createSchema({
  type: "featured-products-items",
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
              { value: "center", label: "Center", icon: "align-center-vertical" },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
          condition: (data: ProductItemsProps) => data.titlePricesAlignment === "vertical",
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
