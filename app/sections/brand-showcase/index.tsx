import * as Tabs from "@radix-ui/react-tabs";
import { createSchema } from "@weaverse/hydrogen";
import React, { createContext, useState } from "react";
import { backgroundInputs } from "~/components/background-image";
import { layoutInputs, Section, type SectionProps } from "~/components/section";

interface TabContextValue {
  registerTab: (id: string, label: string) => void;
  unregisterTab: (id: string) => void;
  tabs: Map<string, string>;
}

export const TabContext = createContext<TabContextValue | null>(null);

interface BrandShowcaseProps extends SectionProps {
  ref?: React.Ref<HTMLElement>;
  heading?: string;
}

function BrandShowcase(props: BrandShowcaseProps) {
  const { ref, children, heading, ...rest } = props;
  const [tabs, setTabs] = useState<Map<string, string>>(new Map());

  const childrenArray = React.Children.toArray(children);

  const registerTab = (id: string, label: string) => {
    setTabs((prev) => {
      // Skip update if label hasn't changed
      if (prev.get(id) === label) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(id, label);
      return newMap;
    });
  };

  const unregisterTab = (id: string) => {
    setTabs((prev) => {
      // Skip update if id doesn't exist
      if (!prev.has(id)) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  // Generate tab data from children indices
  const tabData = childrenArray.map((child, index) => ({
    value: `tab-${index}`,
    label: tabs.get(`tab-${index}`) || `Tab ${index + 1}`,
    child: child,
  }));

  const defaultTab = tabData.length > 0 ? tabData[0].value : "tab-0";

  // If no tabs yet, just render children directly
  if (tabData.length === 0) {
    return (
      <Section ref={ref} {...rest}>
        {heading && (
          <p className="mb-10 text-center font-heading uppercase">
            {heading}
          </p>
        )}
        {children}
      </Section>
    );
  }

  return (
    <TabContext.Provider value={{ registerTab, unregisterTab, tabs }}>
      <Section ref={ref} {...rest}>
        {/* Heading */}
        {heading && (
          <p className="mb-10 text-center font-heading uppercase">
            {heading}
          </p>
        )}

        <Tabs.Root defaultValue={defaultTab} className="w-full">
          {/* Tab List */}
          <Tabs.List className="mb-10 flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:justify-center lg:overflow-visible">
            {tabData.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="shrink-0 px-4 py-2 whitespace-nowrap data-[state=active]:bg-[#E8E4DB] font-heading"
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Tab Contents - forceMount keeps all tabs mounted so they can register labels */}
          {tabData.map((tab, index) => (
            <Tabs.Content
              key={tab.value}
              value={tab.value}
              forceMount
              className="data-[state=inactive]:hidden"
            >
              <TabIndexContext.Provider value={index}>
                {tab.child}
              </TabIndexContext.Provider>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </Section>
    </TabContext.Provider>
  );
}

// Context to pass tab index to children
export const TabIndexContext = createContext<number>(0);

export default BrandShowcase;

export const schema = createSchema({
  type: "brand-showcase",
  title: "Brand Showcase",
  childTypes: ["brand-showcase--tab"],
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "heading",
          label: "Heading",
          defaultValue:
            "Our wine brands celebrate the love of wine, its history, and community connection.",
        },
      ],
    },
    {
      group: "Layout",
      inputs: layoutInputs.filter(
        (i) => i.name !== "gap" && i.name !== "borderRadius",
      ),
    },
    {
      group: "Background",
      inputs: backgroundInputs,
    },
  ],
  presets: {
    heading:
      "Our wine brands celebrate the love of wine, its history, and community connection.",
    children: [
      {
        type: "brand-showcase--tab",
        label: "Sports",
        children: [
          { type: "brand-showcase--item", brandName: "Baltimore Ravens" },
          { type: "brand-showcase--item", brandName: "Carolina Panthers" },
          { type: "brand-showcase--item", brandName: "Cincinnati Bengals" },
          { type: "brand-showcase--item", brandName: "Cleveland Browns" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "Celebrity",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
          { type: "brand-showcase--item", brandName: "Brand 3" },
          { type: "brand-showcase--item", brandName: "Brand 4" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "Fraternity",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "Sorority",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "University",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "Corp & Non-profit",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
        ],
      },
      {
        type: "brand-showcase--tab",
        label: "Winery",
        children: [
          { type: "brand-showcase--item", brandName: "Brand 1" },
          { type: "brand-showcase--item", brandName: "Brand 2" },
        ],
      },
    ],
  },
});
