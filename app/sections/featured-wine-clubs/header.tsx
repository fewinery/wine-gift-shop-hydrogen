import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type React from "react";

interface WineClubsHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
  heading?: string;
  headingColor?: string;
}

function WineClubsHeader(props: WineClubsHeaderProps) {
  const { ref, gap, heading, headingColor, children, ...rest } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between font-henderson-slab"
      style={{ gap: `${gap}px` }}
    >
      {heading && (
        <h2
          className="font-medium uppercase text-[32px]"
          style={{ color: headingColor }}
        >
          {heading}
        </h2>
      )}
      {children}
    </div>
  );
}

export default WineClubsHeader;

export const schema = createSchema({
  type: "featured-wine-clubs--header",
  title: "Wine clubs header",
  childTypes: ["view-all-button"],
  settings: [
    {
      group: "Heading",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Wine Clubs",
        },
        {
          type: "color",
          name: "headingColor",
          label: "Heading color",
          defaultValue: "#000000",
        },
      ],
    },
    {
      group: "Layout",
      inputs: [
        {
          type: "range",
          name: "gap",
          label: "Item spacing (mobile)",
          defaultValue: 16,
          configs: {
            min: 0,
            max: 60,
            step: 4,
            unit: "px",
          },
        },
      ],
    },
  ],
  presets: {
    children: [
      {
        type: "view-all-button",
        buttonLink: "/wine-clubs",
      },
    ],
  },
});
