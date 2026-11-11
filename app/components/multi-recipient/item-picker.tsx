import { XIcon } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useEffect, useState } from "react";
import { Button } from "~/components/button";
import { Image } from "~/components/image";
import { AddStepper } from "~/components/product/add-stepper";
import { cn } from "~/utils/cn";
import { type GiftItem, MAX_PER_ITEM } from "~/utils/multi-recipient";

/**
 * "Which gifts does this person get?" - every item in the cart, each with the
 * same Add -> -/+ control the product page uses for add-ons.
 *
 * Changes are held in a draft until Save, so closing the dialog or pressing
 * Cancel leaves the recipient exactly as they were.
 */
export function ItemPicker({
  open,
  onOpenChange,
  items,
  value,
  onSave,
  recipientLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: GiftItem[];
  value: Record<string, number>;
  onSave: (next: Record<string, number>) => void;
  recipientLabel: string;
}) {
  const [draft, setDraft] = useState<Record<string, number>>(value);

  // Start each opening from what the recipient has now, not from whatever
  // was left in the draft the last time the dialog was dismissed.
  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  function setQuantity(lineId: string, next: number) {
    setDraft((current) => {
      const updated = { ...current };
      if (next <= 0) {
        delete updated[lineId];
      } else {
        updated[lineId] = Math.min(next, MAX_PER_ITEM);
      }
      return updated;
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "[--slide-up-from:20px]",
            "data-[state=open]:animate-slide-up",
          )}
          aria-describedby={undefined}
        >
          <div className="relative flex max-h-full w-full max-w-2xl flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between gap-4 border-neutral-200 border-b px-5 py-4">
              <Dialog.Title className="font-bold text-neutral-900 text-sm uppercase tracking-wide">
                Select gifts for {recipientLabel}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <XIcon size={16} />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto p-5 sm:grid-cols-2">
              {items.map((item) => {
                const quantity = draft[item.lineId] ?? 0;
                return (
                  <div
                    key={item.lineId}
                    className={cn(
                      // border-2 in both states so choosing never shifts the
                      // grid by a pixel; the chosen stroke is the buy button's
                      // own colour, as on the product page add-ons.
                      "flex gap-3 border-2 p-3 transition-colors",
                      quantity > 0
                        ? "border-(--btn-primary-bg)"
                        : "border-neutral-300",
                    )}
                  >
                    <div className="size-16 shrink-0">
                      {item.image && (
                        <Image
                          data={item.image}
                          width={128}
                          sizes="64px"
                          className="[&_img]:object-contain"
                          alt={item.image.altText || item.title}
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-neutral-900 text-sm leading-snug">
                        {item.title}
                      </p>
                      {item.variantTitle && (
                        <p className="text-neutral-500 text-xs">
                          {item.variantTitle}
                        </p>
                      )}
                      <Money
                        withoutTrailingZeros
                        className="text-neutral-600 text-sm"
                        data={
                          {
                            amount: item.unitPrice.toFixed(2),
                            currencyCode: item.currencyCode,
                          } as MoneyV2
                        }
                      />
                      <div className="mt-auto w-32 pt-2">
                        <AddStepper
                          quantity={quantity}
                          canAdd={quantity < MAX_PER_ITEM}
                          onChange={(next) => setQuantity(item.lineId, next)}
                          addLabel="Add"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 border-neutral-200 border-t bg-neutral-50 px-5 py-4">
              <Dialog.Close asChild>
                <Button variant="outline" className="w-28">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                className="w-28"
                onClick={() => {
                  onSave(draft);
                  onOpenChange(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
