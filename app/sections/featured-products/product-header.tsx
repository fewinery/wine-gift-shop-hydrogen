import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { Link } from "~/components/link";

interface HeaderContainerProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  gap?: number;
  heading?: string;
  headingColor?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonTextColor?: string;
  buttonBgColor?: string;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const {
    ref,
    gap,
    heading,
    headingColor,
    showButton,
    buttonText,
    buttonLink,
    buttonTextColor,
    buttonBgColor,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between font-henderson-slab"
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
      {showButton && buttonText && (
        <Link
          to={buttonLink}
          className="flex items-center justify-center px-6 py-2"
          style={{
            color: buttonTextColor,
            backgroundColor: buttonBgColor,
          }}
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
};

export default HeaderContainer;

export const schema = createSchema({
  type: "featured-products--header",
  title: "Products header",
  settings: [
    {
      group: "Heading",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Featured products",
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
      group: "Button",
      inputs: [
        {
          type: "switch",
          name: "showButton",
          label: "Show button",
          defaultValue: true,
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "VIEW ALL",
        },
        {
          type: "text",
          name: "buttonLink",
          label: "Button link",
          defaultValue: "/collections/all",
        },
        {
          type: "color",
          name: "buttonBgColor",
          label: "Background color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Text color",
          defaultValue: "#ffffff",
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
});
