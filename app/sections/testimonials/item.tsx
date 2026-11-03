import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { useContext } from "react";
import { StarIcon } from "~/components/icons";
import { TestimonialsDisplayContext } from "./items";

interface TestimonialItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  rating: number;
  quote: string;
  authorName: string;
  location: string;
}

const TestimonialItem = (props: TestimonialItemProps) => {
  const { ref, rating = 5, quote, authorName, location, ...rest } = props;
  const { showRating, showQuotes, showAuthorDash, authorPosition } = useContext(
    TestimonialsDisplayContext,
  );
  const name = authorName?.trim();
  const place = location?.trim();
  const hasAuthor = Boolean(name || place);
  const authorOnTop = authorPosition === "top";

  const author = hasAuthor ? (
    <div className={authorOnTop ? "mb-4" : ""}>
      {name && (
        <p className="text-[18px]">{showAuthorDash ? `-${name}` : name}</p>
      )}
      {place && <p>{place}</p>}
    </div>
  ) : null;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex h-full flex-col rounded-lg bg-white p-6 shadow-md"
    >
      {/* Stars */}
      {showRating && (
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= rating} />
          ))}
        </div>
      )}

      {/* Author (top) */}
      {authorOnTop && author}

      {/* Quote */}
      <p
        className={`flex-1 text-[18px] ${hasAuthor && !authorOnTop ? "mb-6" : ""}`}
      >
        {showQuotes ? `"${quote}"` : quote}
      </p>

      {/* Author (bottom) */}
      {!authorOnTop && author}
    </div>
  );
};

export default TestimonialItem;

export const schema = createSchema({
  type: "testimonial--item",
  title: "Testimonial Card",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "range",
          name: "rating",
          label: "Rating",
          defaultValue: 5,
          configs: {
            min: 1,
            max: 5,
            step: 1,
          },
        },
        {
          type: "textarea",
          name: "quote",
          label: "Quote",
          defaultValue:
            "An unmissable spot in Napa Valley. Gorgeous property, amazing wine caves for tastings, and truly exceptional service.",
        },
        {
          type: "text",
          name: "authorName",
          label: "Author Name",
          defaultValue: "Annie R.",
        },
        {
          type: "text",
          name: "location",
          label: "Location",
          defaultValue: "Chicago, IL",
        },
      ],
    },
  ],
});
