import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useThemeSettings } from "@weaverse/hydrogen";
import { useEffect, useState } from "react";
import { useFetcher, useLocation, useRouteLoaderData } from "react-router";
import { Image } from "~/components/image";
import { useWeaverseStudioCheck } from "~/hooks/use-weaverse-studio-check";
import type { RootLoader } from "~/root";
import { cn } from "~/utils/cn";
import { DEFAULT_LOCALE } from "~/utils/const";

const POPUP_DISMISSED_KEY = "newsletter-popup-dismissed";

export function useShouldRenderNewsletterPopup() {
  const location = useLocation();
  const data = useRouteLoaderData<RootLoader>("root");
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;
  const { newsletterPopupEnabled, newsletterPopupHomeOnly } =
    useThemeSettings();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const isHomePage =
    pathParts.length === 0 ||
    (pathParts.length === 1 && pathParts[0] === locale.pathPrefix.slice(1));
  return (
    newsletterPopupEnabled && (newsletterPopupHomeOnly ? isHomePage : true)
  );
}

export function NewsletterPopup() {
  const {
    newsletterPopupDelay,
    newsletterPopupAllowDismiss,
    newsletterPopupImage,
    newsletterPopupImagePosition = "left",
    newsletterPopupHeading,
    newsletterPopupDescription,
    newsletterPopupButtonText,
    newsletterPopupPosition = "center",
  } = useThemeSettings();

  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ ok: boolean; error: string }>();
  const isDesignMode = useWeaverseStudioCheck();

  // Compute message and error from fetcher data
  const message = fetcher.data?.ok ? "Thank you for signing up! 🎉" : "";
  const error =
    fetcher.data && !fetcher.data.ok
      ? fetcher.data.error || "An error occurred while signing up."
      : "";

  // Close popup after successful submission
  useEffect(() => {
    if (fetcher.data?.ok) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: just need to run once
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isDesignMode) {
      const isDismissed = localStorage.getItem(POPUP_DISMISSED_KEY) === "true";
      if (isDismissed) {
        return;
      }
      timer = setTimeout(() => {
        setOpen(true);
      }, newsletterPopupDelay * 1000);
    }
    return () => clearTimeout(timer);
  }, []);

  // Re-open popup when settings change in design mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: Need to track all settings changes in design mode
  useEffect(() => {
    if (isDesignMode) {
      setOpen(true);
    }
  }, [
    newsletterPopupDelay,
    newsletterPopupAllowDismiss,
    newsletterPopupImage,
    newsletterPopupImagePosition,
    newsletterPopupHeading,
    newsletterPopupDescription,
    newsletterPopupButtonText,
    newsletterPopupPosition,
  ]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-0 z-50 flex overflow-y-auto p-4 backdrop-blur-xs",
            "pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]",
            "[--slide-up-from:20px]",
            "data-[state=open]:animate-slide-up",
            newsletterPopupPosition === "center" &&
            "items-center justify-center",
            newsletterPopupPosition === "top-left" &&
            "items-start justify-start",
            newsletterPopupPosition === "top-right" &&
            "items-start justify-end",
            newsletterPopupPosition === "bottom-left" &&
            "items-end justify-start",
            newsletterPopupPosition === "bottom-right" &&
            "items-end justify-end",
          )}
          aria-describedby={undefined}
        >
          <div
            className={cn(
              "relative my-auto w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto bg-black shadow-xl",
              newsletterPopupImage && "lg:max-w-2xl",
            )}
          >
            <Dialog.Close asChild>
              <button
                type="button"
                className="sticky top-0 right-0 z-10 ml-auto mr-4 mt-4 flex items-center justify-center text-white hover:text-white/70 transition-colors focus-visible:outline-0"
                aria-label="Close"
              >
                <XIcon size={24} weight="bold" />
              </button>
            </Dialog.Close>
            <VisuallyHidden.Root asChild>
              <Dialog.Title>Newsletter Signup</Dialog.Title>
            </VisuallyHidden.Root>

            <div
              className={cn(
                "flex",
                newsletterPopupImagePosition === "top"
                  ? "flex-col"
                  : "flex-col md:flex-row",
                newsletterPopupImagePosition === "right" &&
                "md:flex-row-reverse",
              )}
            >
              {newsletterPopupImage && (
                <div
                  className={cn(
                    "relative",
                    newsletterPopupImagePosition === "top"
                      ? "h-64 w-full"
                      : "h-64 w-full md:h-auto md:w-1/2",
                  )}
                >
                  <Image
                    data={newsletterPopupImage}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div
                className={cn(
                  "flex flex-col justify-center p-10",
                  newsletterPopupImage
                    ? newsletterPopupImagePosition === "top"
                      ? "w-full"
                      : "md:w-1/2"
                    : "w-full",
                )}
              >
                <h3 className="mb-4 font-bold text-3xl md:text-5xl leading-tight text-white">
                  {newsletterPopupHeading}
                </h3>
                <p className="mb-6 text-white text-base md:text-lg">
                  {newsletterPopupDescription}
                </p>

                <fetcher.Form
                  action="/api/klaviyo"
                  method="POST"
                  encType="multipart/form-data"
                  className="space-y-4"
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter Address"
                    className="w-full border bg-white border-gray-300 px-4 py-2.5 focus:border-gray-500 focus:outline-hidden placeholder:text-lg"
                  />
                  <button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    className="w-full py-2 px-4 font-bold text-white bg-[#e91220] hover:bg-[#c0101b] transition-colors disabled:opacity-70 uppercase text-lg"
                  >
                    {fetcher.state === "submitting"
                      ? "Submitting..."
                      : newsletterPopupButtonText}
                  </button>
                </fetcher.Form>

                {error && (
                  <div className="mt-4 bg-red-200 px-3 py-2 text-center text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mt-4 bg-green-50 px-3 py-2 text-center text-green-700 text-sm">
                    {message}
                  </div>
                )}

                {newsletterPopupAllowDismiss && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem(POPUP_DISMISSED_KEY, "true");
                      setOpen(false);
                    }}
                    className="mt-4 w-full text-white bg-[#e91220] hover:bg-[#c0101b] transition-colors py-2 px-4 font-bold uppercase text-lg"
                  >
                    NO, I'LL PAY FULL PRICE
                  </button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
