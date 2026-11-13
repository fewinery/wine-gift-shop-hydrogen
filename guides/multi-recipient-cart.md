# Multi-recipient cart: team guide

One cart, several addresses, one payment. A shopper fills their cart, chooses
who gets what, pays once, and each address receives its own order.

This guide is for everyone who touches it: whoever switches it on for a brand,
customer service, the warehouse and finance.

**Status.** Built into the shared theme and off by default on every
storefront. First full test on staging on November 12, 2026 (parent order
WGS-125926, three recipients, paid with store credit, club discount applied).
No live brand has it switched on yet. The section
[Not tested yet](#not-tested-yet) lists what still needs a real run.

---

## The one thing to remember

> **The money is on the parent order. The products are on the child orders.**
>
> To give money back, refund the **parent**.
> To change what ships, change the **child**.

Everything in the customer service section follows from this.

---

## How it works

1. The shopper presses **Send to multiple recipients** in the cart drawer or on
   the cart page.
2. On the recipients page they add each person's address, choose that person's
   gifts and quantities, pick a shipping method and can write a gift message.
   Shopify works out the real shipping and tax for each address as they go.
   Logged-in shoppers can add addresses saved on their account with one click.
3. They press **Checkout** and pay once on Shopify's normal payment page. This
   creates the **parent order**.
4. Within about a minute, Shopify Flow tells the storefront the parent was
   paid. The storefront creates one **child order** per recipient and cancels
   the parent **without refunding it**.

The parent is only a way to take one payment. It is cancelled on purpose. Its
payment is what pays for the child orders.

---

## What the orders look like

| | Parent order | Child order (one per recipient) |
| --- | --- | --- |
| Purpose | Takes the single payment | Is picked, packed and shipped |
| Tag | `Multi_rec_parent_order` | `Multi_rec_child_order` |
| Status after the split | Cancelled, archived, **Paid** | Open, **Paid**, Unfulfilled |
| Payment | The real one: card, store credit, gift card | Marked as paid. No real money on it |
| Lines | Each gift as a plain line showing "Ship to: ...", plus a **Shipping** line and a **Tax** line | The real products, with the recipient's shipping method and Shopify's real tax |
| Shipping address | None | The recipient's |
| Inventory | Not touched | Reduced when the child is created |
| Channel column | Draft Orders | FEW Customer Writer (the app) |
| Gift message | Not shown | In the order note and in Additional details |

The Channel column cannot show the brand, because Shopify names the app that
created the order. Giftship orders behave the same way. Use the brand tag
below to filter by brand.

### Tags

| Tag | On | Meaning |
| --- | --- | --- |
| `Multi_rec_parent_order` | Parent | The order the shopper paid |
| `Multi_rec_child_order` | Child | An order for one recipient |
| `Multi_rec_from_WGS-123456` | Child | Which parent it came from. Search this tag to find every order of one purchase |
| `Multi_rec_site_<domain>` | Both | The brand's storefront the purchase came from, for example `Multi_rec_site_staging.winegiftshop.com`. Long domains are cut to fit Shopify's 40-character limit. The full domain is in Additional details as **Storefront** |
| `Multi_rec_split_done` | Parent | Every child order exists. Normal, nothing to do |
| `Multi_rec_test` | Both | Came from a test storefront. The warehouse must not ship these |
| `Multi_rec_needs_attention` | Parent | A child order could not be created. See [When something goes wrong](#when-something-goes-wrong) |
| `Multi_rec_review` | Parent | The child orders do not add up to what was paid. Someone should compare them |

`Multi_rec_site_` and the Storefront detail arrive with the follow-up pull
request after #183. Orders created before it do not have them.

---

## Setting it up

### Once per Shopify store

Wine Gift Shop is done. Corporate Wine Gift and Cuvigift each need all of this
before any of their brands can use the feature.

1. **The app.** *FEW Customer Writer* must be installed and approved with these
   permissions: read and write customers, read and write draft orders, read and
   write orders, and read products. Without read products everything works,
   but the add-ons row leaves out unlisted products.
2. **One "home" storefront.** Pick one storefront on that store that will
   always exist. Give it the variable `MULTI_RECIPIENT_SPLIT_SECRET` (a long
   random value, marked as secret) and redeploy. It does the split for every
   brand on the store. Today this is staging; **change it to a production
   storefront before the first live brand is switched on.**
3. **One Shopify Flow workflow**, named "[MR] Multi Recipient Split PLEASE DO
   NOT TOUCH" on Wine Gift Shop:

   | Step | Setting |
   | --- | --- |
   | Trigger | Order paid |
   | Condition | At least one of order tags is equal to `Multi_rec_parent_order` |
   | Action | Send HTTP request |
   | Method | POST |
   | URL | `https://<home storefront domain>/api/multi-recipient/split` |
   | Header | `Content-Type` = `application/json` |
   | Header | `X-Multi-Recipient-Secret` = the Flow secret holding the same value as the variable |
   | Body | `{"orderId": "{{order.id}}"}` |
   | On client error (4XX) | Fail |
   | On server error (5XX or 429) | Retry |

   One workflow covers every brand on the store. Do not create one per brand.

### For each storefront (brand)

1. **A real domain set as Primary.** Login and checkout do not work reliably
   on the long `...o2.myshopify.dev` address.
2. **Variables** in Hydrogen > the storefront > Storefront settings >
   Environments and variables, on Preview **and** Production:
   `SHOPIFY_APP_CLIENT_ID` and `SHOPIFY_APP_CLIENT_SECRET`. A storefront that
   still has `SHOPIFY_ADMIN_API_TOKEN` can use that instead.
3. **Redeploy.** Oxygen only reads variables when it deploys.
4. **Switch it on** in Weaverse > Theme Settings > Cart > *Offer sending to
   multiple recipients*.

Without the variables the button stays hidden even with the toggle on. That is
deliberate: shoppers never see a page that cannot price or take payment.

Other settings in the same place:

| Setting | What it does |
| --- | --- |
| Button text | The label of the button in the cart |
| Add-ons collection handle | Products offered as extras on the recipients page. Defaults to `multi-recipient-add-ons`. Unlisted products in it are shown too. A product appears only on storefronts whose sales channel it is available to, and never while it is a draft. Products must be addable without choosing options. Clear the field to show none |
| Add-ons heading | The title above that row |
| Hidden shipping methods | Shipping method names not offered for gifts, separated by commas. Defaults to "Local Pickup Point" |

### Test storefronts only

Add `MULTI_RECIPIENT_TEST_MODE` = `true`. Every order from that storefront then
also carries `Multi_rec_test`. Never set it on a live brand.

### Variables at a glance

| Variable | Where | Secret |
| --- | --- | --- |
| `SHOPIFY_APP_CLIENT_ID` | Every storefront that uses the feature | No |
| `SHOPIFY_APP_CLIENT_SECRET` | Every storefront that uses the feature | Yes |
| `MULTI_RECIPIENT_SPLIT_SECRET` | The home storefront only | Yes |
| `MULTI_RECIPIENT_TEST_MODE` | Test storefronts only | No |

Never paste a secret's value into a chat, a ticket or a screenshot.

### Before switching on a live brand

- [ ] The Flow URL points at a production storefront, not staging
- [ ] That storefront has `MULTI_RECIPIENT_SPLIT_SECRET` and was redeployed
- [ ] The brand's storefront has the two app variables and was redeployed
- [ ] The warehouse ignores `Multi_rec_test` and ships `Multi_rec_child_order`
- [ ] The warehouse does **not** try to ship `Multi_rec_parent_order`
- [ ] Finance has updated its report filters (see [Reports](#reports))
- [ ] One real test order on that brand, then cancelled and refunded

---

## Customer service

### Finding the orders

Search the parent's tag, for example `Multi_rec_from_WGS-125926`, to list every
child of one purchase. The parent's note also lists them ("Sent as WGS-125927,
WGS-125928, ..."). From a child, the tag names its parent.

### How much one recipient cost

Open that recipient's **child** order. Its total is exactly that recipient's
share of what was paid: their gifts, minus their discount, plus their shipping
and their tax.

### Cancel one recipient's order (before it ships)

1. Open the **child** order > More actions > Cancel order.
2. Restock the items: yes.
3. Refund: record the full refund. It is a "manual" refund and moves no money;
   it only keeps the order's figures right.
4. Open the **parent** order > Refund. Type the child's total as the refund
   amount. This is the step that returns the customer's money.

### Cancel the whole purchase (before anything ships)

1. Cancel every child as above (restock, record the refund).
2. Open the **parent** > Refund > refund everything.

### Refund part of an order (damaged bottle, goodwill)

1. Open the **parent** > Refund > type the amount. This returns the money.
2. Open the **child** it relates to > Refund > record the same amount. Restock
   only if the item is really coming back.

### Change an address or a gift message

Edit the **child** order, as with any order, before it ships. The parent's
"Ship to" text is only a record of what the shopper typed and does not need
changing.

### Refunds go back to how the customer paid

A refund on the parent returns to the original payment: card, store credit or
gift card. Shopify will not refund more than was paid on the parent.

### Mistakes and how to fix them

| What happened | What it means | What to do |
| --- | --- | --- |
| Refunded the **child only** | The customer received **nothing**. A child refund is only a record | Refund the same amount on the parent |
| Refunded the **parent and the child** for the same amount | Correct. The customer was refunded once, from the parent | Nothing |
| Refunded the **parent twice** for the same thing | The customer was refunded twice. This is real money and Shopify cannot reverse it | Tell a supervisor. Add a note to the parent |
| Refunded the parent but **did not cancel the child** | The customer has their money and the gift will still ship | Cancel the child now, or contact the warehouse |
| Cancelled the **wrong child** | A cancelled order cannot be reopened | Create a replacement order for that recipient (draft order, mark as paid) and add the tags `Multi_rec_child_order` and `Multi_rec_from_<parent>` |
| Someone tried to fulfil or "fix" the **parent** | Nothing ships from the parent. It needs no fulfilment | Leave it cancelled. Do not edit it |

### Never do these

- Do not cancel, reopen, edit or fulfil a parent by hand.
- Do not remove the `Multi_rec_` tags. The warehouse and the reports rely on
  them.
- Do not tell a customer they were refunded after refunding only a child.

---

## When something goes wrong

### A parent is Paid and still open after several minutes

The split did not run. Open Shopify Flow > the workflow > run history.

| Flow shows | Cause | Fix |
| --- | --- | --- |
| No run for that order | The workflow is off, or the order has no parent tag | Turn the workflow on. Then ask for the split to be re-run |
| Failed, 401 | The secret in Flow and the storefront variable differ | Set both to the same value, redeploy the home storefront, re-run |
| Retrying, 503 | The home storefront is missing the secret, or Shopify was briefly unavailable | Flow keeps trying for a day. If it is the secret, add it and redeploy |
| Failed, 422 | A child could not be created. The parent also gets `Multi_rec_needs_attention` | See below |

### `Multi_rec_needs_attention`

Shopify refused to create one of the child orders, usually because a product
ran out of stock between payment and the split. The parent stays paid and
open, and the children that could be created already exist.

1. Open the failed Flow run. The response says which recipient and why.
2. Fix the cause (for example, correct the stock).
3. Ask for the split to be re-run. It is safe to run again: it finishes what is
   missing and never creates a second copy of an order that exists.

If it cannot be fixed, refund that recipient's share on the parent and tell
the customer.

### Re-running the split (developer)

```bash
curl -X POST "https://<home storefront domain>/api/multi-recipient/split" \
  -H "Content-Type: application/json" \
  -H "X-Multi-Recipient-Secret: <the secret>" \
  -d '{"orderId": "<the number at the end of the parent order URL in the admin>"}'
```

| Answer | Meaning |
| --- | --- |
| 200 `done` | Every child exists and the parent is cancelled |
| 200 `ignored` | Not a paid multi-recipient parent. Nothing was done |
| 503 `retry` | Not finished. Call again |
| 422 `attention` | Shopify refused a child. Read `detail` |
| 401 | Wrong secret |

### `Multi_rec_review`

The children's totals do not add up to the parent's. The orders are still
correct to ship. Compare the parent's total with the sum of its children and
refund or note the difference.

### Draft orders piling up

Each press of Checkout prepares draft orders. If the shopper leaves the
payment page without paying, the drafts from their last attempt stay behind.
They are tagged `Multi_rec_parent_order` or `Multi_rec_child_order` and are
harmless. Delete open ones older than two days; do not delete recent ones,
because a shopper may still be on the payment page.

### "Cart (0)" although the shopper added products

Not specific to this feature, but it came up during testing. If a product
sitting in someone's cart stops being available to that storefront, the whole
cart fails to display. Clearing the site's cookies for that shopper fixes it.

---

## Reports

Every multi-recipient purchase exists twice in Shopify: once as the parent and
once as the children. Giftship orders have the same shape today.

- **Sales by product, and tax by state:** use the **children**. They hold the
  real products and Shopify's real tax lines.
- **Money received and payouts:** the **parent**. It holds the real payment.
- **To avoid counting sales twice:** exclude orders tagged
  `Multi_rec_parent_order` from sales reports. On the parent, tax appears as a
  line called "Tax", not as tax.
- **By brand:** filter by `Multi_rec_site_<domain>`.

Finance should confirm these filters match how Giftship orders are reported
today before the first live brand.

---

## Build-your-own bundles

A product that adds several things in one click (the package, the wines
picked for it, a wood card, merch) can keep them together as **one bundle**,
or add them as **separate items**. It is set per product and is off unless
switched on, so existing products keep working exactly as before.

| | Separate items (default) | One bundle |
| --- | --- | --- |
| Cart and cart drawer | One line per piece | One item: the kit's name, its contents listed underneath, one quantity, one price, one remove button |
| Quantity on the product page | Applies to the main product only | Counts whole kits: every piece is multiplied |
| Recipients page | Each piece can go to anyone | The kit is one gift. Each recipient gets a number of whole kits; it cannot be split |
| Checkout, emails, orders | One line per piece | Still one line per piece, each marked **Bundle: kit name** so the warehouse knows they go in one box |
| Prices and discounts | Unchanged | Unchanged: the kit costs what its pieces cost |

The add-ons row on the recipients page is not affected: anything added there
is a separate item that can go to any recipient, next to their kits.

### Switching it on for a product

1. **Once per Shopify store:** Settings > Custom data > Products > Add
   definition. Name **Add as one bundle**, namespace and key
   `custom.add_as_bundle`, type **True or false**, and turn on **Storefront
   access**.
2. **Per product:** open the product, set **Add as one bundle** to *True*,
   save. It shows on the storefront within a few minutes.

Adding the same kit twice (same wines, merch and message) raises its
quantity. A kit with different choices becomes a second, separate bundle.

---

## Good to know

- **United States addresses only**, and at most **25 recipients** per order.
- **States wine cannot ship to** show a message on that recipient, and
  Checkout stays locked until it is fixed.
- **Discount codes** are judged per recipient. A code with a minimum spend may
  apply to the cart as a whole but not to each recipient's share; the page
  says so when that happens.
- **Club pricing, store credit and gift cards** work, because payment happens
  on Shopify's normal payment page.
- **Gift message limits:** To 20 characters, From 20, Message 100.
- **Emails.** In the first test a logged-in buyer received one confirmation
  for the parent and one for each child. Recipients receive nothing from
  Shopify; shipping updates go to the buyer. Reducing this to one email is
  under review.
- **The payment page shows no product photos.** The parent's lines are plain
  text lines, so Shopify has no image for them.
- **The cart is not emptied** after paying.
- **Inventory** drops when the children are created, about a minute after
  payment, not when the shopper presses Checkout.

---

## Not tested yet

- Paying by card or gift card (the first test used store credit)
- A guest buyer, and which emails a guest receives
- The refund and cancel steps in this guide, on real orders
- How ShipHero treats each tag
- A B2B company buyer
- Safari on iPhone
- Corporate Wine Gift and Cuvigift

Update this guide as each one is confirmed.

---

## For developers

| What | Where |
| --- | --- |
| Recipients page | `app/routes/cart/recipients.tsx` |
| Page components | `app/components/multi-recipient/` |
| Shared types, tags and helpers | `app/utils/multi-recipient.ts` |
| Live pricing per recipient | `app/.server/multi-recipient-quote.ts`, `app/routes/api/multi-recipient-quote.ts` |
| Creating the draft orders and the payment link | `app/.server/multi-recipient-checkout.ts`, `app/routes/api/multi-recipient-checkout.ts` |
| Turning drafts into orders after payment | `app/.server/multi-recipient-split.ts`, `app/routes/api/multi-recipient-split.ts` |
| Admin API access | `app/.server/admin-api.ts` |
| Theme settings | `app/weaverse/schema.server.ts` (Cart group) |

Prices never come from the browser. Every figure is Shopify's own draft-order
calculation, the parent's total is checked against the children to the cent
before the shopper is sent to pay, and if anything fails every draft is
deleted so nothing is charged.
