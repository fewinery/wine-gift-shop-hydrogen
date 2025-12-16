# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Pilot** (v7.1.0), a production-ready Shopify Hydrogen theme powered by Weaverse - a visual page builder for Hydrogen storefronts. Built with React 19.2.0, TypeScript 5.9.3, React Router 7.9.4, and Tailwind CSS v4.1.16. Runs on Node.js 20+ and uses Biome 2.2.7 for linting/formatting.

**Important**: This project uses React Router v7, NOT Remix. Always import from `'react-router'` not `'react-router-dom'`.

## Essential Commands

### Development
```bash
npm run dev        # Start development server on port 3456
npm run dev:ca     # Start with customer account push (unstable)
npm run build      # Production build with GraphQL codegen
npm run preview    # Preview production build
npm start          # Start production server
npm run clean      # Clean all build artifacts and dependencies
```

### Code Quality (Always run before committing)
```bash
npm run biome      # Check for linting/formatting errors
npm run biome:fix  # Fix linting/formatting errors
npm run format     # Format code with Biome
npm run typecheck  # Run TypeScript type checking
```

### Testing
```bash
npm run e2e                          # Run all Playwright E2E tests
npm run e2e:ui                       # Run tests with UI mode
npx playwright test tests/cart.test.ts  # Run specific test file
npx playwright test --debug          # Run tests in debug mode
```

### GraphQL
```bash
npm run codegen    # Generate TypeScript types from GraphQL queries
```

## Architecture Overview

### Route Structure
Routes are organized in subdirectories under `app/routes/`:
- `home.tsx` - Homepage
- `products/` - Product detail pages
- `collections/` - Collection listing pages
- `account/` - Customer account pages
- `api/` - API endpoints
- `cart/` - Cart operations
- `pages/` - Custom pages
- `policies/` - Policy pages
- `blogs/` - Blog functionality
- `wine-clubs/` - Winehub wine club integration
- `search/` - Search functionality
- `seo/` - SEO routes (robots.txt, sitemap.xml)
- `catch-all.tsx` - 404 handler

All route files support internationalization via locale handling in `app/.server/root.ts`.

### Key Architectural Patterns

1. **Parallel Data Loading**: Every page route loads Weaverse data alongside GraphQL queries using `Promise.all()`:
   ```typescript
   const [{ shop, product }, weaverseData, productReviews] = await Promise.all([
     storefront.query(PRODUCT_QUERY, { variables }),
     weaverse.loadPage({ type: "PRODUCT", handle }),
     getJudgeMeProductReviews({ context, handle }),
   ]);
   ```

2. **Component Structure**:
   - `/app/sections/` - Weaverse visual builder sections with schema exports and optional loaders
   - `/app/components/` - Reusable UI components organized by feature (cart/, product/, layout/, customer/)
   - `/app/weaverse/` - Weaverse configuration (components.ts, schema.server.ts, style.tsx, csp.ts)
   - `/app/.server/` - Server-side utilities (context.ts, root.ts, seo.ts, redirect.ts)
   - `/app/graphql/` - GraphQL queries and fragments
   - `/app/utils/` - Helper functions and utilities
   - `/app/hooks/` - Custom React hooks
   - Each Weaverse section must export: default component + schema + optional loader

3. **Data Fetching**:
   - GraphQL fragments in `/app/graphql/fragments.ts`
   - Complete queries in `/app/graphql/queries.ts`
   - Route loaders handle all data fetching server-side
   - Use `routeHeaders` for consistent cache control

4. **Styling**:
   - Tailwind CSS v4 with custom utilities
   - class-variance-authority (cva) for component variants
   - Use the `cn()` utility from `/app/utils/cn.ts` for class merging
   - Global styles in `/app/styles/`

5. **Type Safety**:
   - GraphQL types are auto-generated via codegen
   - Path alias `~/` maps to `/app/` directory
   - TypeScript strict mode disabled for compatibility
   - Two separate codegen outputs:
     - `storefront-api.generated.d.ts` - For all storefront queries (excludes account routes)
     - `customer-account-api.generated.d.ts` - For customer account queries (only in `*.account*.{ts,tsx,js,jsx}` files)

### Important Integrations

- **Weaverse**: Visual page builder - sections must be registered in `/app/weaverse/components.ts`
- **Judge.me**: Product reviews integration via utilities in `/app/utils/judgeme.ts`
- **Klaviyo**: Email marketing integration for newsletters and campaigns
- **Combined Listings**: Intelligent product grouping system via utilities in `/app/utils/combined-listings.ts`
- **Winehub**: Wine club integration with headless API - routes in `/app/routes/wine-clubs/`
- **Analytics**: Shopify Analytics and Google Tag Manager integration
- **Customer Accounts**: New Shopify Customer Account API support (OAuth-based)
- **Shopify Inbox**: Customer chat support integration
- **Radix UI**: For accessible UI primitives (accordion, dialog, dropdown, etc.)
- **Swiper**: For carousel/slideshow functionality
- **Framer Motion**: For animations and transitions

### Weaverse Section Development

1. **Creating a New Section** (React 19):
   ```typescript
   // app/sections/my-section/index.tsx
   import { createSchema, type HydrogenComponentProps, type ComponentLoaderArgs } from '@weaverse/hydrogen';

   interface MyProps extends HydrogenComponentProps {
     ref: React.Ref<HTMLElement>;
     heading: string;
     loaderData?: any; // Data from server-side loader
   }

   export default function MySection(props: MyProps) {
     const { ref, heading, loaderData, ...rest } = props;
     // Component implementation
     // Access loader data via props.loaderData

     return (
       <section ref={ref} {...rest}>
         <h2>{heading}</h2>
       </section>
     );
   }

   export const schema = createSchema({
     type: 'my-section',
     title: 'My Section',
     settings: [
       {
         group: 'Content',
         inputs: [
           {
             type: 'text',
             name: 'heading',
             label: 'Heading',
             defaultValue: 'Default Heading'
           }
         ]
       }
     ]
   });

   // Optional loader for server-side data fetching
   export const loader = async ({ weaverse, data }: ComponentLoaderArgs) => {
     // Access Shopify Storefront API
     const result = await weaverse.storefront.query(QUERY, { variables });
     // Access component settings via data parameter
     // Return data to be available as props.loaderData
     return result.data;
   };
   ```

2. **Register in `/app/weaverse/components.ts`**:
   ```typescript
   import * as MySection from "~/sections/my-section";
   export const components = [
     // ... existing components
     MySection,
   ];
   ```

3. **Component Loader Pattern**:
   - Loaders run on the server-side for each component instance
   - Access Shopify API via `weaverse.storefront.query()`
   - Access component settings via `data` parameter
   - Return value becomes available as `props.loaderData`
   - Great for fetching product data, collections, metafields, etc.

### Route Data Loading Pattern

```typescript
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { handle } = params;
  invariant(handle, "Missing handle param");

  const { storefront, weaverse } = context;

  // Parallel data loading
  const [shopifyData, weaverseData, thirdPartyData] = await Promise.all([
    storefront.query(QUERY, { variables }),
    weaverse.loadPage({ type: "PAGE_TYPE", handle }),
    fetchThirdPartyData(),
  ]);

  // Handle errors
  if (!shopifyData.resource) {
    throw new Response("Not found", { status: 404 });
  }

  return data({
    shopifyData,
    weaverseData,
    thirdPartyData,
  });
}
```

### Theme Settings & Schema

Weaverse provides global theme settings defined in `app/weaverse/schema.server.ts`. This includes:
- **Layout**: Page width, navigation heights
- **Colors**: Background, text, buttons, badges
- **Typography**: Heading/body sizes, spacing, line height
- **Product Cards**: Image settings, content display, quick shop, badges
- **Animations**: Reveal-on-scroll effects
- **Newsletter Popup**: Timing, positioning, content

Theme settings are loaded in the root loader:
```typescript
export async function loader({ context }: LoaderFunctionArgs) {
  return defer({
    weaverseTheme: await context.weaverse.loadThemeSettings(),
  });
}
```

Access theme settings in components:
```typescript
import { useThemeSettings } from '@weaverse/hydrogen';

function MyComponent() {
  const settings = useThemeSettings();
  // Use settings.logo, settings.colors, etc.
}
```

The `App` component must be wrapped with `withWeaverse` HOC in `root.tsx`:
```typescript
import { withWeaverse } from '@weaverse/hydrogen';

function App() { /* ... */ }

export default withWeaverse(App);
```

### Weaverse Context Integration

The `weaverse` client is injected into the app context in `app/.server/context.ts`:

```typescript
import { WeaverseClient } from '@weaverse/hydrogen';
import { components } from '~/weaverse/components';
import { themeSchema } from '~/weaverse/schema.server';

const hydrogenContext = createHydrogenContext({
  env,
  request,
  cache,
  waitUntil,
  session,
  i18n: getLocaleFromRequest(request),
  cart: {
    queryFragment: CART_QUERY_FRAGMENT,
  },
});

return {
  ...hydrogenContext,
  weaverse: new WeaverseClient({
    ...hydrogenContext,
    request,
    cache,
    themeSchema,
    components,
  }),
};
```

This makes `weaverse` available in:
- Route loaders: `context.weaverse.loadPage()`
- Theme settings: `context.weaverse.loadThemeSettings()`
- Component loaders: `weaverse.storefront.query()`

### Combined Listings Integration

Combined Listings allow intelligent product grouping and filtering:

```typescript
// Use utility functions from app/utils/combined-listings.ts
import { isCombinedListing, shouldFilterCombinedListings } from '~/utils/combined-listings';

// In product queries and loaders
const filteredProducts = products.filter(product =>
  !shouldFilterCombinedListings(product, settings)
);

// In components
if (isCombinedListing(product)) {
  // Handle combined listing display differently
}
```

Key integration points:
- Product loaders filter combined listings based on settings
- Cart functionality handles combined products specially
- Product display components check for combined listing status
- Featured products support both collection-based and manual selection

### Environment Configuration

Required environment variables are defined in `env.d.ts` and `.env.example`:

**Required**:
- `SESSION_SECRET` - Session encryption key
- `PUBLIC_STORE_DOMAIN` - Shopify store domain
- `PUBLIC_STOREFRONT_API_TOKEN` - Shopify Storefront API token
- `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` - Customer Account API client ID
- `SHOP_ID` - Shopify shop ID
- `PUBLIC_CHECKOUT_DOMAIN` - Checkout domain
- `WEAVERSE_PROJECT_ID` - Weaverse project identifier

**Optional**:
- `PUBLIC_STOREFRONT_ID` - Storefront ID for analytics
- `WEAVERSE_API_KEY` - Weaverse API key for custom integrations
- `WEAVERSE_HOST` - Custom Weaverse Studio URL (default: https://studio.weaverse.io)
- `WEAVERSE_API_BASE` - Custom Weaverse API URL (default: https://api.weaverse.io)
- `PUBLIC_GOOGLE_GTM_ID` - Google Tag Manager ID
- `JUDGEME_PRIVATE_API_TOKEN` - Judge.me reviews API token
- `KLAVIYO_PRIVATE_API_TOKEN` - Klaviyo email marketing API token
- `WINEHUB_API_BASE` - Winehub headless API for wine club features
- `METAOBJECT_COLORS_TYPE` - Custom color metaobject type
- `CUSTOM_COLLECTION_BANNER_METAFIELD` - Custom collection banner metafield
- `PUBLIC_SHOPIFY_INBOX_SHOP_ID` - Shopify Inbox shop ID for chat support

The project uses `@shopify/hydrogen` and `@shopify/remix-oxygen` for environment handling.

### Testing Strategy

- E2E tests use Playwright and are located in `/tests/`
- Tests run against `localhost:3000` using production build (`npm run preview`)
- Playwright automatically starts the preview server before running tests
- Focus on critical user flows: cart operations, checkout process
- Run individual tests: `npx playwright test tests/cart.test.ts`

### Performance Optimizations

- **Server Warmup**: Vite pre-warms routes, sections, and components on dev server start for faster initial loads
- **SSR Optimizations**: Pre-bundled dependencies in `vite.config.ts` include typography utilities, Radix UI primitives, and common libraries
- **Build Configuration**: Assets are not inlined as base64 to support strict Content Security Policy
- **GraphQL Codegen**: Separate type generation for Storefront and Customer Account APIs reduces bundle size

### Biome Configuration

The project extends from `ultracite` and `@weaverse/biome` configurations with these customizations:
- Double quotes for strings
- Semicolons always
- Trailing commas
- Max cognitive complexity: 50
- Disabled rules: `noExplicitAny`, `noConsole`, `noParameterAssign`, `noMagicNumbers`, `noNestedTernary`
- File naming conventions disabled for flexibility
- Namespace imports allowed (`noNamespaceImport` off)

## Code Conventions

- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for files, ALL_CAPS for constants
- **Formatting**: 2 spaces indentation, double quotes, semicolons, trailing commas
- **TypeScript**: Always type function parameters and returns, avoid `any`, use interfaces for data structures
- **React**: Functional components with hooks only, small focused components
- **React 19**: Use `ref` prop directly instead of `forwardRef` (deprecated in React 19)
- **Async**: Use async/await, proper error handling with try/catch
- **Imports**: Use `~/` path alias for app directory imports

## Development Tools

When running `npm run dev`, access these helpful tools:
- **Development server**: http://localhost:3456
- **GraphiQL API browser**: http://localhost:3456/graphiql (explore Shopify Storefront API)
- **Network inspector**: http://localhost:3456/debug-network (debug API calls)
- **Weaverse Studio**: Access through your Shopify admin dashboard

## Common Pitfalls to Avoid

1. **GraphQL Codegen**: Always run `npm run codegen` after modifying GraphQL queries/fragments
2. **Weaverse Registration**: New sections must be registered in `/app/weaverse/components.ts`
3. **Route Caching**: Use `routeHeaders` export for consistent cache control
4. **Customer Account Queries**: Only use in `*.account*.{ts,tsx}` files
5. **Parallel Loading**: Always use `Promise.all()` for multiple data fetches in loaders
6. **Type Safety**: Never use `any` type, properly type all Weaverse section props
7. **React Router Imports**: Import from `'react-router'` not `'react-router-dom'`
8. **React 19 Refs**: Use `ref` prop directly (not `forwardRef`) for Weaverse sections
9. **Test Port Mismatch**: Dev server uses port 3456, but E2E tests expect port 3000 (use `npm run preview`)
10. **Component Namespaces**: Register sections as namespace imports: `import * as MySection from "~/sections/my-section"`
11. **Combined Listings**: Use utility functions from `/app/utils/combined-listings.ts` for product filtering and grouping logic
12. **Package Manager**: Use npm (not pnpm) - the project is configured for npm package management

## Development Setup Requirements

### Node.js and Dependencies
- **Node.js**: Version 20.0.0 or higher required
- **Package Manager**: npm (configured in package.json)
- **Environment**: Copy `.env.example` to `.env` and configure Shopify store credentials

### Key Configuration Files
- **react-router.config.ts**: React Router v7 configuration (SSR enabled, app directory structure, Hydrogen preset)
- **vite.config.ts**: Includes Hydrogen, Oxygen, Tailwind CSS v4, and development server warmup for routes/sections/components
- **biome.json**: Code quality configuration extending from `ultracite` and `@weaverse/biome`
- **codegen.ts**: GraphQL code generation with separate outputs for Storefront API and Customer Account API
- **tsconfig.json**: TypeScript config with `~/` path alias, strict mode disabled for compatibility
- **playwright.config.ts**: E2E test configuration
- **env.d.ts**: TypeScript environment variable definitions and type augmentations
- **app/root.tsx**: Root React component with Weaverse HOC wrapper
- **app/routes.ts**: Route manifest for React Router
- **app/entry.client.tsx**: Client-side entry point for React hydration
- **app/entry.server.tsx**: Server-side entry point for SSR

## Tech Stack

- **Framework**: React 19.2.0 with React Router 7.9.4
- **Shopify**: Hydrogen 2025.7.0, Oxygen Workers
- **Weaverse**: @weaverse/hydrogen 5.6.0
- **Styling**: Tailwind CSS 4.1.16 with class-variance-authority
- **UI Components**: Radix UI primitives
- **TypeScript**: 5.9.3 with GraphQL codegen
- **Code Quality**: Biome 2.2.7
- **Testing**: Playwright E2E tests
- **Animation**: Framer Motion 12.23.24
- **Carousel**: Swiper 12.0.3

## Active Technologies
- TypeScript 5.9.3, React 19.2.0, React Router v7.9.4 + @weaverse/hydrogen 5.6.0, @shopify/hydrogen 2025.7.0, @shopify/remix-oxygen 2025.7.0 (002-builderio-weaverse-migration)
- PlanetScale (existing, no schema changes), CDN cache for Winehub API responses (002-builderio-weaverse-migration)

## Recent Changes
- 002-builderio-weaverse-migration: Added TypeScript 5.9.3, React 19.2.0, React Router v7.9.4 + @weaverse/hydrogen 5.6.0, @shopify/hydrogen 2025.7.0, @shopify/remix-oxygen 2025.7.0
