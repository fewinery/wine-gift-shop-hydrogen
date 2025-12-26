import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import Link from "~/components/link";

interface BrandShowcaseItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  image: WeaverseImage | string;
  brandName?: string;
  link?: string;
}

function BrandShowcaseItem(props: BrandShowcaseItemProps) {
  const {
    ref,
    image = IMAGES_PLACEHOLDERS.image,
    brandName,
    link = "#",
    ...rest
  } = props;

  const imageData =
    typeof image === "string"
      ? { url: image, altText: brandName || "Brand logo" }
      : image;

  const content = (
    <>
      {/* Image */}
      <div className="mb-4 flex aspect-4/3 items-center justify-center">
        <Image
          data={imageData}
          width={400}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>

      {/* Brand Name */}
      {brandName && <p className="mt-5">{brandName}</p>}
    </>
  );

  return (
    <div
      ref={ref}
      {...rest}
      className="w-[calc(50%-16px)] md:w-[calc(25%-24px)] text-center"
    >
      {link && link !== "#" ? <Link to={link}>{content}</Link> : content}
    </div>
  );
}

export default BrandShowcaseItem;

export const schema = createSchema({
  type: "brand-showcase--item",
  title: "Brand Item",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Brand Logo",
        },
        {
          type: "text",
          name: "brandName",
          label: "Brand Name",
          defaultValue: "Brand Name",
        },
        {
          type: "text",
          name: "link",
          label: "Link",
          defaultValue: "#",
          placeholder: "https://example.com or /page-path",
        },
      ],
    },
  ],
});
