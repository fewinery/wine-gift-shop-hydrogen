import {
  createSchema,
  type HydrogenComponentProps,
  useWeaverse,
} from "@weaverse/hydrogen";
import { useLocation, useRouteLoaderData } from "react-router";
import Link from "~/components/link";
import type { RootLoader } from "~/root";

type TextAlign = "left" | "center" | "right";

interface ProductB2BLocationProps extends HydrogenComponentProps {
  ref: React.Ref<HTMLDivElement>;
  prefix?: string;
  showCompany?: boolean;
  showChangeLink?: boolean;
  textSize?: number;
  textAlign?: TextAlign;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  padding?: number;
  borderRadius?: number;
}

/**
 * B2B storefronts only: "You are ordering for <location>" inside the main
 * product. It reads the same value as the "Ordering for" announcement bar,
 * which is only set when B2B_ENABLED is on and a buyer has an active company
 * location. Everyone else (visitors, regular customers, the other
 * storefronts) gets nothing rendered.
 */
export default function ProductB2BLocation(props: ProductB2BLocationProps) {
  const {
    ref,
    prefix = "You are ordering for",
    showCompany = false,
    showChangeLink = true,
    textSize = 16,
    textAlign = "left",
    backgroundColor = "#f5f0e8",
    textColor = "#000000",
    borderColor,
    padding = 16,
    borderRadius = 0,
    ...rest
  } = props;
  const { isDesignMode } = useWeaverse();
  const { pathname, search } = useLocation();
  const liveLocation = useRouteLoaderData<RootLoader>("root")?.b2bLocation;

  // Studio has no logged-in buyer: show a sample so the block can be styled.
  const location =
    liveLocation ??
    (isDesignMode
      ? {
          companyName: "Company name",
          locationName: "Company location (sample)",
          canSwitch: true,
        }
      : null);

  if (!location) {
    return null;
  }

  return (
    <div
      ref={ref}
      {...rest}
      className="w-full"
      style={{
        backgroundColor,
        color: textColor,
        fontSize: textSize,
        textAlign,
        padding,
        borderRadius,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    >
      <span>
        {prefix} <strong>{location.locationName}</strong>
        {showCompany && location.companyName ? (
          <span> ({location.companyName})</span>
        ) : null}
      </span>
      {showChangeLink && location.canSwitch ? (
        <>
          <span aria-hidden="true"> · </span>
          <Link
            to={`/account/locations?${new URLSearchParams({ return_to: pathname + search })}`}
            className="underline underline-offset-2"
          >
            Change
          </Link>
        </>
      ) : null}
      {isDesignMode && !liveLocation ? (
        <p className="mt-2 text-xs opacity-70">
          Sample text. On the live site this only shows to logged-in B2B buyers
          with a company location. (Only visible in the editor.)
        </p>
      ) : null}
    </div>
  );
}

export const schema = createSchema({
  type: "mp--b2b-location",
  title: "B2B company location",
  limit: 1,
  enabledOn: {
    pages: ["PRODUCT"],
  },
  settings: [
    {
      group: "Content",
      inputs: [
        {
          type: "text",
          name: "prefix",
          label: "Text before the location",
          defaultValue: "You are ordering for",
        },
        {
          type: "switch",
          name: "showCompany",
          label: "Show company name",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showChangeLink",
          label: "Show Change link",
          defaultValue: true,
          helpText:
            "Only appears for buyers who can order for more than one location.",
        },
        {
          type: "range",
          name: "textSize",
          label: "Text size",
          configs: { min: 10, max: 32, step: 1, unit: "px" },
          defaultValue: 16,
        },
        {
          type: "toggle-group",
          name: "textAlign",
          label: "Alignment",
          configs: {
            options: [
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ],
          },
          defaultValue: "left",
        },
      ],
    },
    {
      group: "Style",
      inputs: [
        {
          type: "color",
          name: "backgroundColor",
          label: "Background color",
          defaultValue: "#f5f0e8",
        },
        {
          type: "color",
          name: "textColor",
          label: "Text color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "borderColor",
          label: "Border color",
          helpText: "Leave empty for no border.",
        },
        {
          type: "range",
          name: "padding",
          label: "Padding",
          configs: { min: 0, max: 48, step: 2, unit: "px" },
          defaultValue: 16,
        },
        {
          type: "range",
          name: "borderRadius",
          label: "Corner radius",
          configs: { min: 0, max: 32, step: 1, unit: "px" },
          defaultValue: 0,
        },
      ],
    },
  ],
});
