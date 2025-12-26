import { cn } from "~/utils/cn";
import { Link } from "./link";

export function BreadCrumb({
  homeLabel = "Home",
  page,
  subPage,
  parentLink,
  className,
}: {
  homeLabel?: string;
  page: string;
  subPage?: string;
  parentLink?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-body-subtle", className)}>
      <Link to="/" className="underline-offset-4 hover:underline">
        {homeLabel}
      </Link>
      <span>/</span>
      {subPage ? (
        <>
          <Link
            to={parentLink || `/${page.toLowerCase()}`}
            className="underline-offset-4 hover:underline"
          >
            {page}
          </Link>
          <span>/</span>
          <span>{subPage}</span>
        </>
      ) : (
        <span>{page}</span>
      )}
    </div>
  );
}
