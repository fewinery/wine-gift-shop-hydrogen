import { createSchema } from "@weaverse/hydrogen";
import { createContext } from "react";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

export interface TestimonialsTextStyle {
  authorNameSize?: number;
  locationSize?: number;
}

export const TestimonialsTextStyleContext =
  createContext<TestimonialsTextStyle>({});

interface TestimonialsProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  customAuthorTextSize?: boolean;
  authorNameSize?: number;
  locationSize?: number;
}

function Testimonials(props: TestimonialsProps) {
  const {
    children,
    ref,
    customAuthorTextSize,
    authorNameSize,
    locationSize,
    ...rest
  } = props;
  const textStyle: TestimonialsTextStyle = customAuthorTextSize
    ? { authorNameSize, locationSize }
    : {};

  return (
    <TestimonialsTextStyleContext.Provider value={textStyle}>
      <Section ref={ref} {...rest}>
        {children}
      </Section>
    </TestimonialsTextStyleContext.Provider>
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
    {
      group: "Author & location text",
      inputs: [
        {
          type: "switch",
          name: "customAuthorTextSize",
          label: "Custom author & location size",
          defaultValue: false,
        },
        {
          type: "range",
          name: "authorNameSize",
          label: "Author name size",
          defaultValue: 18,
          configs: {
            min: 12,
            max: 40,
            step: 1,
            unit: "px",
          },
          condition: (data: TestimonialsProps) =>
            Boolean(data.customAuthorTextSize),
        },
        {
          type: "range",
          name: "locationSize",
          label: "Location size",
          defaultValue: 16,
          configs: {
            min: 12,
            max: 40,
            step: 1,
            unit: "px",
          },
          condition: (data: TestimonialsProps) =>
            Boolean(data.customAuthorTextSize),
        },
      ],
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
