import { ArrowRightIcon } from "@phosphor-icons/react";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { Link } from "~/components/link";

interface ViewAllButtonProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  buttonText?: string;
  buttonLink?: string;
  buttonTextColor?: string;
  buttonBgColor?: string;
  mobilePosition?: "left" | "center" | "right";
  mobileTextColor?: string;
}

function ViewAllButton(props: ViewAllButtonProps) {
  const {
    ref,
    buttonText,
    buttonLink,
    buttonTextColor,
    buttonBgColor,
    mobilePosition = "left",
    mobileTextColor,
    ...rest
  } = props;

  const mobilePositionClass = {
    left: "self-start",
    center: "self-center",
    right: "self-end",
  }[mobilePosition];

  if (!buttonText) {
    return null;
  }

  return (
    <div ref={ref} {...rest} className="flex flex-col w-full lg:w-auto">
      <Link
        to={buttonLink}
        className={`flex items-center justify-center gap-1 underline underline-offset-4 font-body ${mobilePositionClass} lg:hidden`}
        style={{ color: mobileTextColor }}
      >
        {buttonText}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
      <Link
        to={buttonLink}
        className="hidden lg:flex items-center justify-center px-6 py-2 font-body"
        style={{
          color: buttonTextColor,
          backgroundColor: buttonBgColor,
        }}
      >
        {buttonText}
      </Link>
    </div>
  );
}

export default ViewAllButton;

export const schema = createSchema({
  type: "view-all-button",
  title: "View All Button",
  settings: [
    {
      group: "Button",
      inputs: [
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
          type: "toggle-group",
          name: "mobilePosition",
          label: "Mobile position",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
        },
        {
          type: "color",
          name: "mobileTextColor",
          label: "Mobile text color",
          defaultValue: "#000000",
        },
      ],
    },
    {
      group: "Desktop Style",
      inputs: [
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
  ],
});
