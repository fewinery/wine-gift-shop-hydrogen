import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { StarIcon } from "~/components/icons";

interface TestimonialItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  rating: number;
  quote: string;
  authorName: string;
  location: string;
}

const TestimonialItem = (props: TestimonialItemProps) => {
  const { ref, rating = 5, quote, authorName, location, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex h-full flex-col rounded-lg bg-white p-6 shadow-md"
    >
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= rating} />
        ))}
      </div>

      {/* Quote */}
      <p className="mb-6 flex-1 text-[18px]">
        "{quote}"
      </p>

      {/* Author */}
      <div>
        <p className="text-[18px]">-{authorName}</p>
        <p>{location}</p>
      </div>
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
          defaultValue: "An unmissable spot in Napa Valley. Gorgeous property, amazing wine caves for tastings, and truly exceptional service.",
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
