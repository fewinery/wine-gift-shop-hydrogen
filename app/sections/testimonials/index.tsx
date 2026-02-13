import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface TestimonialsProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
}

function Testimonials(props: TestimonialsProps) {
  const { children, ref, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
      {children}
    </Section>
  );
}

export default Testimonials;

export const schema = createSchema({
  type: "testimonials",
  title: "Testimonials",
  childTypes: ["testimonials--header", "testimonials--items"],
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter((i) => i.name !== "borderRadius"),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    gap: 48,
    children: [
      {
        type: "testimonials--header",
        children: [
          {
            type: "heading",
            content: "From Our Visitors",
            as: "h2",
          },
          {
            type: "subheading",
            content:
              "Hear what some of our guests are saying about their visits!",
          },
        ],
      },
      {
        type: "testimonials--items",
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
    ],
  },
});
