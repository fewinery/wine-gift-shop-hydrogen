import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ButtonsWrapperProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ButtonsWrapper(props: ButtonsWrapperProps) {
  const { children, ref, ...rest } = props;
  return (
    <div ref={ref} {...rest} className="flex flex-row gap-4">
      {children}
    </div>
  );
}

export default ButtonsWrapper;

export const schema = createSchema({
  type: "image-with-text--buttons-wrapper",
  title: "Buttons wrapper",
  limit: 1,
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
