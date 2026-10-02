import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "~/utils/cn";

// The defaults below reproduce the previous hardcoded class list exactly
// ("justify-center md:justify-start"), so every existing section renders
// unchanged until someone picks a different value in Studio.
const variants = cva("flex flex-row gap-4", {
  variants: {
    alignment: {
      left: "md:justify-start",
      center: "md:justify-center",
      right: "md:justify-end",
    },
    mobileAlignment: {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    },
  },
  defaultVariants: {
    alignment: "left",
    mobileAlignment: "center",
  },
});

interface ButtonsWrapperProps
  extends VariantProps<typeof variants>,
    HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ButtonsWrapper(props: ButtonsWrapperProps) {
  const { alignment, mobileAlignment, children, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      {...rest}
      className={cn(variants({ alignment, mobileAlignment }))}
    >
      {children}
    </div>
  );
}

export default ButtonsWrapper;

export const schema = createSchema({
  type: "image-with-text--buttons-wrapper",
  title: "Buttons wrapper",
  limit: 1,
  settings: [
    {
      group: "Buttons",
      inputs: [
        {
          type: "toggle-group",
          name: "alignment",
          label: "Button alignment (desktop)",
          defaultValue: "left",
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
        },
        {
          type: "toggle-group",
          name: "mobileAlignment",
          label: "Button alignment (mobile)",
          defaultValue: "center",
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
        },
      ],
    },
  ],
  childTypes: ["button"],
  presets: {
    children: [
      {
        type: "button",
        text: "Shop now",
      },
      {
        type: "button",
        text: "Sign Up",
      },
    ],
  },
});
