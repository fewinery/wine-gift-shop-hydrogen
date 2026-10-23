import {
  WeaverseHydrogenRoot,
  type WeaverseLoaderData,
} from "@weaverse/hydrogen";
import { GenericError } from "~/components/root/generic-error";
import { components } from "./components";

export function WeaverseContent() {
  return (
    <WeaverseHydrogenRoot
      components={components}
      errorComponent={GenericError}
    />
  );
}

export function validateWeaverseData(weaverseData: WeaverseLoaderData) {
  // No data at all means the Weaverse API could not be reached, even after
  // the retry in the context. That is our outage, not a missing page, and the
  // difference matters: a 404 tells Google the URL is gone and tells the
  // visitor they mistyped something, when all they need to do is try again.
  if (!weaverseData) {
    throw new Response("Weaverse is temporarily unavailable", { status: 503 });
  }
  if (
    !weaverseData?.page?.id ||
    (weaverseData?.page?.id?.includes("fallback") &&
      !weaverseData?.configs?.requestInfo?.queries?.isDesignMode)
  ) {
    throw new Response(null, { status: 404 });
  }
}
