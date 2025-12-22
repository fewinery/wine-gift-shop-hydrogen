import {
  type ComponentLoaderArgs,
  createSchema,
} from "@weaverse/hydrogen";
import { useState } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperClass } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { WineClubCard } from "~/components/wine-clubs/wine-club-card";
import type { WineClub } from "~/types/winehub";
import { fetchWineClubs } from "~/utils/winehub";

interface WineClubItemsProps {
  ref?: React.Ref<HTMLDivElement>;
  clubsCount: number;
  showDescription?: boolean;
  loaderData?: WineClubItemsLoaderData;
}

export interface WineClubItemsLoaderData {
  clubs: WineClub[];
  error: boolean;
}

function WineClubItems(props: WineClubItemsProps) {
  const { ref, clubsCount, showDescription = true, loaderData, ...rest } = props;
  const clubs = loaderData?.clubs || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  const handlePrev = () => swiper?.slidePrev();
  const handleNext = () => swiper?.slideNext();

  const handleSwiperInit = (s: SwiperClass) => {
    setSwiper(s);
    setSnapCount(s.snapGrid?.length || clubs.length);
  };

  if (loaderData?.error) {
    return (
      <div ref={ref} {...rest} className="text-center py-8">
        <p className="text-gray-500">Unable to load wine clubs. Please try again later.</p>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div ref={ref} {...rest} className="text-center py-8">
        <p className="text-gray-500">No wine clubs available at this time.</p>
      </div>
    );
  }

  const dots = Array.from({ length: snapCount }, (_, i) => i);

  return (
    <div ref={ref} {...rest} className="overflow-hidden">
      <Swiper
        onSwiper={handleSwiperInit}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        onResize={(s) => setSnapCount(s.snapGrid?.length || clubs.length)}
        modules={[Navigation]}
        slidesPerView="auto"
        spaceBetween={30}
        className="overflow-visible h-auto!"
      >
        {clubs.map((club) => (
          <SwiperSlide
            key={club.id}
            className="w-[28vw] min-w-[280px] shrink-0 h-auto! flex"
          >
            <WineClubCard
              club={club}
              showDescription={showDescription}
              className="w-full"
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

export default WineClubItems;

export const loader = async ({
  data,
  weaverse,
}: ComponentLoaderArgs<{ clubsCount: number }>): Promise<WineClubItemsLoaderData> => {
  const clubsCount = data?.clubsCount || 8;

  try {
    const allClubs = await fetchWineClubs({ context: weaverse as any });
    const clubs = allClubs.slice(0, clubsCount);
    return { clubs, error: false };
  } catch (error) {
    console.error("[FeaturedWineClubsItems] Loader failed:", error);
    return { clubs: [], error: true };
  }
};

export const schema = createSchema({
  type: "featured-wine-clubs--items",
  title: "Wine Club Items",
  settings: [
    {
      group: "Selection",
      inputs: [
        {
          type: "range",
          name: "clubsCount",
          label: "Number of clubs to show",
          defaultValue: 8,
          configs: {
            min: 1,
            max: 12,
            step: 1,
          },
          shouldRevalidate: true,
        },
      ],
    },
    {
      group: "Display",
      inputs: [
        {
          type: "switch",
          name: "showDescription",
          label: "Show club descriptions",
          defaultValue: true,
        },
      ],
    },
  ],
});
