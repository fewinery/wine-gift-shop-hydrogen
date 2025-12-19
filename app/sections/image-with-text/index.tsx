import { createSchema } from "@weaverse/hydrogen";
import { backgroundInputs } from "~/components/background-image";
import type { SectionProps } from "~/components/section";
import { layoutInputs, Section } from "~/components/section";
import { useAnimation } from "~/hooks/use-animation";
import { cn } from "~/utils/cn";

interface ImageWithTextProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  enableImageHover?: boolean;
  reverseLayout?: boolean;
}

function ImageWithText(props: ImageWithTextProps) {
  const { children, ref, enableImageHover, reverseLayout, ...rest } = props;
  const [scope] = useAnimation(ref);

  return (
    <Section
      ref={scope}
      {...rest}
      containerClassName={cn(
        "flex flex-col gap-20",
        reverseLayout ? "md:flex-row-reverse" : "md:flex-row"
      )}
    >
      {children}
    </Section>
  );
}

export default ImageWithText;

export const schema = createSchema({
  type: "image-with-text",
  title: "Image with text",
  settings: [
    {
      group: "Layout",
      inputs: layoutInputs.filter(({ name }) => name !== "gap"),
    },
    { group: "Background", inputs: backgroundInputs },
    {
      group: "Image",
      inputs: [
        {
          type: "switch",
          name: "reverseLayout",
          label: "Reverse layout (Image on right)",
          defaultValue: false,
        },
      ],
    },
  ],
  childTypes: ["image-with-text--content", "image-with-text--image"],
  presets: {
    verticalPadding: "none",
    backgroundColor: "#dbe3d6",
    backgroundFor: "content",
    children: [
      { type: "image-with-text--image", aspectRatio: "1/1" },
      { type: "image-with-text--content" },
    ],
  },
});
