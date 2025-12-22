import {
  createSchema,
  IMAGES_PLACEHOLDERS,
  type HydrogenComponentProps,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";

interface BrandStoryImageProps extends HydrogenComponentProps {
  image: WeaverseImage | string;
  ref?: React.Ref<HTMLDivElement>;
}

function BrandStoryImage(props: BrandStoryImageProps) {
  const { image = IMAGES_PLACEHOLDERS.image, ref, ...rest } = props;

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: "Image" } : image;

  return (
    <div ref={ref} {...rest} className="relative w-1/2 h-[500px]">
      <Image
        data={imageData}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="absolute left-0 top-0 h-full w-full object-cover object-left rounded-[10px]"
      />
    </div>
  );
}

export default BrandStoryImage;

export const schema = createSchema({
  type: "brand-story--image",
  title: "Image",
  limit: 1,
  settings: [
    {
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
  },
});
