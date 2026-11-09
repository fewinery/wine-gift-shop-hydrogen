import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "~/components/icons";
import { cn } from "~/utils/cn";

/**
 * The add-on quantity control: an "Add" button that becomes a −/+ stepper
 * once there is something to count.
 *
 * Shared by the wine picker and the merch row so the two add-on sections on
 * a product page behave identically. They sat one above the other with
 * different interactions - one a toggle, one a stepper - which read as two
 * unrelated features rather than one idea.
 */
export function AddStepper({
  quantity,
  canAdd,
  onChange,
  addLabel,
  disabled,
}: {
  quantity: number;
  canAdd: boolean;
  onChange: (next: number) => void;
  addLabel: string;
  disabled?: boolean;
}) {
  if (quantity === 0) {
    const blocked = disabled || !canAdd;
    return (
      <button
        type="button"
        disabled={blocked}
        onClick={() => onChange(1)}
        className={cn(
          "w-full border border-neutral-400 px-3 py-2 text-sm transition-colors",
          blocked
            ? "cursor-not-allowed opacity-40"
            : "hover:border-black hover:bg-neutral-50",
        )}
      >
        {addLabel}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between border border-black">
      <button
        type="button"
        aria-label="Remove one"
        onClick={() => onChange(quantity - 1)}
        className="px-3 py-2 text-base leading-none transition-colors hover:bg-neutral-100"
      >
        &minus;
      </button>
      <span className="text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Add one more"
        disabled={disabled || !canAdd}
        onClick={() => onChange(quantity + 1)}
        className={cn(
          "px-3 py-2 text-base leading-none transition-colors",
          disabled || !canAdd
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-neutral-100",
        )}
      >
        +
      </button>
    </div>
  );
}

/**
 * The prev / next buttons on an add-on row. Rendered only when the row has
 * somewhere to scroll, so a short row never shows two dead circles.
 */
export function ScrollArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 items-center justify-center rounded-full border border-black bg-white p-2 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {direction === "prev" ? <ArrowLeft /> : <ArrowRight />}
    </button>
  );
}

/**
 * Shared scroll plumbing for an add-on row: tracks whether there is anything
 * to the left or right and exposes a scroller. Kept with the arrow so a row
 * cannot end up with buttons that do not match what it can actually do.
 */
export function useRowScroll(resetKey?: string | number) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  function update() {
    const container = ref.current;
    if (!container) {
      return;
    }
    setCanScrollPrev(container.scrollLeft > 4);
    setCanScrollNext(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 4,
    );
  }

  // resetKey changes when the row's contents are swapped out - switching wine
  // tab, for instance - so the row goes back to the start and the arrows are
  // measured against the new contents rather than the old ones.
  useEffect(() => {
    const container = ref.current;
    if (container) {
      container.scrollLeft = 0;
    }
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [resetKey]);

  function scroll(direction: "prev" | "next") {
    const container = ref.current;
    if (!container) {
      return;
    }
    const amount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "prev" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return { ref, canScrollPrev, canScrollNext, update, scroll };
}
