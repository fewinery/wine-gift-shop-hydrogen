import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefixPathWithLocale } from "~/hooks/use-prefix-path-with-locale";
import {
  buildQuoteRequest,
  type GiftItem,
  type QuoteRequest,
  type QuoteResponse,
  type QuoteState,
  type Recipient,
} from "~/utils/multi-recipient";

// Long enough that typing an address is one request rather than one per
// keystroke, short enough that the figures feel like they follow the form.
const DEBOUNCE_MS = 700;

const FAILED: QuoteState = {
  status: "error",
  code: "unavailable",
  message:
    "Tax and shipping can't be calculated right now. Please try again in a moment.",
};

/**
 * Keeps a price for every complete recipient, and keeps it current.
 *
 * Each recipient is priced on their own, so editing one address re-prices
 * that recipient and nobody else. A recipient is priced again whenever
 * anything that could change the figures changes: their address, their
 * gifts, their shipping method, or the discount codes on the cart.
 */
export function useRecipientQuotes(
  recipients: Recipient[],
  items: GiftItem[],
  discountCodes: string[],
) {
  const endpoint = usePrefixPathWithLocale("/api/multi-recipient/quote");
  const [quotes, setQuotes] = useState<Record<string, QuoteState>>({});
  // Bumped by retry() to run the effect again without any input changing.
  const [attempt, setAttempt] = useState(0);
  // What has been asked for, per recipient. Compared against on every render
  // so that an unchanged recipient is never priced twice.
  const requested = useRef<Record<string, string>>({});
  const pending = useRef(
    new Map<
      string,
      { timer: ReturnType<typeof setTimeout>; controller: AbortController }
    >(),
  );
  const codesKey = discountCodes.join(",");

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt is a deliberate re-run trigger
  useEffect(() => {
    function cancel(id: string) {
      const entry = pending.current.get(id);
      if (entry) {
        clearTimeout(entry.timer);
        entry.controller.abort();
        pending.current.delete(id);
      }
    }

    function forget(id: string) {
      setQuotes((current) => {
        if (!(id in current)) {
          return current;
        }
        const next = { ...current };
        delete next[id];
        return next;
      });
    }

    async function price(
      id: string,
      signature: string,
      request: QuoteRequest,
      signal: AbortSignal,
    ) {
      let state: QuoteState = FAILED;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal,
        });
        const result = (await response.json()) as QuoteResponse;
        if ("quote" in result) {
          state = { status: "ready", quote: result.quote };
        } else if (result?.error) {
          state = { status: "error", ...result.error };
        }
      } catch {
        if (signal.aborted) {
          return;
        }
      }
      // A slow answer to an old question must not overwrite a newer one.
      if (requested.current[id] === signature) {
        pending.current.delete(id);
        setQuotes((current) => ({ ...current, [id]: state }));
      }
    }

    const live = new Set(recipients.map((recipient) => recipient.id));
    for (const id of Object.keys(requested.current)) {
      if (!live.has(id)) {
        cancel(id);
        delete requested.current[id];
        forget(id);
      }
    }

    for (const recipient of recipients) {
      const { id } = recipient;
      const request = buildQuoteRequest(recipient, items);
      const signature = request ? `${codesKey}|${JSON.stringify(request)}` : "";
      if (requested.current[id] === signature) {
        continue;
      }
      requested.current[id] = signature;
      cancel(id);
      if (!request) {
        forget(id);
        continue;
      }
      setQuotes((current) => {
        const previous = current[id];
        const kept =
          previous && previous.status !== "error" ? previous.quote : undefined;
        return { ...current, [id]: { status: "loading", quote: kept } };
      });
      const controller = new AbortController();
      const timer = setTimeout(() => {
        price(id, signature, request, controller.signal);
      }, DEBOUNCE_MS);
      pending.current.set(id, { timer, controller });
    }
  }, [recipients, items, codesKey, endpoint, attempt]);

  // Leaving the page abandons whatever is still in flight, and forgets what
  // was asked for - so if the page is mounted again (React does this on
  // purpose in development) every recipient is priced afresh instead of
  // waiting on answers that were just thrown away.
  useEffect(() => {
    const entries = pending.current;
    return () => {
      for (const entry of entries.values()) {
        clearTimeout(entry.timer);
        entry.controller.abort();
      }
      entries.clear();
      requested.current = {};
    };
  }, []);

  const retry = useCallback((id: string) => {
    delete requested.current[id];
    setAttempt((current) => current + 1);
  }, []);

  return { quotes, retry };
}
