# Club member price ("Club & Loyalty from…")

The line shown under a product's price on product cards and product pages:

> $95.00
> Club & Loyalty from $76 ⓘ

This guide covers what the line shows, how its price is worked out, how to turn it on and style it in Weaverse, and how to hide it on specific products.

---

## Quick reference

| I want to… | Where | Code change? |
|---|---|---|
| Show or hide the line on a whole storefront | Weaverse → Theme settings → **Club member price** → *Show club member price* | No |
| Change the wording ("Club & Loyalty from") | Same group → *Label* | No |
| Show or hide the ⓘ icon and its pop-up message | Same group → *Show info icon* | No |
| Edit the pop-up message, link, colours or sizes | Same group (visible once *Show info icon* is on) | No |
| Hide the line on specific products | Shopify admin → product → add the tag `No WinePlus Loyalty Price Message` | No |
| Change the 20% discount | `app/components/product/club-member-price.tsx` → `CLUB_DISCOUNT_PERCENT` | **Yes** |

---

## 1. The discount is fixed at 20%, in code

The club price is always **20% off the price shown directly above it**.

```ts
// app/components/product/club-member-price.tsx
const CLUB_DISCOUNT_PERCENT = 20;
```

This is deliberately **not** a setting in the visual editor. An earlier version had a slider, and one accidental drag would have shown a wrong price on every product. Changing the percentage takes a code change, and it applies to **every storefront** that has the line turned on. Any value saved under the old `clubPriceDiscount` setting is ignored.

### How the price is calculated

```
club price = displayed price × (1 − 20 / 100), rounded to the cent
```

The result is shown without trailing zeros (`$76`, not `$76.00`).

The **displayed price** depends on where the line appears:

| Where | Price the 20% is taken from |
|---|---|
| Product card | The price on the card. That's the selected variant's price, or the lowest price when *Show lowest price* is on or the product is a combined listing. |
| Product page | The selected variant's price. A combined listing uses the bottom of its price range. |
| Wine picker (package products) | The wine's first variant price |
| Blog article product card | The product's first available variant price |

**It follows the sale price.** When a product is discounted through a *compare-at price*, the club line is calculated from the new, lower price, not the original one. A product at $95 marked down 25% to $71.25 shows "Club & Loyalty from $57". That's 40% off the original price. If promo products shouldn't show a club price, use the tag in section 3.

**Nothing is shown when the price is missing or zero.** The line hides itself rather than showing "$0" or "$NaN".

---

## 2. Turning it on and styling it (Weaverse)

**Weaverse Studio → Theme settings → Club member price**

| Setting | Default | What it does |
|---|---|---|
| **Show club member price** | Off | Turns the whole line on or off for this storefront. |
| **Label** | `Club & Loyalty from` | The text before the price. |
| **Show info icon** | Off | Adds an ⓘ after the price. Hovering on desktop or tapping on mobile opens a short pop-up message with a link. |
| **Info message** | "If you join our club or loyalty program, you can get up to {discount}% off all your purchases, free shipping, and special offers." | The pop-up text. `{discount}` is replaced with `20`. |
| **Info link text** | `Click here to check out club options.` | Text of the link in the pop-up. |
| **Info link** | `/club` | Where the link goes. |
| **Pop-up background** | Theme colour | Background of the pop-up. |
| **Message text color** | Theme colour | Text colour of the message. |
| **Message text size** | Stylesheet size | 10–24 px. |
| **Link button background** | Empty | Empty shows an underlined link. A colour turns it into a filled button. |
| **Link text color** | Theme colour | Colour of the link or button text. |
| **Link text size** | Stylesheet size | 10–24 px. |

The settings below *Show club member price* only appear once it's on, and the pop-up settings only once *Show info icon* is on.

### Why it's off by default

This theme is shared by 65+ storefronts. Some have no wine club at all (corporate gifting, for example), and a club discount shown there would be a wrong price on a live site. Each brand turns it on for itself.

### Label fallback

Two older wordings are treated as "not set" and replaced with the current default: `Club Member Price as Low as` and `Club or Loyalty Pricing from`. This updates storefronts that never edited the label. To actually use one of those phrases, write it slightly differently.

### Changes not showing on the live site?

Studio shows changes immediately. The live site is cached, so a saved change can take **two page loads** to appear.

---

## 3. Hiding it on specific products (tag)

Add this tag to the product in **Shopify admin → Products → (product) → Tags**:

```
No WinePlus Loyalty Price Message
```

- Capital letters and extra spaces don't matter. `no wineplus loyalty price message` works too.
- The spelling must otherwise match exactly. `No WinePlus Price` will **not** work.
- Remove the tag to bring the line back.
- If the line is turned off for the storefront, the tag makes no difference.

### Where the tag works

| Where | Hidden by the tag? |
|---|---|
| Product cards (collections, all featured products sections, related products, upsells, search, cart best sellers) | ✅ Yes |
| Product page | ✅ Yes |
| Wine picker inside package products | ❌ Not yet. That data doesn't include tags. |
| Blog article product card | ❌ Not yet. Same reason. |

### ⚠️ The tag only changes what's displayed

The tag hides the **text**. It does **not** stop a club or loyalty discount from being applied at checkout. Those discounts live in Shopify or Winehub, and the website code doesn't control them.

If tagged products also shouldn't get the club discount at checkout:

- **Shopify discount:** create an automated collection with the condition **Product tag *is not equal to* `No WinePlus Loyalty Price Message`**, then set the club discount's **Applies to → Specific collections** to that collection.
- **Winehub:** exclude the products in Winehub's own settings.

Before a promo launches, test it: log in as a club member, add a tagged product to the cart, and check the price at checkout.

---

## 4. For developers

| File | Role |
|---|---|
| `app/components/product/club-member-price.tsx` | The component: the 20% constant, the tag check, the price calculation, the label fallback, and the ⓘ pop-up. |
| `app/weaverse/schema.server.ts` | The *Club member price* theme settings group. |
| `app/components/product/product-card.tsx` | Product card. Passes the displayed price and `product.tags`. |
| `app/sections/main-product/product-prices.tsx` | Product page. Passes the selected variant price and `product.tags`. |
| `app/components/product/wine-picker.tsx` | Wine picker. Passes price only, no tags. |
| `app/sections/blog-cta/index.tsx` | Blog article product card. Passes price only, no tags. |

`ClubMemberPrice` returns nothing, in this order, when:

1. *Show club member price* is off.
2. The product has the `No WinePlus Loyalty Price Message` tag.
3. The price is missing, not a number, or zero or less.

Otherwise it renders the label and the calculated price, plus the ⓘ when *Show info icon* is on.

**Making the tag work in the wine picker or blog card:** add `tags` to the product fields in the query those features read, and pass `tags={product.tags}` to `ClubMemberPrice`. Product cards get `tags` from the `ProductCard` fragment and the product page from `PRODUCT_QUERY`, both in `app/graphql/`.

**Changing the tag name:** edit `HIDE_CLUB_PRICE_TAG` in `club-member-price.tsx`. Write it in lowercase, because the check lowercases product tags before comparing. Products tagged with the old name will show the line again until they're re-tagged.
