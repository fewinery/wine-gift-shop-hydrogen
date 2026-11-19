/** biome-ignore-all lint/suspicious/noConsole: use console.log for debugging */
import {
  AnalyticsEvent,
  type CartLineUpdatePayload,
  type CartUpdatePayload,
  type PageViewPayload,
  type ProductViewPayload,
  Script,
  useAnalytics,
  useNonce,
} from "@shopify/hydrogen";
import { useEffect } from "react";
import { useRouteLoaderData } from "react-router";
import type { RootLoader } from "~/root";
import { rememberAdClick } from "~/utils/ad-attribution";

/**
 * Ecommerce events for Google Tag Manager.
 *
 * The brand GTM containers listen for the "enhanced ecommerce" dataLayer
 * format (productImpression, addToCart, removeFromCart). Each push carries
 * that format plus GA4-style `items`, so both kinds of tags can read it.
 */

interface GtmProduct {
  id: string;
  name: string;
  price: number;
  brand: string;
  variant: string;
  quantity: number;
}

interface GtmItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_variant: string;
  price: number;
  quantity: number;
}

interface CartLineLike {
  quantity?: number;
  merchandise?: {
    id?: string;
    title?: string;
    price?: { amount?: string; currencyCode?: string };
    product?: { id?: string; title?: string; vendor?: string };
  };
}

function shopifyNumericId(gid: string | undefined): string {
  if (!gid) {
    return "";
  }
  return gid.split("/").pop()?.split("?")[0] ?? gid;
}

function toNumber(amount: string | number | undefined): number {
  const value = Number(amount);
  return Number.isFinite(value) ? value : 0;
}

function toItem(product: GtmProduct): GtmItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_variant: product.variant,
    price: product.price,
    quantity: product.quantity,
  };
}

function productFromCartLine(
  line: CartLineLike | undefined,
  quantity: number,
): GtmProduct | null {
  const merchandise = line?.merchandise;
  if (!merchandise?.product?.id) {
    return null;
  }
  return {
    id: shopifyNumericId(merchandise.product.id),
    name: merchandise.product.title ?? "",
    price: toNumber(merchandise.price?.amount),
    brand: merchandise.product.vendor ?? "",
    variant: shopifyNumericId(merchandise.id),
    quantity,
  };
}

function pushToDataLayer(payload: Record<string, unknown>) {
  if (!window.dataLayer) {
    return;
  }
  // Clear the previous ecommerce object so values don't leak between events.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(payload);
}

export function CustomAnalytics() {
  const { subscribe, canTrack } = useAnalytics();
  const nonce = useNonce();
  const rootData = useRouteLoaderData<RootLoader>("root");

  // biome-ignore lint/correctness/useExhaustiveDependencies: subscribe once on mount
  useEffect(() => {
    // Keep the ad click from the landing URL for checkout.
    rememberAdClick(window.location.href);

    setTimeout(() => {
      const isTrackingAllowed = canTrack();
      console.log("CustomAnalytics - isTrackingAllowed", isTrackingAllowed);
    }, 1000);

    // Standard events
    subscribe(AnalyticsEvent.PAGE_VIEWED, (data: PageViewPayload) => {
      console.log("CustomAnalytics - Page viewed:", data);
      window.dataLayer?.push({
        event: "page_viewed",
        page_url: data.url,
      });
    });

    subscribe(AnalyticsEvent.PRODUCT_VIEWED, (data: ProductViewPayload) => {
      console.log("CustomAnalytics - Product viewed:", data);
      const viewed = data.products?.[0];
      window.dataLayer?.push({
        event: "product_viewed",
        product_id: viewed?.id,
        product_name: viewed?.title,
        product_price: viewed?.price,
        product_url: viewed?.url,
      });
      if (!viewed) {
        return;
      }
      const product: GtmProduct = {
        id: shopifyNumericId(viewed.id),
        name: viewed.title ?? "",
        price: toNumber(viewed.price),
        brand: viewed.vendor ?? "",
        variant: shopifyNumericId(viewed.variantId),
        quantity: 1,
      };
      pushToDataLayer({
        event: "productImpression",
        modifier: "productDetail",
        ecommerce: {
          currencyCode: "USD",
          currency: "USD",
          value: product.price,
          detail: { products: [product] },
          items: [toItem(product)],
        },
      });
    });

    subscribe(AnalyticsEvent.COLLECTION_VIEWED, (data) => {
      console.log("CustomAnalytics - Collection viewed:", data);
    });

    subscribe(AnalyticsEvent.CART_VIEWED, (data) => {
      console.log("CustomAnalytics - Cart viewed:", data);
    });

    subscribe(AnalyticsEvent.CART_UPDATED, (data: CartUpdatePayload) => {
      console.log("CustomAnalytics - Cart updated:", data);
      window.dataLayer?.push({
        event: "cart_updated",
        cart_id: data.cart?.id,
        cart_total: data.cart?.cost?.totalAmount?.amount,
        cart_total_quantity: data.cart?.totalQuantity,
      });
    });

    subscribe(
      AnalyticsEvent.PRODUCT_ADD_TO_CART,
      (data: CartLineUpdatePayload) => {
        console.log("CustomAnalytics - Product added to cart:", data);
        const current = data.currentLine as CartLineLike | undefined;
        const previous = data.prevLine as CartLineLike | undefined;
        const added = (current?.quantity ?? 0) - (previous?.quantity ?? 0);
        const product = productFromCartLine(current, added > 0 ? added : 1);
        if (!product) {
          return;
        }
        pushToDataLayer({
          event: "addToCart",
          ecommerce: {
            currencyCode: "USD",
            currency: "USD",
            value: product.price * product.quantity,
            add: { products: [product] },
            items: [toItem(product)],
          },
        });
      },
    );

    subscribe(
      AnalyticsEvent.PRODUCT_REMOVED_FROM_CART,
      (data: CartLineUpdatePayload) => {
        console.log("CustomAnalytics - Product removed from cart:", data);
        const current = data.currentLine as CartLineLike | undefined;
        const previous = data.prevLine as CartLineLike | undefined;
        const removed = (previous?.quantity ?? 0) - (current?.quantity ?? 0);
        const product = productFromCartLine(
          previous ?? current,
          removed > 0 ? removed : 1,
        );
        if (!product) {
          return;
        }
        pushToDataLayer({
          event: "removeFromCart",
          ecommerce: {
            currencyCode: "USD",
            currency: "USD",
            value: product.price * product.quantity,
            remove: { products: [product] },
            items: [toItem(product)],
          },
        });
      },
    );

    subscribe(AnalyticsEvent.SEARCH_VIEWED, (data) => {
      console.log("CustomAnalytics - Search viewed:", data);
    });

    // Custom events
    subscribe(AnalyticsEvent.CUSTOM_EVENT, (data) => {
      console.log("CustomAnalytics - CUSTOM_EVENT:", data);
    });
  }, []);

  const id = rootData?.googleGtmID;
  if (!id) {
    return null;
  }

  return (
    <>
      {/* Initialize GTM container */}
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
              dataLayer = window.dataLayer || [];

              function gtag(){
                dataLayer.push(arguments)
              };

              gtag('js', new Date());
              gtag({'gtm.start': new Date().getTime(),event:'gtm.js'})
              gtag('config', "${id}");
          `,
        }}
      />

      {/* Load GTM script */}
      <Script async src={`https://www.googletagmanager.com/gtm.js?id=${id}`} />
    </>
  );
}
