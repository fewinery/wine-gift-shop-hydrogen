import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/button";
import type { CustomerApiPlayLoad } from "~/routes/api/customer";
import { useNewsLetterSettings } from "./index";

interface NewsLetterInputProps extends HydrogenComponentProps {
  width: number;
  placeholder: string;
  buttonText: string;
  helpText: string;
  formType?: string;
  ref?: React.Ref<HTMLDivElement>;
}

function NewsLetterForm(props: NewsLetterInputProps) {
  const { buttonText, width, placeholder, helpText, ref, ...rest } = props;

  const {
    successBannerHeading,
    successBannerHeadingColor,
    successBannerDescription,
    successBannerDescriptionColor,
    successBannerBg,
    successBannerButtonText,
    successBannerButtonBg,
    successBannerButtonTextColor,
  } = useNewsLetterSettings();

  const fetcher = useFetcher();
  const { state, Form } = fetcher;
  const data = fetcher.data as CustomerApiPlayLoad;
  const { ok, errorMessage } = data || {};

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ok) {
      setOpen(true);
    }
  }, [ok]);

  return (
    <div ref={ref} {...rest} className="mx-auto max-w-full">
      <Form
        method="POST"
        action="/api/customer"
        className="flex w-full items-center justify-center"
        data-motion="fade-up"
      >
        <input
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="bg-white p-3 leading-tight focus:outline-hidden w-full border my-2.5 mr-1.5"
          style={{ width }}
        />
        <input
          type="hidden"
          name="formType"
          value={props.formType || "default"}
        />
        <Button
          type="submit"
          className="gap-3"
          loading={state === "submitting"}
        >
          {buttonText}
        </Button>
      </Form>
      {helpText && (
        <div
          className="text-center px-[6px] text-sm"
          data-motion="fade-up"
          dangerouslySetInnerHTML={{ __html: helpText }}
        />
      )}
      <div
        className={clsx(
          "mx-auto mt-4 text-center font-medium text-sm",
          state === "idle" && data && !ok ? "visible" : "invisible",
          "text-red-700",
        )}
      >
        {errorMessage || "Something went wrong"}
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-60 bg-black/80 animate-fade-in" />
          <Dialog.Content className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-md p-10 text-center shadow-2xl animate-scale-in"
              style={{
                backgroundColor: successBannerBg || "#000000",
              }}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>Subscription Successful</Dialog.Title>
              </VisuallyHidden.Root>

              <button
                type="button"
                className="absolute top-4 right-4 text-2xl opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: successBannerHeadingColor || "#ffffff" }}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <h2
                className="text-[40px] font-bold mb-4 tracking-widest"
                style={{ color: successBannerHeadingColor || "#ffffff" }}
              >
                {successBannerHeading || "THANK YOU!"}
              </h2>

              {successBannerDescription && (
                <div
                  className="text-lg opacity-90 leading-relaxed mb-8"
                  style={{ color: successBannerDescriptionColor || "#ffffff" }}
                  dangerouslySetInnerHTML={{ __html: successBannerDescription }}
                />
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-3 px-6 font-bold tracking-widest transition-all hover:opacity-80 border text-lg"
                style={{
                  backgroundColor: successBannerButtonBg || "#ffffff",
                  color: successBannerButtonTextColor || "#000000",
                  borderColor: successBannerButtonBg || "#ffffff",
                }}
              >
                {successBannerButtonText || "Close"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default NewsLetterForm;

export const schema = createSchema({
  type: "newsletter-form",
  title: "Form",
  settings: [
    {
      group: "Form",
      inputs: [
        {
          type: "range",
          name: "width",
          label: "Input width",
          configs: {
            min: 300,
            max: 600,
            step: 10,
            unit: "px",
          },
          defaultValue: 500,
        },
        {
          type: "text",
          name: "placeholder",
          label: "Placeholder",
          defaultValue: "Enter your email",
          placeholder: "Enter your email",
        },
        {
          type: "richtext",
          name: "helpText",
          label: "Help text",
          defaultValue:
            '<div>We care about the protection of your data. Read our <a href="/policies/privacy-policy" style="color: #007AFF; text-decoration: underline;">Privacy Policy</a>.</div>',
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          placeholder: "Subscribe",
          defaultValue: "Subscribe",
        },
      ],
    },
  ],
});
