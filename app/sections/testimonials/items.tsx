import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";

interface TestimonialsItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function TestimonialsItems(props: TestimonialsItemsProps) {
  const { ref, children, ...rest } = props;
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const childrenArray = Array.isArray(children)
    ? children
    : children
      ? [children]
      : [];

  const handleSwiperInit = (swiperInstance: SwiperType) => {
    setSwiper(swiperInstance);
    setSnapCount(swiperInstance.snapGrid.length);
  };

  return (
    <div ref={ref} {...rest}>
      {/* Swiper */}
      <Swiper
        className="py-4"
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={24}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        onSwiper={handleSwiperInit}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        onResize={(s) => setSnapCount(s.snapGrid.length)}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {childrenArray.map((child, index) => (
          <SwiperSlide key={index} className="h-auto! flex">
            {child as React.ReactNode}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation */}
      <div className="pt-[30px] flex items-center justify-between">
        {/* Dots */}
        <div className="flex gap-2">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => swiper?.slideTo(index)}
              aria-label={`Go to position ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === activeIndex ? "bg-black" : "bg-[#ccc7c0]"
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex gap-2.5">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => swiper?.slidePrev()}
            className="flex p-2.5 items-center justify-center rounded-full border border-black"
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => swiper?.slideNext()}
            className="flex p-2.5 items-center justify-center rounded-full border border-black"
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestimonialsItems;

export const schema = createSchema({
  type: "testimonials--items",
  title: "Items",
  childTypes: ["testimonial--item"],
});
