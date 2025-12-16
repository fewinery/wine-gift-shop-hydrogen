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
  const hasDescription = Boolean(club.description);
  const frequencies = club.sellingPlans.map((plan) => plan.name).join(", ");

  return (
    <Link
      to={`/wine-clubs/${club.id}`}
      className={cn(
        "group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md",
        className,
      )}
    >
      {/* Wine Club Image */}
      {hasImage && (
        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={club.image!}
            alt={club.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      {/* Wine Club Content */}
      <div className="p-4">
        {/* Club Name */}
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          {club.name}
        </h3>

        {/* Club Description */}
        {showDescription && hasDescription && (
          <div
            className="mb-3 line-clamp-3 text-sm text-gray-600"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(club.description!),
            }}
          />
        )}

        {/* Subscription Frequencies */}
        {club.sellingPlans.length > 0 && (
          <div className="mb-2 text-sm text-gray-500">
            <span className="font-medium">Frequencies:</span> {frequencies}
          </div>
        )}

        {/* Case Sizes */}
        {club.caseSizes.length > 0 && (
          <div className="text-sm text-gray-500">
            <span className="font-medium">Case Sizes:</span>{" "}
            {club.caseSizes.map((size) => size.title).join(", ")}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-4">
          <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:underline">
            Get Started
            <svg
              className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
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
        "overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
        className,
      )}
    >
      {/* Image Skeleton */}
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mb-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
