import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { CheckIcon } from "~/components/icons";
import { Image } from "~/components/image";

interface ClubComparisonItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  image: WeaverseImage | string;
  frequency: string;
  clubName: string;
  benefits: string;
  buttonText: string;
  buttonLink: string;
}

// Parse benefits HTML to extract text items
function parseBenefits(html: string): string[] {
  const matches = html.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
  return matches.map((item) => item.replace(/<\/?li[^>]*>/gi, "").trim());
}

const ClubComparisonItem = (props: ClubComparisonItemProps) => {
  const {
    ref,
    image = IMAGES_PLACEHOLDERS.image,
    frequency,
    clubName,
    benefits,
    buttonText,
    buttonLink,
    ...rest
  } = props;
  const benefitItems = parseBenefits(benefits);

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: clubName } : image;

  return (
    <div
      ref={ref}
      {...rest}
      className="flex h-full flex-col border border-black p-8"
    >
      {/* Image */}
      <div className="mb-6 aspect-square overflow-hidden">
        <Image
          data={imageData}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Frequency + Club Name */}
      <div className="mb-6 space-y-1">
        <p className="font-henderson-slab text-[20px] uppercase">{frequency}</p>
        <h3 className="text-[30px] uppercase">{clubName}</h3>
      </div>

      {/* Divider */}
      <div className="mb-6 w-full border-b border-black" />

      {/* Benefits List */}
      <ul className="mb-8 flex-1 space-y-3">
        {benefitItems.map((item, index) => (
          <li key={index} className="flex gap-2.5">
            <CheckIcon className="w-5 h-5 mt-0.5 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {buttonText && (
        <a
          href={buttonLink || "#"}
          className="block w-full bg-black py-4 text-center text-sm font-bold uppercase text-white"
        >
          {buttonText}
        </a>
      )}
    </div>
  );
};

export default ClubComparisonItem;

export const schema = createSchema({
  type: "club-comparison--item",
  title: "Club Card",
  settings: [
    {
      group: "Image",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Club Image",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "frequency",
          label: "Frequency",
          defaultValue: "MONTHLY",
        },
        {
          type: "text",
          name: "clubName",
          label: "Club Name",
          defaultValue: "WINE LOVER",
        },
        {
          type: "richtext",
          name: "benefits",
          label: "Benefits List",
          defaultValue:
            "<ul><li>Ships 12 times a year</li><li>Choose from 2, 3, or 4 bottles per shipment</li><li>10% off first club shipment</li></ul>",
          helpText: "Use a bullet list for benefits.",
        },
      ],
    },
    {
      group: "Button",
      inputs: [
        {
          type: "text",
          name: "buttonText",
          label: "Button Text",
          defaultValue: "GET STARTED",
        },
        {
          type: "text",
          name: "buttonLink",
          label: "Button Link",
          defaultValue: "#",
        },
      ],
    },
  ],
});
