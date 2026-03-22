import {
  createSchema,
  type HydrogenComponentProps,
  type InspectorGroup,
  useThemeSettings,
} from "@weaverse/hydrogen";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import {
  Link as RemixLink,
  type LinkProps as RemixLinkProps,
  useRouteLoaderData,
} from "react-router";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";

export const variants = cva(["inline-flex justify-center transition-colors"], {
  variants: {
    variant: {
      primary: [
        "border px-4 py-3",
        "text-(--btn-primary-text)",
        "bg-(--btn-primary-bg)",
        "border-(--btn-primary-border)",
        "hover:text-(--btn-primary-text-hover)",
        "hover:bg-(--btn-primary-bg-hover)",
        "hover:border-(--btn-primary-border-hover)",
      ],
      secondary: [
        "border px-4 py-3",
        "text-(--btn-secondary-text)",
        "bg-(--btn-secondary-bg)",
        "border-(--btn-secondary-border)",
        "hover:bg-(--btn-secondary-bg-hover)",
        "hover:text-(--btn-secondary-text-hover)",
        "hover:border-(--btn-secondary-border-hover)",
      ],
      outline: [
        "border px-4 py-3",
        "text-(--btn-outline-text)",
        "bg-transparent",
        "border-(--btn-outline-text)",
        "hover:bg-(--btn-outline-text)",
        "hover:text-background",
        "hover:border-(--btn-outline-text)",
      ],
      custom: [
        "border px-4 py-3",
        "text-(--btn-text)",
        "bg-(--btn-bg)",
        "border-(--btn-border)",
        "hover:text-(--btn-text-hover)",
        "hover:bg-(--btn-bg-hover)",
        "hover:border-(--btn-border-hover)",
      ],
      underline: [
        "relative bg-transparent pb-1 text-body",
        "after:absolute after:bottom-0.5 after:left-0 after:h-px after:w-full after:bg-body",
        "after:origin-right after:scale-x-100 after:transition-transform",
        "hover:after:origin-left hover:after:animate-underline-toggle",
      ],
    },
  },
});

export interface LinkStyles {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  backgroundColorHover: string;
  textColorHover: string;
  borderColorHover: string;
  customWidth: number;
  borderRadius: number;
}

export interface LinkData
  extends RemixLinkProps,
  Partial<LinkStyles>,
  VariantProps<typeof variants> {
  text?: string;
}

export interface LinkProps
  extends HTMLAttributes<HTMLAnchorElement>,
  Partial<Omit<HydrogenComponentProps, "children">>,
  LinkData {
  ref?: React.Ref<HTMLAnchorElement>;
}

function checkExternal(to: LinkProps["to"]) {
  if (typeof to === "string") {
    // Check if it's a full URL with protocol
    return /^https?:\/\//.test(to) || /^mailto:/.test(to) || /^tel:/.test(to);
  }
  if (typeof to === "object" && to.pathname) {
    // For object syntax, only check if pathname looks like an external URL
    return /^https?:\/\//.test(to.pathname);
  }
  return false;
}

function useHrefWithLocale(href: LinkProps["to"]) {
  const rootData = useRouteLoaderData<RootLoader>("root");
  const selectedLocale = rootData?.selectedLocale;

  const isExternal = checkExternal(href);
  if (isExternal) {
    return href;
  }

  let toWithLocale = href;
  if (
    typeof toWithLocale === "string" &&
    selectedLocale?.pathPrefix &&
    !toWithLocale.toLowerCase().startsWith(selectedLocale.pathPrefix)
  ) {
    toWithLocale = `${selectedLocale.pathPrefix}${href}`;
  }

  return toWithLocale;
}

/**
 * In our app, we've chosen to wrap Remix's `Link` component to add
 * helper functionality. If the `to` value is a string (not object syntax),
 * we prefix the locale to the path if there is one.
 *
 * You could implement the same behavior throughout your app using the
 * Remix-native nested routes. However, your route and component structure
 * changes the level of nesting required to get the locale into the route,
 * which may not be ideal for shared components or layouts.
 *
 * Likewise, your internationalization strategy may not require a locale
 * in the pathname and instead rely on a domain, cookie, or header.
 *
 * Ultimately, it is up to you to decide how to implement this behavior.
 */
export function Link(props: LinkProps) {
  let {
    ref,
    to,
    text,
    variant,
    className,
    style,
    textColor,
    backgroundColor,
    borderColor,
    textColorHover,
    backgroundColorHover,
    borderColorHover,
    customWidth,
    borderRadius,
    children,
    target,
    ...rest
  } = props;
  const { enableViewTransition } = useThemeSettings();
  const href = useHrefWithLocale(to);

  if (variant === "custom") {
    style = {
      ...style,
      "--btn-text": textColor,
      "--btn-bg": backgroundColor,
      "--btn-border": borderColor,
      "--btn-bg-hover": backgroundColorHover,
      "--btn-text-hover": textColorHover,
      "--btn-border-hover": borderColorHover,
      width: customWidth ? `${customWidth}px` : undefined,
      borderRadius: borderRadius ? `${borderRadius}px` : undefined,
    } as React.CSSProperties;
  }

  if (!(children || text)) {
    return null;
  }

  const isExternal = checkExternal(href);

  return (
    <RemixLink
      ref={ref}
      viewTransition={enableViewTransition}
      to={href}
      style={style}
      className={cn(variants({ variant, className }))}
      target={target !== undefined ? target : isExternal ? "_blank" : undefined}
      {...rest}
    >
      {children || text}
    </RemixLink>
  );
}

export default Link;

export const linkContentInputs: InspectorGroup["inputs"] = [
  {
    type: "text",
    name: "text",
    label: "Text content",
    defaultValue: "Shop now",
    placeholder: "Shop now",
  },
  {
    type: "url",
    name: "to",
    label: "Link to",
    defaultValue: "/products",
    placeholder: "/products",
  },
  {
    type: "select",
    name: "variant",
    label: "Variant",
    configs: {
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline-solid" },
        { label: "Underline", value: "underline" },
        { label: "Custom styles", value: "custom" },
      ],
    },
    defaultValue: "primary",
  },
  {
    type: "range",
    label: "Button width",
    name: "customWidth",
    configs: {
      min: 100,
      max: 400,
      step: 10,
      unit: "px",
    },
    helpText: "Leave at 0 for auto width",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "range",
    label: "Border radius",
    name: "borderRadius",
    configs: {
      min: 0,
      max: 40,
      step: 2,
      unit: "px",
    },
    defaultValue: 0,
    condition: (data: LinkData) => data.variant === "custom",
  },
];
export const linkStylesInputs: InspectorGroup["inputs"] = [
  {
    type: "color",
    label: "Background color",
    name: "backgroundColor",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color",
    name: "textColor",
    defaultValue: "#fff",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color",
    name: "borderColor",
    defaultValue: "#00000000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Background color (hover)",
    name: "backgroundColorHover",
    defaultValue: "#00000000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Text color (hover)",
    name: "textColorHover",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
  {
    type: "color",
    label: "Border color (hover)",
    name: "borderColorHover",
    defaultValue: "#000",
    condition: (data: LinkData) => data.variant === "custom",
  },
];

export const linkInputs: InspectorGroup["inputs"] = [
  ...linkContentInputs,
  {
    type: "heading",
    label: "Button custom styles",
  },
  ...linkStylesInputs,
];

export const schema = createSchema({
  type: "button",
  title: "Button",
  settings: [
    {
      group: "Button",
      inputs: linkInputs,
    },
  ],
});
