import { useState } from "react";
import { createSchema } from "@weaverse/hydrogen";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Section, type SectionProps, layoutInputs } from "~/components/section";
import { backgroundInputs } from "~/components/background-image";
import { ArrowLeft, ArrowRight } from "~/components/icons";

interface TestimonialsProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
  subheading?: string;
}

function Testimonials(props: TestimonialsProps) {
  const { children, ref, heading, subheading, ...rest } = props;
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
    <Section ref={ref} {...rest}>
      {/* Header */}
      <div className="mb-12">
        {heading && (
          <h2 className="mb-2 font-henderson-slab text-[30px] uppercase lg:text-[37px]">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="font-henderson-slab uppercase">{subheading}</p>
        )}
      </div>

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
    </Section>
  );
}

export default Testimonials;

export const schema = createSchema({
  type: "testimonials",
  title: "Testimonials",
  childTypes: ["testimonial--item"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "From Our Visitors",
        },
        {
          type: "text",
          name: "subheading",
          label: "Subheading",
          defaultValue:
            "Hear what some of our guests are saying about their visits!",
        },
      ],
    },
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (i) => i.name !== "gap" && i.name !== "borderRadius",
      ),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    heading: "From Our Visitors",
    subheading: "Hear what some of our guests are saying about their visits!",
    gap: 48,
    children: [
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "Our tasting experience was wonderful, informative, and welcoming. Every detail, from the storytelling to the creative touches, made a lasting impression.",
        authorName: "Anne O.",
        location: "Ridgewood, NJ",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "It was the experience of a lifetime! The wine, the caves, and the entire atmosphere were absolutely unforgettable.",
        authorName: "Susan T.",
        location: "New Orleans, LA",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "Amazing caves and tons of wines to choose from, all in a relaxed and beautiful setting. A very special place.",
        authorName: "Greg B.",
        location: "Dallas, TX",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "Our family had the pleasure of tasting incredible wines during our visit. The experience made our daughter's 21st birthday extra special.",
        authorName: "Laura C.",
        location: "Larkspur, CA",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "My fiancée and I visited for her birthday, and it was hands-down our favorite experience of the weekend. The wines were fantastic, and the wine cave tour was an unexpected highlight.",
        authorName: "Andre T.",
        location: "San Francisco, CA",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "An unmissable spot in Napa Valley. Gorgeous property, amazing wine caves for tastings, and truly exceptional service.",
        authorName: "Annie R.",
        location: "Chicago, IL",
      },
      {
        type: "testimonial--item",
        rating: 5,
        quote:
          "I felt like royalty during our visit. The hospitality was impeccable, the wines were delicious, and the setting was beautiful.",
        authorName: "Angie C.",
        location: "Oakland, CA",
      },
    ],
  },
});
