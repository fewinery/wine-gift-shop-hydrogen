import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";

interface ImageWithTextHeaderProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
}

function ImageWithTextHeader(props: ImageWithTextHeaderProps) {
  const { ref, children, ...rest } = props;

  return (
    <div ref={ref} {...rest} className="text-center">
      {children}
    </div>
  );
}

export default ImageWithTextHeader;

export const schema = createSchema({
  type: "image-with-text--header",
  title: "Header",
  childTypes: ["heading", "subheading", "paragraph"],
});
