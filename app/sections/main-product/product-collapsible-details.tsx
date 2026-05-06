import * as Accordion from "@radix-ui/react-accordion";
import { RichText } from "@shopify/hydrogen";
import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import clsx from "clsx";
import { Link, useLoaderData } from "react-router";
import type { loader as productLoader } from "~/routes/products/product";

function getExcerpt(text: string) {
  const regex = /<p.*>(.*?)<\/p>/;
  const match = regex.exec(text);
  return match?.length ? match[0] : text;
}

/**
 * Shopify rich-text metafields serialize to a Lexical-style JSON object
 * (`{type: "root", children: [...]}`). Older or differently-typed metafields
 * may still hold a plain string. Detect the JSON shape so RichText only
 * receives valid Lexical input.
 */
function isLexicalRichText(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as { type?: string } | null;
    return parsed?.type === "root";
  } catch {
    return false;
  }
}

function MetafieldContent({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  if (isLexicalRichText(value)) {
    return <RichText data={value} className={className} />;
  }
  return <div className={clsx(className, "whitespace-pre-line")}>{value}</div>;
}

interface CollapsibleDetailsProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  showDescription: boolean;
  showShippingPolicy: boolean;
  showRefundPolicy: boolean;
  showAccolades: boolean;
  showWineSpecs: boolean;
  showTastingNotes: boolean;
  showFoodPairings: boolean;
  showRecipe: boolean;
}

export default function CollapsibleDetails(props: CollapsibleDetailsProps) {
  const {
    ref,
    showDescription,
    showShippingPolicy,
    showRefundPolicy,
    showAccolades,
    showWineSpecs,
    showTastingNotes,
    showFoodPairings,
    showRecipe,
    ...rest
  } = props;
  const { shop, product } = useLoaderData<typeof productLoader>();
  const { descriptionHtml } = product;
  const { shippingPolicy, refundPolicy } = shop;

  const accolades = (product?.accolades?.references?.nodes || []).map(
    (node: any) => {
      const fields = node.fields.reduce((acc: any, field: any) => {
        acc[field.key] = field.reference || field.value;
        return acc;
      }, {});
      return { id: node.id, ...fields };
    },
  );

  const details = [
    showDescription &&
    descriptionHtml && { title: "Description", content: descriptionHtml },
    showShippingPolicy &&
    shippingPolicy?.body && {
      title: "Shipping",
      content: getExcerpt(shippingPolicy.body),
      learnMore: `/policies/${shippingPolicy.handle}`,
    },
    showRefundPolicy &&
    refundPolicy?.body && {
      title: "Returns",
      content: getExcerpt(refundPolicy.body),
      learnMore: `/policies/${refundPolicy.handle}`,
    },
    showAccolades &&
    accolades.length > 0 && {
      title: "Accolades",
      isAccolades: true,
      accolades,
    },
    showWineSpecs &&
    product?.wineSpecs?.value && {
      title: "Wine Specs",
      content: product.wineSpecs.value,
      isRichText: true,
    },
    showTastingNotes &&
    product?.tastingNotes?.value && {
      title: "Tasting Notes",
      content: product.tastingNotes.value,
      isRichText: true,
    },
    showFoodPairings &&
    product?.foodPairings?.value && {
      title: "Food Pairings",
      content: product.foodPairings.value,
      isRichText: true,
    },
    showRecipe &&
    product?.recipe?.value && {
      title: "Recipe",
      content: product.recipe.value,
      isRichText: true,
    },
  ].filter(Boolean);

  return (
    <div ref={ref} {...rest} className={clsx(rest.className, "border-t border-line")}>
      <Accordion.Root type="multiple">
        {details.map((detail) => (
          <Accordion.Item
            key={detail.title}
            value={detail.title}
            className="border-line border-b"
          >
            <Accordion.Trigger
              className={clsx([
                "flex w-full justify-between py-[15px] font-heading text-base font-medium uppercase tracking-widest text-[#2D2926]",
                "data-[state=open]:[&>.chevron]:rotate-180",
              ])}
            >
              <span>{detail.title}</span>
              <svg
                className="chevron size-4 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Accordion.Trigger>
            <Accordion.Content
              className={clsx([
                "overflow-hidden",
                "[--expand-to:var(--radix-accordion-content-height)] ",
                "[--collapse-from:var(--radix-accordion-content-height)]",
                "data-[state=closed]:animate-collapse",
                "data-[state=open]:animate-expand",
              ])}
            >
              {detail.isAccolades ? (
                <div className="space-y-6 py-4">
                  {detail.accolades?.map((accolade: any) => (
                    <div key={accolade.id} className="flex items-center gap-4">
                      {accolade.image?.image?.url && (
                        <img
                          src={accolade.image.image.url}
                          alt={accolade.image.image.altText || accolade.name}
                          width={80}
                          height={80}
                          className="size-20 shrink-0 object-contain"
                        />
                      )}
                      <div>
                        {accolade.name && (
                          <p className="text-base font-bold uppercase tracking-wider text-[#2D2926]">
                            {accolade.name}
                          </p>
                        )}
                        {accolade.description && (
                          <MetafieldContent
                            value={accolade.description}
                            className="text-sm text-neutral-800 mt-1 leading-relaxed"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {detail.isRichText ? (
                    <MetafieldContent
                      value={detail.content}
                      className="prose pb-4 text-neutral-900 prose-p:first:mt-0 prose-p:last:mb-0 [&>*:first-child]:mt-0! [&>*:last-child]:mb-0!"
                    />
                  ) : (
                    <div
                      suppressHydrationWarning
                      className="prose pb-4 text-neutral-900 prose-p:first:mt-0 prose-p:last:mb-0 [&>*:first-child]:mt-0! [&>*:last-child]:mb-0!"
                      dangerouslySetInnerHTML={{ __html: detail.content }}
                    />
                  )}
                  {detail.learnMore && (
                    <Link
                      className="border-line-subtle border-b pb-px text-body-subtle"
                      to={detail.learnMore}
                    >
                      Learn more
                    </Link>
                  )}
                </>
              )}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}

export const schema = createSchema({
  type: "mp--collapsible-details",
  title: "Collapsible details",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "General",
      inputs: [
        {
          type: "switch",
          label: "Show description",
          name: "showDescription",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show shipping policy",
          name: "showShippingPolicy",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show refund policy",
          name: "showRefundPolicy",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show accolades",
          name: "showAccolades",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show wine specs",
          name: "showWineSpecs",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show tasting notes",
          name: "showTastingNotes",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show food pairings",
          name: "showFoodPairings",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show recipe",
          name: "showRecipe",
          defaultValue: true,
        },
      ],
    },
  ],
});
