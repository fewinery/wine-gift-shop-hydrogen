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
  // loadPage returns null ONLY when the Weaverse API call itself fails, which
  // includes hitting the client's fetch timeout. A page that genuinely has no
  // content comes back as a "fallback" page object instead, and is still
  // caught below. Turning a transient API failure into a hard 404 breaks
  // Weaverse Studio's editor handshake, leaving it stuck on "Initializing
  // Weaverse Editor..." and spinning the publish button forever.
  if (!weaverseData) {
    return;
  }

  if (
    !weaverseData?.page?.id ||
    (weaverseData?.page?.id?.includes("fallback") &&
      !weaverseData?.configs?.requestInfo?.queries?.isDesignMode)
  ) {
    throw new Response(null, { status: 404 });
  }
}
