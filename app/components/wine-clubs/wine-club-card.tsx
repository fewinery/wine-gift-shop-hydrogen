import { Link } from "react-router";
import type { WineClub } from "~/types/winehub";
import { cn } from "~/utils/cn";
import { sanitizeHtml } from "~/utils/winehub";

interface WineClubCardProps {
  club: WineClub;
  showDescription?: boolean;
  className?: string;
}

/**
 * WineClubCard - Reusable wine club card component
 *
 * @description Displays a wine club with image, name, description, and subscription options
 * Used in both listing page and potentially other sections
 *
 * @param club - Wine club data from Winehub API
 * @param showDescription - Whether to show the club description
 * @param className - Additional CSS classes for styling
 */
export function WineClubCard({
  club,
  showDescription = true,
  className,
}: WineClubCardProps) {
  const hasImage = Boolean(club.image);
  const frequencies = club.sellingPlans.map((plan) => plan.name).join(", ");
  const caseSizes = club.caseSizes.map((size) => size.title).join(", ");

  return (
    <Link
      to={`/wine-clubs/${club.id}`}
      className={cn(
        "group flex h-full flex-col border border-black/80 bg-[#FAF9F6] transition-all duration-300 hover:border-[#B59C66] rounded overflow-hidden",
        className,
      )}
    >


      {/* Wine Club Content */}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        {/* Club Name */}
        <h3 className="mb-2 leading-normal uppercase text-3xl transition-colors group-hover:text-[#B59C66]">
          {club.name}
        </h3>

        {/* Club Description */}
        {showDescription && club.description && (
          <div
            className="mb-6 font-body text-lg text-[#5C5C5C] line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(club.description),
            }}
          />
        )}

        {/* Details & CTA Container */}
        <div className="mt-auto space-y-6">
          {/* Metadata */}
          <div className="space-y-2 border-t border-black/20 pt-4 text-sm text-[#5C5C5C]">
            {club.sellingPlans.length > 0 && (
              <div className="flex gap-2">
                <span className="shrink-0 font-bold uppercase tracking-wider text-sm text-[#2F2F2F]">
                  Frequency:
                </span>
                <span>{frequencies}</span>
              </div>
            )}
            {club.caseSizes.length > 0 && (
              <div className="flex gap-2">
                <span className="shrink-0 font-bold uppercase tracking-wider text-sm text-[#2F2F2F]">
                  Case Size:
                </span>
                <span>{caseSizes}</span>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div>
            <span className="inline-flex items-center font-bold uppercase tracking-[0.15em] text-[#2F2F2F] transition-colors group-hover:text-[#B59C66]">
              Get Started
              <svg
                className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * WineClubCardSkeleton - Loading skeleton for wine club card
 *
 * @description Displays a loading placeholder while wine clubs are being fetched
 */
export function WineClubCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col border border-gray-200 bg-[#FAF9F6] rounded-[4px] overflow-hidden",
        className,
      )}
    >
      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="mb-4 h-8 w-3/4 animate-pulse bg-gray-200" />

        <div className="mb-8 space-y-3">
          <div className="h-4 w-full animate-pulse bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse bg-gray-200" />
          <div className="h-4 w-4/6 animate-pulse bg-gray-200" />
        </div>

        <div className="mt-auto space-y-4 pt-4 border-t border-gray-100">
          <div className="h-4 w-2/3 animate-pulse bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse bg-gray-200" />
          <div className="mt-4 h-5 w-24 animate-pulse bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
