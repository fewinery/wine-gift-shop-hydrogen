import { createSchema } from "@weaverse/hydrogen";
import { Children, useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import type { SwiperClass } from "swiper/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import {
  Section,
  type SectionProps,
  sectionSettings,
} from "~/components/section";

interface QuoteCarouselProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function QuoteCarousel(props: QuoteCarouselProps) {
  const { children, ref, ...rest } = props;

  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  const handlePrev = () => swiper?.slidePrev();
  const handleNext = () => swiper?.slideNext();

  const handleSwiperInit = (s: SwiperClass) => {
    setSwiper(s);
  };

  const slides = Children.toArray(children);
  const totalSlides = slides.length;
  const dots = Array.from({ length: totalSlides }, (_, i) => i);

  return (
    <Section ref={ref} {...rest}>
      <div className="overflow-hidden">
        <Swiper
          onSwiper={handleSwiperInit}
          onSlideChange={(s) => setActiveIndex(s.realIndex)}
          modules={[Navigation, Autoplay]}
          slidesPerView={1}
          spaceBetween={40}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="overflow-visible h-auto!"
        >
          {slides.map((child, idx) => (
            <SwiperSlide key={idx} className="h-auto! flex">
              {child}
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pt-[30px] flex items-center justify-between">
          <div className="flex gap-2">
            {dots.map((index) => (
              <button
                type="button"
                key={index}
                aria-label={`Go to quote ${index + 1}`}
                className={`h-2 w-2 rounded-full ${
                  index === activeIndex ? "bg-black" : "bg-[#ccc7c0]"
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
    </Section>
  );
}

export default QuoteCarousel;

export const schema = createSchema({
  type: "quote-carousel",
  title: "Quote Carousel",
  childTypes: ["quote-carousel-item"],
  settings: [...sectionSettings],
  presets: {
    children: [
      {
        type: "quote-carousel-item",
        quote:
          "I was born and raised in Napa Valley. Wine and the community of Napa has been a big part of my youth and family life experience.",
        authorName: "Adam Henderson",
        authorDescription:
          "<p>Partner</p><p>1883 Reserve Napa Valley<br/>Fairwinds Estate Winery</p>",
      },
      {
        type: "quote-carousel-item",
        quote:
          "Our winemaking philosophy is centered on achieving balance—between soil and rootstocks, fruit and canopy, structure and acidity.",
        authorName: "Sarah Miller",
        authorDescription: "<p>Lead Winemaker<br/>Estate Vineyards</p>",
      },
      {
        type: "quote-carousel-item",
        quote:
          "Great winemaking begins in the vineyard, where we work in harmony with the land to create wines that reflect the terroir.",
        authorName: "John Doe",
        authorDescription: "<p>Viticulturist<br/>Green Valley Farms</p>",
      },
      {
        type: "quote-carousel-item",
        quote:
          "Preserving the environment that makes our wines possible has been at the core of our philosophy for over a decade.",
        authorName: "Jane Smith",
        authorDescription: "<p>Sustainability Director<br/>Eco Wines Co.</p>",
      },
    ],
  },
});
