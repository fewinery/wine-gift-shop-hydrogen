import {
  CaretDownIcon,
  CopyIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Money } from "@shopify/hydrogen";
import type { MoneyV2 } from "@shopify/hydrogen/storefront-api-types";
import { useState } from "react";
import { Image } from "~/components/image";
import { cn } from "~/utils/cn";
import {
  GIFT_FROM_MAX,
  GIFT_MESSAGE_MAX,
  GIFT_TO_MAX,
  type GiftItem,
  missingDetails,
  type QuoteState,
  type Recipient,
  type RecipientQuote,
  recipientItems,
  US_STATES,
} from "~/utils/multi-recipient";
import { ItemPicker } from "./item-picker";

const INPUT_CLASS =
  "w-full border border-neutral-400 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:border-black";
const LABEL_CLASS =
  "block text-xs font-bold uppercase tracking-wide text-neutral-900";

function Field({
  id,
  label,
  required,
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  maxLength?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        // These are other people's details. Left on, the browser offers the
        // shopper's own address for every recipient.
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function recipientName(recipient: Recipient) {
  return `${recipient.firstName} ${recipient.lastName}`.trim();
}

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

const BADGE_TONES = {
  amber: "bg-amber-100 text-amber-900",
  neutral: "bg-neutral-100 text-neutral-700",
  red: "bg-red-100 text-red-900",
  green: "bg-green-100 text-green-900",
};

/**
 * Where this recipient stands. "Ready" now means more than a full form: it
 * means Shopify has priced them, so there is a real figure to charge.
 */
function statusOf(complete: boolean, quote: QuoteState | undefined) {
  if (!complete) {
    return { label: "Incomplete", tone: BADGE_TONES.amber };
  }
  if (!quote || quote.status === "loading") {
    return { label: "Calculating", tone: BADGE_TONES.neutral };
  }
  if (quote.status === "error") {
    return {
      label: quote.code === "no_rates" ? "Can't ship here" : "Needs attention",
      tone: BADGE_TONES.red,
    };
  }
  return { label: "Ready", tone: BADGE_TONES.green };
}

function CostRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        emphasis ? "font-semibold text-neutral-900" : "text-neutral-600",
      )}
    >
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap">{value}</dd>
    </div>
  );
}

/**
 * Shipping method and the cost of sending to this one address. Tax is listed
 * by jurisdiction because it differs from recipient to recipient - a shopper
 * sending to three states should be able to see why the three totals differ.
 */
function Delivery({
  id,
  quote,
  busy,
  onMethodChange,
}: {
  id: string;
  quote: RecipientQuote;
  busy: boolean;
  onMethodChange: (method: string) => void;
}) {
  const money = (amount: number) => formatMoney(amount, quote.currencyCode);
  return (
    <div className={cn("space-y-3", busy && "opacity-60")}>
      <div className="space-y-1 sm:max-w-sm">
        <label htmlFor={id} className={LABEL_CLASS}>
          Shipping method
        </label>
        <select
          id={id}
          value={quote.shippingMethod}
          disabled={busy}
          onChange={(event) => onMethodChange(event.target.value)}
          className={INPUT_CLASS}
        >
          {quote.rates.map((rate) => (
            <option key={rate.title} value={rate.title}>
              {rate.title} - {money(rate.amount)}
            </option>
          ))}
        </select>
      </div>
      <dl className="space-y-1 text-sm sm:max-w-sm">
        <CostRow label="Gifts" value={money(quote.merchandise)} />
        {quote.discount > 0 && (
          <CostRow label="Discount" value={`-${money(quote.discount)}`} />
        )}
        <CostRow label="Shipping" value={money(quote.shipping)} />
        <CostRow label="Tax" value={money(quote.tax)} />
        {quote.taxLines.map((line) => (
          <div
            key={line.title}
            className="flex items-baseline justify-between gap-4 pl-3 text-neutral-500 text-xs"
          >
            <dt className="min-w-0">{line.title}</dt>
            <dd className="shrink-0 whitespace-nowrap">{money(line.amount)}</dd>
          </div>
        ))}
        <CostRow
          label="Total for this recipient"
          value={money(quote.total)}
          emphasis
        />
      </dl>
      {quote.notices.map((notice) => (
        <p key={notice} className="text-amber-900 text-sm">
          {notice}
        </p>
      ))}
    </div>
  );
}

/**
 * One recipient: who they are, where they live, what they get and what the
 * card says. Collapsed, it is a single row with a status so a list of twenty
 * can be scanned for the ones still missing something.
 */
export function RecipientCard({
  recipient,
  index,
  items,
  open,
  onToggle,
  onChange,
  onDuplicate,
  onRemove,
  giftNote,
  quote,
  onRetry,
}: {
  recipient: Recipient;
  index: number;
  items: GiftItem[];
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Recipient>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  giftNote?: string;
  /** This recipient's price, once they are complete enough to have one. */
  quote?: QuoteState;
  onRetry: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const assigned = recipientItems(recipient, items);
  const missing = missingDetails(recipient, items);
  const complete = missing.length === 0;
  const status = statusOf(complete, quote);
  // While a recipient is being re-priced the last figures stay on screen.
  const figures = quote && quote.status !== "error" ? quote.quote : undefined;
  const name = recipientName(recipient);
  const label = name || `Recipient ${index + 1}`;
  const fieldId = (field: string) => `recipient-${recipient.id}-${field}`;

  function removeItem(lineId: string) {
    const next = { ...recipient.items };
    delete next[lineId];
    onChange({ items: next });
  }

  return (
    <div className="border border-neutral-300 bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="truncate font-semibold text-neutral-900 text-sm">
            {label}
          </span>
          <span className={cn("shrink-0 px-2 py-0.5 text-xs", status.tone)}>
            {status.label}
          </span>
          {!open && (
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {quote?.status === "ready" && (
                <span className="text-neutral-900 text-sm">
                  {formatMoney(quote.quote.total, quote.quote.currencyCode)}
                </span>
              )}
              {assigned.slice(0, 4).map(({ item, quantity }) => (
                <span key={item.lineId} className="relative block size-9">
                  {item.image && (
                    <Image
                      data={item.image}
                      width={72}
                      sizes="36px"
                      className="[&_img]:object-contain"
                      alt={item.image.altText || item.title}
                    />
                  )}
                  {quantity > 1 && (
                    <span className="-top-1 -right-1 absolute flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                      {quantity}
                    </span>
                  )}
                </span>
              ))}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          title="Send the same gifts to someone else"
          aria-label={`Duplicate ${label}`}
          className="flex size-8 shrink-0 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <CopyIcon size={18} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="flex size-8 shrink-0 items-center justify-center text-neutral-600 transition-colors hover:text-red-600"
        >
          <TrashIcon size={18} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          className="flex size-8 shrink-0 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <CaretDownIcon
            size={18}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="space-y-5 border-neutral-200 border-t px-4 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Field
              id={fieldId("firstName")}
              label="First name"
              required
              value={recipient.firstName}
              onChange={(firstName) => onChange({ firstName })}
              className="lg:col-span-2"
            />
            <Field
              id={fieldId("lastName")}
              label="Last name"
              required
              value={recipient.lastName}
              onChange={(lastName) => onChange({ lastName })}
              className="lg:col-span-2"
            />
            <Field
              id={fieldId("company")}
              label="Company"
              value={recipient.company}
              onChange={(company) => onChange({ company })}
              className="sm:col-span-2 lg:col-span-2"
            />
            <Field
              id={fieldId("address1")}
              label="Address"
              required
              value={recipient.address1}
              onChange={(address1) => onChange({ address1 })}
              className="sm:col-span-2 lg:col-span-4"
            />
            <Field
              id={fieldId("address2")}
              label="Apartment, suite, etc."
              value={recipient.address2}
              onChange={(address2) => onChange({ address2 })}
              className="sm:col-span-2 lg:col-span-2"
            />
            <Field
              id={fieldId("city")}
              label="City"
              required
              value={recipient.city}
              onChange={(city) => onChange({ city })}
              className="lg:col-span-2"
            />
            <div className="space-y-1 lg:col-span-2">
              <label htmlFor={fieldId("state")} className={LABEL_CLASS}>
                State<span className="text-red-500"> *</span>
              </label>
              <select
                id={fieldId("state")}
                value={recipient.state}
                autoComplete="off"
                onChange={(event) => onChange({ state: event.target.value })}
                className={INPUT_CLASS}
              >
                <option value="">Select a state</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id={fieldId("zip")}
              label="ZIP code"
              required
              value={recipient.zip}
              maxLength={10}
              onChange={(zip) => onChange({ zip })}
              className="lg:col-span-2"
            />
            <Field
              id={fieldId("email")}
              label="Email"
              type="email"
              value={recipient.email}
              onChange={(email) => onChange({ email })}
              className="lg:col-span-3"
            />
            <Field
              id={fieldId("phone")}
              label="Phone"
              type="tel"
              value={recipient.phone}
              onChange={(phone) => onChange({ phone })}
              className="lg:col-span-3"
            />
          </div>

          <div className="space-y-2">
            <p className={LABEL_CLASS}>Gifts</p>
            {assigned.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                Nothing chosen for this recipient yet.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {assigned.map(({ item, quantity }) => (
                  <li
                    key={item.lineId}
                    className="flex w-full items-center gap-3 border border-neutral-300 p-2 sm:w-72"
                  >
                    <span className="relative block size-12 shrink-0">
                      {item.image && (
                        <Image
                          data={item.image}
                          width={96}
                          sizes="48px"
                          className="[&_img]:object-contain"
                          alt={item.image.altText || item.title}
                        />
                      )}
                      <span className="-top-1 -left-1 absolute flex size-5 items-center justify-center rounded-full bg-neutral-900 text-white text-xs">
                        {quantity}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-neutral-900 text-sm">
                        {item.title}
                      </span>
                      <Money
                        as="span"
                        withoutTrailingZeros
                        className="text-neutral-600 text-sm"
                        data={
                          {
                            amount: (item.unitPrice * quantity).toFixed(2),
                            currencyCode: item.currencyCode,
                          } as MoneyV2
                        }
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      aria-label={`Remove ${item.title} from ${label}`}
                      className="flex size-7 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-red-600"
                    >
                      <XIcon size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-neutral-900 text-sm underline underline-offset-4 hover:no-underline"
            >
              Update items &amp; quantities
            </button>
          </div>

          {complete && (
            <div className="space-y-3 border-neutral-200 border-t pt-5">
              <p className={LABEL_CLASS}>Shipping &amp; tax</p>
              {quote?.status === "error" && (
                <p className="text-red-800 text-sm" role="alert">
                  {quote.message}{" "}
                  {quote.code === "unavailable" && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="underline underline-offset-4"
                    >
                      Try again
                    </button>
                  )}
                </p>
              )}
              {figures ? (
                <Delivery
                  id={fieldId("shippingMethod")}
                  quote={figures}
                  busy={quote?.status === "loading"}
                  onMethodChange={(shippingMethod) =>
                    onChange({ shippingMethod })
                  }
                />
              ) : (
                quote?.status !== "error" && (
                  <p className="text-neutral-500 text-sm" aria-live="polite">
                    Calculating shipping and tax for this address...
                  </p>
                )
              )}
            </div>
          )}

          <div className="space-y-3 border-neutral-200 border-t pt-5">
            <p className={LABEL_CLASS}>Gift message (optional)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                id={fieldId("giftTo")}
                label="To"
                value={recipient.giftTo}
                maxLength={GIFT_TO_MAX}
                placeholder="Recipient name"
                onChange={(giftTo) => onChange({ giftTo })}
              />
              <Field
                id={fieldId("giftFrom")}
                label="From"
                value={recipient.giftFrom}
                maxLength={GIFT_FROM_MAX}
                placeholder="Your name"
                onChange={(giftFrom) => onChange({ giftFrom })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={fieldId("giftMessage")} className={LABEL_CLASS}>
                Message
              </label>
              <textarea
                id={fieldId("giftMessage")}
                rows={3}
                maxLength={GIFT_MESSAGE_MAX}
                placeholder="Write a personal message..."
                value={recipient.giftMessage}
                onChange={(event) =>
                  onChange({ giftMessage: event.target.value })
                }
                className={cn(INPUT_CLASS, "resize-none")}
              />
              <div className="flex justify-between gap-4 text-neutral-500 text-sm">
                <span>{giftNote}</span>
                <span className="shrink-0">
                  {recipient.giftMessage.length}/{GIFT_MESSAGE_MAX}
                </span>
              </div>
            </div>
          </div>

          {!complete && (
            <p className="text-amber-900 text-sm" aria-live="polite">
              Still needed: {missing.join(", ")}
            </p>
          )}
        </div>
      )}

      <ItemPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        items={items}
        value={recipient.items}
        onSave={(next) => onChange({ items: next })}
        recipientLabel={label}
      />
    </div>
  );
}
