# Entry form — setup and maintenance guide
Entry forms can be used for Enter to Win campaigns, newsletters, promotions.

The **Entry form** is a Weaverse section for sweepstakes entries, discount
signups and any other "give us your details" landing page. One submission
writes to three places:

1. a **Shopify customer** on the Wine Gift Shop store, with marketing consent
2. a **tag** on that customer plus the standard `facts.birth_date` metafield
3. a **Klaviyo profile**, subscribed to a list, carrying the birthday and the
   signup source

It is shared code, so it is available in the Weaverse editor on every
storefront. Adding a form to a new brand is configuration only — **no code
changes, no deploy.**

---

## 1. Where the code lives

| File | What it does |
| --- | --- |
| `app/sections/entry-form/index.tsx` | The section: fields, layout, all editor settings |
| `app/sections/entry-form/success-message.tsx` | The post-submission title and description, and their controls |
| `app/routes/api/entry-form.ts` | The endpoint at `/api/entry-form` — validation, Shopify, Klaviyo |
| `app/weaverse/components.ts` | Registration. `EntryForm` must appear in the import list **and** the exported array |
| `app/routes.ts` | `route("entry-form", "routes/api/entry-form.ts")` inside the `api` prefix |
| `env.d.ts` | Type declarations for the variables below |

---

## 2. Setting up a form on a new storefront

### Step 1 — Create the Klaviyo list

Create the list in Klaviyo and copy its **list ID** (the short code in the
list's URL, e.g. `XyZ123`).

> **Set the list to single opt-in.** With double opt-in, nobody appears on
> the list until they click a confirmation email, the list looks broken, and
> a list-triggered flow never fires. This has cost us an evening before.

### Step 2 — Set the storefront's variables

In the Shopify admin, open **Hydrogen → the storefront → Settings →
Environment variables**, and set them for both Preview and Production.

| Variable | Required? | What to put |
| --- | --- | --- |
| `KLAVIYO_PRIVATE_API_TOKEN` | Yes | Private API key for the Klaviyo account. Same key across brands that share one Klaviyo account |
| `KLAVIYO_ENTRY_LIST_ID` | Yes | The list ID from step 1 |
| `SHOPIFY_APP_CLIENT_ID` | For tags + birth date | Client ID of the Admin app (see §4) |
| `SHOPIFY_APP_CLIENT_SECRET` | For tags + birth date | Client secret of the same app |
| `SHOPIFY_ADMIN_API_TOKEN` | Legacy only | Permanent token from an old custom app. If set, it is used instead of the client ID/secret |

> **The most common mistake:** forgetting the two `SHOPIFY_APP_*` variables.
> Without them the Shopify tag and birth date step is skipped **silently** —
> Klaviyo fills up normally, the customer is created, but no tag and no
> birthday are written, and nothing on the page says so. If tags are missing,
> check these first.

If `KLAVIYO_ENTRY_LIST_ID` is not set, the endpoint falls back to
`KLAVIYO_CAMPAIGN_LIST_ID`, then `KLAVIYO_LIST_ID`. That is a safety net, not
a plan — set the entry list explicitly, or entries can land on the general
newsletter list.

Redeploy the storefront after changing variables. Oxygen reads them at boot.

### Step 3 — Build the page

In Weaverse Studio, on that storefront's project, create the page and add the
**Entry form** section. Then set:

- **Klaviyo → Source tag** — the campaign tag, e.g.
  `Klaviyo: Barry Manilow - Obbligato`. This one string becomes the Shopify
  customer tag, the Klaviyo profile property `Signup Source`, and the
  subscription's `custom_source`. Use it to segment real entrants and to keep
  suppression rules from catching them.
- **Klaviyo → Klaviyo list ID override** — leave **empty**. Only fill it in
  when a single storefront needs two forms pointing at two different lists.
- **Content → Date of birth field** — `Three dropdowns` is best on mobile
  (it opens the phone's native scroller). `Three typed boxes` for people who
  prefer typing. `Single date picker` is the browser's own, and looks
  different in every browser.
- The heading and intro text are **child blocks** (Heading / Paragraph /
  Subheading), so they carry the theme's usual typography controls.
- **After submission** — Title and Description, each with its own controls.
  Turn **Keep heading and text** off if the page heading should disappear
  once an entry is accepted.

### Step 4 — Test before announcing

Submit one real entry and confirm all three:

- Shopify → Customers → the new customer exists, carries the source tag, and
  shows the birth date under Metafields (`facts.birth_date`)
- Klaviyo → the list has the profile, with `Date of Birth`, `Birthday` and
  `Signup Source`
- The flow (if any) sent its email

> Allowlist your test address in Klaviyo first. Repeated signups from one IP
> trip Klaviyo's **Bot Protection**, which auto-suppresses the profile. It
> looks exactly like a bug in our code and is not one; it cannot be turned
> off, so clear the office IP with Klaviyo support before a launch.

---

## 3. The honeypot

The form includes a hidden field named **`company`**, positioned off-screen
at `left: -10000px`, with `tabIndex={-1}` and `autoComplete="off"`. Humans
never see it; bots that fill every field in the DOM do.

When `company` arrives with any value, the endpoint **returns success and
stores nothing** — no Shopify customer, no Klaviyo profile. Returning success
rather than an error stops the bot learning it was caught.

Consequences worth knowing:

- Spam entries are invisible. There is no counter and no log line. If entry
  numbers seem low, that may be why.
- Never rename the field to something a password manager would autofill
  (`company`, as used, is safe because of `autoComplete="off"`, but
  `address`, `phone` or `organization` would not be).

---

## 4. The Shopify Admin app

Tagging a customer and writing a metafield needs the **Admin** API, which the
storefront token cannot do.

Shopify stopped issuing legacy custom apps on **1 January 2026**, so new
setups use an app created in the **Shopify Dev Dashboard**:

1. Create the app, install it on the Wine Gift Shop store.
2. Give it the `read_customers` and `write_customers` scopes.
3. Copy its **Client ID** and **Client secret** into the storefront variables.

One app covers every storefront, because all 60+ Hydrogen storefronts sit on
the same Shopify store. Only the variables are per storefront.

The endpoint exchanges the client ID and secret for a 24-hour token through
the **client credentials grant** (`POST /admin/oauth/access_token`,
form-urlencoded) and caches it per worker isolate until just before it
expires. Nothing to maintain.

### The one thing that does need maintenance

```ts
const ADMIN_API_VERSION = "2026-10";
```

in `app/routes/api/entry-form.ts`. Shopify supports an Admin API version for
roughly a year, and a request to a retired version is **rejected outright**.
When tags silently stop being written and the variables are definitely set,
this is the next thing to check. Bump it to a current version listed in the
Dev Dashboard.

---

## 5. What happens on submit

1. **Honeypot** — `company` filled? Return `{ ok: true }`, store nothing.
2. **Required fields** — first name, last name, email, date of birth. Any
   missing: "Please fill in every field."
3. **Date parse** — invalid date: "Please enter a valid date of birth."
4. **Age gate** — under 21 is rejected server-side. `MINIMUM_AGE` is
   hardcoded, not taken from the form, so it cannot be bypassed by editing
   the page before submitting.
5. **Shopify customer** — created through the Storefront API with
   `acceptsMarketing: true` and a `crypto.randomUUID()` password (the entrant
   never signs in with it; they would use password reset). An email that
   already exists is **not** an error — they are still a valid entrant.
6. **Tag + birth date** — via the Admin API, using `tagsAdd`. Note:
   `CustomerInput.tags` *overwrites* every existing tag, which is why it is
   not used. Skipped silently if no Admin credentials.
7. **Klaviyo** — two calls, in this order, because the subscription endpoint
   accepts only email/phone/subscriptions:
   - `profile-import` — upserts the profile with names and properties
   - `profile-subscription-bulk-create-jobs` — subscribes it to the list

Failures in steps 6 and 7 are logged but do not fail the submission: the
entrant still sees the success message. Check the storefront's Oxygen logs
for `Klaviyo ... failed: HTTP ...` or `Admin API enrichment errors`.

---

## 6. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Klaviyo list stays empty | List is on **double opt-in** |
| Profile appears but is suppressed | Klaviyo **Bot Protection** from repeated testing on one IP |
| Customer created, but no tag and no birth date | `SHOPIFY_APP_CLIENT_ID` / `SECRET` missing, or `ADMIN_API_VERSION` is out of support |
| Entries land on the wrong list | `KLAVIYO_ENTRY_LIST_ID` unset, so the fallback chain picked the newsletter list. The target list ID is printed in the logs on every submission |
| Flow does not fire for a repeat entrant | *Added to list* only triggers the first time. Already on the list = no second email |
| Nothing at all happens on submit | Check the browser network tab for the POST to `/api/entry-form` |

---

## 7. Changing the form itself (code)

These need a PR against the shared theme, so they affect every storefront —
keep anything new **opt-in**, gated behind a setting whose default reproduces
today's behaviour.

- **Field labels, widths, colours, button colours** — already settings. No
  code needed.
- **Make date of birth optional** — currently required on both the client and
  the server, with the 21+ gate. A brand that does not need a birthday needs
  a new toggle and a matching branch in the endpoint's validation.
- **Change the minimum age** — `MINIMUM_AGE` in the endpoint.
- **Add a field** — add the input in `index.tsx`, read it from `formData` in
  the endpoint, and decide where it goes (Shopify metafield, Klaviyo
  property, or both).

---

## 8. Quick reference

```
Endpoint         POST /api/entry-form
Section type     entry-form
Honeypot field   company
Age minimum      21 (server-side, hardcoded)
Metafield        facts.birth_date  (type: date)
Klaviyo props    Date of Birth, Birthday, Signup Source
Admin scopes     read_customers, write_customers
```

| Variable | Scope |
| --- | --- |
| `KLAVIYO_PRIVATE_API_TOKEN` | Per Klaviyo account |
| `KLAVIYO_ENTRY_LIST_ID` | Per storefront / per campaign |
| `SHOPIFY_APP_CLIENT_ID` | Same value, set on each storefront |
| `SHOPIFY_APP_CLIENT_SECRET` | Same value, set on each storefront |
| `SHOPIFY_ADMIN_API_TOKEN` | Legacy custom apps only |
