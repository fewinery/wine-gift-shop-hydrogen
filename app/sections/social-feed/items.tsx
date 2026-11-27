import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import { createContext } from "react";

export interface SocialFeedDisplay {
  cardHeight: number;
  showCreator: boolean;
  autoplay: boolean;
}

export const SocialFeedDisplayContext = createContext<SocialFeedDisplay>({
  cardHeight: 620,
  showCreator: true,
  autoplay: true,
});

interface SocialFeedItemsProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  feedLayout?: "grid" | "row";
  columns?: number;
  cardHeight?: number;
  showCreator?: boolean;
  autoplay?: boolean;
}

function SocialFeedItems(props: SocialFeedItemsProps) {
  const {
    ref,
    children,
    feedLayout = "grid",
    columns = 3,
    cardHeight = 620,
    showCreator,
    autoplay,
    ...rest
  } = props;

  const childrenArray = Array.isArray(children)
    ? children
    : children
      ? [children]
      : [];

  const isRow = feedLayout === "row";
  const cols = Math.min(Math.max(Number(columns) || 3, 1), 5);

  return (
    <SocialFeedDisplayContext.Provider
      value={{
        cardHeight: Number(cardHeight) || 620,
        showCreator: showCreator !== false,
        autoplay: autoplay !== false,
      }}
    >
      <div ref={ref} {...rest}>
        <div
          className={
            isRow
              ? "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
              : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(var(--social-cols),minmax(0,1fr))]"
          }
          style={{ "--social-cols": cols } as React.CSSProperties}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className={isRow ? "w-[326px] shrink-0 snap-start" : "min-w-0"}
            >
              {child as React.ReactNode}
            </div>
          ))}
        </div>
      </div>
    </SocialFeedDisplayContext.Provider>
  );
}

export default SocialFeedItems;

export const schema = createSchema({
  type: "social-feed--items",
  title: "Posts",
  childTypes: ["social-feed--item"],
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "toggle-group",
          name: "feedLayout",
          label: "Layout",
          configs: {
            options: [
              { value: "grid", label: "Grid" },
              { value: "row", label: "Scrolling row" },
            ],
          },
          defaultValue: "grid",
        },
        {
          type: "range",
          name: "columns",
          label: "Columns (desktop)",
          defaultValue: 3,
          configs: { min: 1, max: 5, step: 1 },
          condition: (data: SocialFeedItemsProps) => data.feedLayout !== "row",
        },
        {
          type: "range",
          name: "cardHeight",
          label: "Post height",
          defaultValue: 620,
          configs: { min: 400, max: 900, step: 10, unit: "px" },
          helpText:
            "Instagram and TikTok size their own players. Raise this if captions or buttons get cut off.",
        },
        {
          type: "switch",
          name: "showCreator",
          label: "Show account name under each post",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "autoplay",
          label: "Autoplay videos (muted)",
          defaultValue: true,
          helpText:
            "TikTok, YouTube Shorts and Facebook videos start playing on their own with the sound off. Instagram does not allow autoplay, so Instagram posts always wait for a click.",
        },
      ],
    },
  ],
});
