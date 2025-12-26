import type { HydrogenComponentProps, WeaverseImage } from "@weaverse/hydrogen";
import { createSchema, IMAGES_PLACEHOLDERS } from "@weaverse/hydrogen";
import { Image } from "~/components/image";

interface QuoteCarouselItemProps extends HydrogenComponentProps {
  image: WeaverseImage | string;
  quote: string;
  authorName: string;
  authorDescription: string;
  ref?: React.Ref<HTMLDivElement>;
}

function QuoteCarouselItem(props: QuoteCarouselItemProps) {
  const {
    image = IMAGES_PLACEHOLDERS.image,
    quote,
    authorName,
    authorDescription,
    ref,
    ...rest
  } = props;

  const imageData: Partial<WeaverseImage> =
    typeof image === "string"
      ? { url: image, altText: authorName || "Quote author" }
      : image;

  return (
    <div
      ref={ref}
      {...rest}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start md:items-center"
    >
      {/* Image */}
      <div className="flex justify-start">
        <Image
          data={imageData}
          sizes="auto"
          aspectRatio="1/1"
          className="w-full h-auto object-cover rounded"
        />
      </div>

      {/* Quote Content */}
      <div className="flex flex-col gap-4 md:gap-6">
        {quote && (
          <blockquote
            className="text-[18px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: quote }}
          />
        )}

        {/* Author Info */}
        <div className="text-sm">
          {authorName && <div>– {authorName}</div>}
          {authorDescription && (
            <div dangerouslySetInnerHTML={{ __html: authorDescription }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default QuoteCarouselItem;

export const schema = createSchema({
  type: "quote-carousel-item",
  title: "Quote Item",
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
          type: "richtext",
          name: "quote",
          label: "Quote",
          defaultValue: "<p>Quote text goes here.</p>",
        },
        {
          type: "text",
          name: "authorName",
          label: "Author Name",
          defaultValue: "Author Name",
        },
        {
          type: "richtext",
          name: "authorDescription",
          label: "Author Description",
          defaultValue: "<p>Description</p>",
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
  },
});
