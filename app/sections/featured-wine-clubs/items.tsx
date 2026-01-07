import { type ComponentLoaderArgs, createSchema } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { Navigation } from "swiper/modules";
import type { SwiperClass } from "swiper/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { WineClubCard } from "~/components/wine-clubs/wine-club-card";
import type { WineClub } from "~/types/winehub";
import { fetchWineClubs } from "~/utils/winehub";

interface WineClubItemsProps {
  ref?: React.Ref<HTMLDivElement>;
  clubsCount: number;
  selectionMode?: "auto" | "manual";
  showMonthly?: boolean;
  showQuarterly?: boolean;
  showBiannual?: boolean;
  showDescription?: boolean;
  loaderData?: WineClubItemsLoaderData;
}

export interface WineClubItemsLoaderData {
  clubs: WineClub[];
  error: boolean;
}

function WineClubItems(props: WineClubItemsProps) {
  const {
    ref,
    clubsCount,
    showDescription = true,
    loaderData,
    ...rest
  } = props;
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

  // Update snap count when clubs change (e.g., after filtering)
  useEffect(() => {
    if (swiper) {
      setSnapCount(swiper.snapGrid?.length || clubs.length);
    }
  }, [clubs.length, swiper]);

  if (loaderData?.error) {
    return (
      <div ref={ref} {...rest} className="text-center py-8">
        <p className="text-gray-500">
          Unable to load wine clubs. Please try again later.
        </p>
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
        slidesPerView={3}
        spaceBetween={24}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 20 },
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
        }}
        className="overflow-visible h-auto!"
      >
        {clubs.map((club) => (
          <SwiperSlide key={club.id} className="h-auto! flex">
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
              className={`h-2 w-2 rounded-full transition-colors ${
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
  );
}

export default WineClubItems;

export const loader = async ({
  data,
  weaverse,
}: ComponentLoaderArgs<{
  clubsCount: number;
  selectionMode?: "auto" | "manual";
  showMonthly?: boolean;
  showQuarterly?: boolean;
  showBiannual?: boolean;
}>): Promise<WineClubItemsLoaderData> => {
  const clubsCount = data?.clubsCount || 8;
  const selectionMode = data?.selectionMode || "auto";
  const showMonthly = data?.showMonthly ?? true;
  const showQuarterly = data?.showQuarterly ?? true;
  const showBiannual = data?.showBiannual ?? true;

  try {
    const allClubs = await fetchWineClubs({ context: weaverse as any });

    // Filter clubs based on selection mode
    let filteredClubs = allClubs;

    if (selectionMode === "manual") {
      const selectedFrequencies: string[] = [];
      if (showMonthly) {
        selectedFrequencies.push("monthly");
      }
      if (showQuarterly) {
        selectedFrequencies.push("quarterly");
      }
      if (showBiannual) {
        selectedFrequencies.push("biannual");
      }

      // Filter clubs if at least one frequency is selected
      if (selectedFrequencies.length > 0) {
        filteredClubs = allClubs.filter((club) =>
          club.sellingPlans.some((plan) => {
            // Normalize plan name for comparison
            const normalizedPlanName = plan.name
              .toLowerCase()
              .replace(/-/g, "");

            // Check if plan matches any selected frequency
            return selectedFrequencies.some((frequency) => {
              const normalizedFrequency = frequency
                .toLowerCase()
                .replace(/-/g, "");
              return normalizedPlanName.includes(normalizedFrequency);
            });
          }),
        );
      }
    }

    const clubs = filteredClubs.slice(0, clubsCount);

    return { clubs, error: false };
  } catch (error) {
    console.error("[FeaturedWineClubsItems] Loader failed:", error);
    return { clubs: [], error: true };
  }
};

export const schema = createSchema({
  type: "featured-wine-clubs--items",
  title: "Wine club items",
  settings: [
    {
      group: "Selection",
      inputs: [
        {
          type: "select",
          name: "selectionMode",
          label: "Selection mode",
          configs: {
            options: [
              { value: "auto", label: "Auto (all clubs)" },
              { value: "manual", label: "Manual (custom frequencies)" },
            ],
          },
          defaultValue: "auto",
          shouldRevalidate: true,
        },
        {
          type: "switch",
          name: "showMonthly",
          label: "Show monthly clubs",
          defaultValue: true,
          shouldRevalidate: true,
          condition: (data: WineClubItemsProps) =>
            data.selectionMode === "manual",
        },
        {
          type: "switch",
          name: "showQuarterly",
          label: "Show quarterly clubs",
          defaultValue: true,
          shouldRevalidate: true,
          condition: (data: WineClubItemsProps) =>
            data.selectionMode === "manual",
        },
        {
          type: "switch",
          name: "showBiannual",
          label: "Show biannual clubs",
          defaultValue: true,
          shouldRevalidate: true,
          condition: (data: WineClubItemsProps) =>
            data.selectionMode === "manual",
        },
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
