import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import { Image } from "~/components/image";

interface StepsGuideItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  image: WeaverseImage | string;
  stepGuideItem: string;
  title: string;
  description: string;
}

function StepsGuideItem(props: StepsGuideItemProps) {
  const {
    image = IMAGES_PLACEHOLDERS.image,
    stepGuideItem,
    title,
    description,
    ref,
    ...rest
  } = props;

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: title } : image;

  return (
    <div ref={ref} {...rest} className="flex flex-col items-center text-center">
      <div className="mb-4 w-full flex justify-center">
        <Image
          data={imageData}
          sizes="auto"
          className="h-auto w-full max-w-[200px] object-contain"
        />
      </div>
      {stepGuideItem && (
        <p className="mb-4 text-2xl italic text-body-subtle">{stepGuideItem}</p>
      )}
      {title && <h3 className="mb-4 text-[26px]">{title}</h3>}
      {description && (
        <p className="max-w-[280px] text-[16px]">{description}</p>
      )}
    </div>
  );
}

export default StepsGuideItem;

export const schema = createSchema({
  type: "steps-guide--item",
  title: "Guide Item",
  limit: 1,
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "image",
          name: "image",
          label: "Icon/Image",
        },
        {
          type: "text",
          name: "stepGuideItem",
          label: "Step guide item",
          defaultValue: "Step 1",
          placeholder: "e.g. Step 1",
        },
        {
          type: "text",
          name: "title",
          label: "Title",
          defaultValue: "Choose Your Frequency",
        },
        {
          type: "textarea",
          name: "description",
          label: "Description",
          defaultValue:
            "Choose between monthly, bi-monthly, quarterly, or bi-annually",
        },
      ],
    },
  ],
  presets: {
    image: IMAGES_PLACEHOLDERS.image,
    stepGuideItem: "Step 1",
    title: "Choose Your Frequency",
    description:
      "Choose between monthly, bi-monthly, quarterly, or bi-annually",
  },
});
