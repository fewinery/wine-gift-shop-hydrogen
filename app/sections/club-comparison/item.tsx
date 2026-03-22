import {
  createSchema,
  type HydrogenComponentProps,
  IMAGES_PLACEHOLDERS,
  type WeaverseImage,
} from "@weaverse/hydrogen";
import type { CSSProperties } from "react";
import { CheckIcon } from "~/components/icons";
import { Image } from "~/components/image";
import { Link, linkInputs } from "~/components/link";
import { cn } from "~/utils/cn";

interface ClubComparisonItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  image: WeaverseImage | string;
  imageAspectRatio: "auto" | "square" | "landscape" | "portrait";
  imageObjectFit: "cover" | "contain";
  frequency: string;
  frequencySize: number;
  frequencySizeMobile: number;
  clubName: string;
  clubNameSize: number;
  clubNameSizeMobile: number;
  benefits: string;
  hideDivider: boolean;
  hideCheckIcon: boolean;
  buttonText?: string;
  buttonLink?: string;
  text?: string;
  to?: string;
  variant?: "primary" | "secondary" | "outline" | "custom";
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColorHover?: string;
  textColorHover?: string;
  borderColorHover?: string;
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
    imageAspectRatio = "square",
    imageObjectFit = "contain",
    frequency,
    frequencySize,
    frequencySizeMobile,
    clubName,
    clubNameSize,
    clubNameSizeMobile,
    benefits,
    hideDivider = false,
    hideCheckIcon = false,
    buttonText,
    buttonLink,
    text,
    to,
    variant = "primary",
    backgroundColor,
    textColor,
    borderColor,
    backgroundColorHover,
    textColorHover,
    borderColorHover,
    ...rest
  } = props;
  const benefitItems = parseBenefits(benefits);

  const imageData: Partial<WeaverseImage> =
    typeof image === "string" ? { url: image, altText: clubName } : image;

  const style = {
    "--freq-size-mobile": `${frequencySizeMobile}px`,
    "--freq-size-desktop": `${frequencySize}px`,
    "--name-size-mobile": `${clubNameSizeMobile}px`,
    "--name-size-desktop": `${clubNameSize}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      {...rest}
      style={style}
      className="flex w-full flex-col border border-black p-8 md:w-[calc((100%-(24px*(var(--columns-tablet)-1)))/var(--columns-tablet))] lg:w-[calc((100%-(24px*(var(--columns)-1)))/var(--columns))]"
    >
      {/* Image */}
      <div
        className={cn("mb-6 w-full overflow-hidden relative", {
          "aspect-square": imageAspectRatio === "square",
          "aspect-3/2": imageAspectRatio === "landscape",
          "aspect-3/4": imageAspectRatio === "portrait",
          "aspect-auto": imageAspectRatio === "auto",
        })}
      >
        <Image
          data={imageData}
          sizes="(max-width: 768px) 100vw, 33vw"
          className={cn("h-full w-full", {
            "[&>img]:object-contain": imageObjectFit === "contain",
            "[&>img]:object-cover": imageObjectFit === "cover",
          })}
        />
      </div>

      {/* Frequency + Club Name */}
      <div className="mb-6 space-y-1">
        <p className="font-heading uppercase text-(length:--freq-size-mobile) md:text-(length:--freq-size-desktop)">
          {frequency}
        </p>
        <h3 className="uppercase leading-tight text-(length:--name-size-mobile) md:text-(length:--name-size-desktop)">
          {clubName}
        </h3>
      </div>

      {/* Divider */}
      {!hideDivider && <div className="mb-6 w-full border-b border-black" />}

      {/* Benefits List */}
      <ul className="mb-8 flex-1 space-y-3">
        {benefitItems.map((item, index) => (
          <li key={index} className="flex gap-2.5">
            {!hideCheckIcon && (
              <CheckIcon className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {(text || buttonText) && (
        <div className="w-full mt-auto">
          <Link
            to={to || buttonLink || "#"}
            text={text || buttonText}
            variant={variant}
            backgroundColor={backgroundColor}
            textColor={textColor}
            borderColor={borderColor}
            backgroundColorHover={backgroundColorHover}
            textColorHover={textColorHover}
            borderColorHover={borderColorHover}
            className="w-full text-center text-sm font-bold uppercase"
          />
        </div>
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
        {
          type: "select",
          name: "imageAspectRatio",
          label: "Aspect ratio",
          defaultValue: "square",
          configs: {
            options: [
              { value: "auto", label: "Auto (Original)" },
              { value: "square", label: "Square (1:1)" },
              { value: "landscape", label: "Landscape (3:2)" },
              { value: "portrait", label: "Portrait (3:4)" },
            ],
          },
        },
        {
          type: "select",
          name: "imageObjectFit",
          label: "Image fit",
          defaultValue: "contain",
          configs: {
            options: [
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ],
          },
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
          type: "range",
          name: "frequencySize",
          label: "Frequency size (Desktop)",
          defaultValue: 20,
          configs: {
            min: 12,
            max: 60,
            step: 1,
          },
        },
        {
          type: "range",
          name: "frequencySizeMobile",
          label: "Frequency size (Mobile)",
          defaultValue: 16,
          configs: {
            min: 12,
            max: 40,
            step: 1,
          },
        },
        {
          type: "text",
          name: "clubName",
          label: "Club name",
          defaultValue: "WINE LOVER",
        },
        {
          type: "range",
          name: "clubNameSize",
          label: "Club name size (Desktop)",
          defaultValue: 30,
          configs: {
            min: 16,
            max: 60,
            step: 1,
          },
        },
        {
          type: "range",
          name: "clubNameSizeMobile",
          label: "Club name size (Mobile)",
          defaultValue: 24,
          configs: {
            min: 16,
            max: 60,
            step: 1,
          },
        },
        {
          type: "richtext",
          name: "benefits",
          label: "Benefits List",
          defaultValue:
            "<ul><li>Ships 12 times a year</li><li>Choose from 2, 3, or 4 bottles per shipment</li><li>10% off first club shipment</li></ul>",
          helpText: "Use a bullet list for benefits.",
        },
        {
          type: "switch",
          name: "hideDivider",
          label: "Hide divider",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "hideCheckIcon",
          label: "Hide check icon",
          defaultValue: false,
        },
      ],
    },
    {
      group: "Button",
      inputs: linkInputs,
    },
  ],
});
