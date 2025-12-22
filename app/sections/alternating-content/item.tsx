import type { HydrogenComponentProps, WeaverseImage } from "@weaverse/hydrogen";
import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { Image } from "~/components/image";
import type { ImageAspectRatio } from "~/types/others";

interface AlternatingContentItemProps extends HydrogenComponentProps {
  image: WeaverseImage | string;
  imageAspectRatio: ImageAspectRatio;
  heading: string;
  description: string;
  imagePosition: "left" | "right";
  ref?: React.Ref<HTMLDivElement>;
}

function AlternatingContentItem(props: AlternatingContentItemProps) {
  const {
    image = IMAGES_PLACEHOLDERS.image,
    imageAspectRatio,
    heading,
    description,
    imagePosition,
    ref,
    ...rest
  } = props;

  const isImageLeft = imagePosition === "left";

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: heading || "Image" } : image;

  let aspRt: string | undefined;
  if (imageAspectRatio === "adapt") {
    if (imageData.width && imageData.height) {
      aspRt = `${imageData.width}/${imageData.height}`;
    }
  } else {
    aspRt = imageAspectRatio;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
    >
      {/* Image */}
      <div className={isImageLeft ? "md:order-1" : "md:order-2"}>
        <Image
          data={imageData}
          sizes="auto"
          aspectRatio={aspRt}
          className="w-full h-auto object-cover rounded"
        />
      </div>

      {/* Content */}
      <div className={isImageLeft ? "md:order-2" : "md:order-1"}>
        {heading && (
          <h3 className="text-[18px] font-bold uppercase mb-4 font-henderson-slab tracking-[2.32px]">
            {heading}
          </h3>
        )}
        {description && (
          <div
            className="text-[18px]"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>
    </div>
  );
}

export default AlternatingContentItem;

export const schema = createSchema({
  type: "alternating-content-item",
  title: "Content Block",
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Image",
        },
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Image aspect ratio",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          defaultValue: "4/3",
        },
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue: "Heading",
        },
        {
          type: "richtext",
          name: "description",
          label: "Description",
          defaultValue: "<p>Description</p>",
        },
        {
          type: "select",
          name: "imagePosition",
          label: "Image Position",
          configs: {
            options: [
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ],
          },
          defaultValue: "left",
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
    imageAspectRatio: "4/3",
  },
});
