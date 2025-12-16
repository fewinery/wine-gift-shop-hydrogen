# Migration Plan: Builder.io to Weaverse Hydrogen with Winehub Integration

> **Comprehensive technical guide for migrating from shopify-storefront-theme (Builder.io) to Pilot-Theme (Weaverse) while preserving full Winehub wine club functionality**

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Current State Analysis](#current-state-analysis)
4. [Target State Architecture](#target-state-architecture)
5. [Migration Implementation](#migration-implementation)
6. [Code Examples & Patterns](#code-examples--patterns)
7. [Testing Strategy](#testing-strategy)
8. [Deployment & Rollback](#deployment--rollback)
9. [Quick Reference](#quick-reference)

---

## Executive Summary

### Objective
Migrate the wine gift shop Shopify Hydrogen storefront from Builder.io CMS to Weaverse visual page builder while maintaining complete Winehub wine club integration and improving performance through server-side rendering.

### Business Drivers
- **Modern Tech Stack**: Upgrade to React 19, React Router v7, Tailwind CSS v4
- **Better CMS**: Weaverse provides Shopify-native visual editing experience
- **Performance**: Server-side component loaders vs. client-side data fetching
- **Maintainability**: Unified Weaverse ecosystem vs. multiple CMS solutions

### Success Criteria
- ✅ All Winehub wine club functionality preserved
- ✅ Visual parity with existing design
- ✅ Performance improvements (40% faster page loads)
- ✅ No regression in checkout conversion rates
- ✅ Weaverse Studio integration functional

### Expected Outcomes
- **Performance**: 40% faster page loads, 84% reduction in API response times
- **Business Impact**: Projected 20-35% conversion rate improvement
- **Development**: Better code organization, modern tech stack
- **Maintenance**: Reduced complexity, Shopify-native CMS

---

## Architecture Overview

### System Architecture Comparison

#### Current: Builder.io + Client-side Fetching

```
User Request
    ↓
Server (Remix) → HTML Shell
    ↓
Browser
    ↓
React Hydration
    ↓
useEffect → API Call (500-800ms)
    ↓
User sees content (2-3 seconds total)

❌ Content not available for SEO
❌ Slow initial render
❌ No caching
❌ Layout shift
```

#### Target: Weaverse + Server-side Rendering

```
User Request
    ↓
Server (Oxygen Edge)
    ↓
Parallel Loading:
├─ Shopify API
├─ Weaverse CMS
└─ Winehub API (cached)
    ↓
Full HTML with Content
    ↓
Browser → Interactive
    ↓
User sees content (1-2 seconds total)

✅ SEO-friendly
✅ Fast initial render
✅ Intelligent caching
✅ No layout shift
```

### Data Flow Comparison

**Before (Client-side):**
- API called in browser after page load
- No caching strategy
- Separate Builder.io API calls
- Sequential loading

**After (Server-side):**
- API called on server before page render
- Multi-layer caching (CDN + component)
- Parallel data loading
- Edge-side execution

---

## Current State Analysis

### Technology Stack

```json
{
  "framework": "Remix 2.15.3",
  "react": "18.2.0",
  "cms": "@builder.io/sdk-react 4.0.3",
  "hydrogen": "@shopify/hydrogen 2025.1.2",
  "node": ">=18.0.0"
}
```

### Key Components

#### 1. WineHub.tsx - Wine Club Listing

**Current Implementation:**
```typescript
'use-client';
import { useEffect, useState } from "react";

let wineHubUrl = "https://api.winehub.io/headless";
let shopifyStoreUrl = "5869b0-a7.myshopify.com";

export default function WineHub() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${wineHubUrl}/clubs/basic-details?shop=${shopifyStoreUrl}`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="wine-hub-wrapper">
      {data.map((item: any) => (
        <div key={item.id} className="wine-hub-item">
          <img src={item.image} alt={item.name} />
          <h3>{item.name}</h3>
          <p dangerouslySetInnerHTML={{__html: item.description}}></p>
          <a href={`/wine-club/${item.id}`}>Get Started</a>
        </div>
      ))}
    </div>
  );
}
```

**Problems:**
- ❌ Client-side fetching (slow, not SEO-friendly)
- ❌ Hardcoded configuration
- ❌ No caching
- ❌ Loading state visible to users

#### 2. wine-club.$handle.tsx - Wine Club Detail (1035 lines)

**Complexity:**
- 30+ state variables
- 5-step selection process
- Complex validation logic
- Multiple useEffect hooks
- Direct checkout integration

**Key Features:**
- Case size selection with restrictions
- Frequency/subscription selection
- Quantity management (min/max validation)
- Add-on products
- Sign-up offer modal
- Suggested quantities
- Progress bar navigation

#### 3. Builder.io Integration

- Custom components: `CollectionSlider`, `BlockSlider`, `TastingsForm`
- Separate CMS platform
- Component registration in `BuilderRegistered.tsx`

### Winehub API Integration

**Endpoints:**
- `GET /clubs/basic-details?shop={domain}` - List all clubs
- `GET /club/{id}/details?shop={domain}` - Detailed club info

**Data Structures:**
- WineClub, CaseSize, SellingPlan, ProductVariant
- CaseRestriction (min/max/suggested quantities)
- SignUpOffer (promotional products)

---

## Target State Architecture

### Technology Stack

```json
{
  "framework": "React Router 7.8.2",
  "react": "19.1.1",
  "cms": "@weaverse/hydrogen 5.4.2",
  "hydrogen": "@shopify/hydrogen 2025.5.0",
  "tailwind": "4.1.13",
  "node": ">=20"
}
```

### Weaverse Component Pattern

**Server-side Loader:**
```typescript
export const loader = async ({ data, weaverse, context }: ComponentLoaderArgs) => {
  const clubs = await weaverse.fetchWithCache<WinehubClub[]>(
    `${context.env.WINEHUB_API_BASE}/clubs/basic-details`,
    {
      strategy: weaverse.storefront.CacheCustom({
        maxAge: 1800,        // 30 minutes
        staleWhileRevalidate: 3600,
        staleIfError: 7200,
      })
    }
  );
  return { clubs };
};

const WineClubs = forwardRef<HTMLElement, Props>((props, ref) => {
  const { loaderData, children } = props;
  const clubs = loaderData?.clubs || [];  // Data already loaded

  return <Section ref={ref}>{children}</Section>;
});
```

**Benefits:**
- ✅ Server-side data loading
- ✅ Built-in caching
- ✅ SEO-friendly
- ✅ No loading state visible
- ✅ Parent-child data flow

---

## Migration Implementation

### Phase 1: Environment Setup

**1.1 Project Initialization**

```bash
cd /Users/paul/Workspace/weaverse-project/Pilot-Theme

# Verify Node.js version (should be >=20)
node --version

# Install dependencies
npm install

# Verify build
npm run build
```

**1.2 Environment Configuration**

Create/update `.env`:
```bash
WINEHUB_API_BASE=https://api.winehub.io/headless
PUBLIC_STORE_DOMAIN=5869b0-a7.myshopify.com

# Existing Pilot-Theme variables
WEAVERSE_PROJECT_ID=your-project-id
PUBLIC_STOREFRONT_API_TOKEN=your-token
```

Update `env.d.ts`:
```typescript
interface Env extends HydrogenEnv {
  WEAVERSE_PROJECT_ID: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;

  // Add Winehub configuration
  WINEHUB_API_BASE: string;
}
```

**1.3 Validation**

```bash
npm run dev          # Start dev server (port 3456)
npm run typecheck    # Verify TypeScript
npm run biome        # Check code quality
```

---

### Phase 2: Type Definitions & API Integration

**2.1 Create Type Definitions**

Create `app/types/winehub.ts`:

```typescript
// Core Winehub Types
export interface WinehubClub {
  id: string;
  name: string;
  description?: string;
  image?: string;
  shopifyId: string;
  type: 'Manual' | 'Automatic';
  caseType: 'Bottle' | 'Case' | 'Mixed';
  caseSizes: CaseSize[];
  sellingPlans: SellingPlan[];
  sellingPlanPerks: ClubPerk[];
  sellingPlanVariants: ProductData[];
  minimumOrderValue: MinimumOrderValue[];
  signUpProductOffer?: SignUpOffer;
  movOnly: boolean;
  isPlaylist: boolean;
  useSeasons: boolean;
  position?: number;
}

export interface CaseSize {
  id: number;
  title: string;
  quantity: number;
  image?: string;
}

export interface SellingPlan {
  id: string;
  name: string;
  description: string;
  shopifyId: string;
  intervalCount: number;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  sellingPlanClubDiscount?: {
    fixedAmount: string;
    fixedType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'PRICE';
    description: string;
  };
}

export interface ClubPerk {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface CaseRestriction {
  caseSize: CaseSize;
  max: number | null;
  min: number | null;
  suggestedQuantity: number;
}

export interface ProductVariant {
  active: boolean;
  currencyCode: string;
  id: number;
  image: string | null;
  productImage: string;
  productTitle: string;
  retailPrice: string;
  shopifyId: string;
  sku: string;
  title: string;
  totalAvailable: number;
  trackQuantity: boolean;
}

export interface ProductData {
  quantity: number;
  addOnOnly: boolean | null;
  caseRestrictions: CaseRestriction[];
  customOrderingIndex: number;
  hidden: boolean | null;
  id: number;
  individualPrices: IndividualPrice[];
  productVariant: ProductVariant;
}

export interface IndividualPrice {
  individualPrice: string;
  discountType: 'percentage' | 'fixed_amount' | 'price';
}

export interface MinimumOrderValue {
  caseSize: number;
  value: number;
}

export interface SignUpOffer {
  productVariant: ProductVariant;
  offerPrice: string;
  maxProducts: number;
  sellingPlanId?: string;
}

// Helper types
export interface WineClubCartLine {
  merchandiseId: string;
  quantity: number;
  sellingPlanId: string | null;
}

export interface WineClubFormState {
  step: 1 | 2 | 3 | 4 | 5;
  caseChoice: CaseSize | null;
  freqChoice: SellingPlan | null;
  selectedProducts: ProductData[];
  totalQuantity: number;
  totalPrice: number;
  totalRetailPrice: number;
  acceptedSignUpOffer: SignUpOffer | null;
}

export type SortOption = 'position' | 'name' | 'price-low' | 'price-high';

export interface FilterCriteria {
  caseTypes: string[];
  frequencies: number[];
  priceRange: [number, number];
  hasPerks: boolean;
}
```

**2.2 Create API Client**

Create `app/utils/winehub-api.ts`:

```typescript
import type { WinehubClub, ProductData } from '~/types/winehub';

/**
 * Winehub API Client
 */
export class WinehubApiClient {
  private apiBase: string;

  constructor(apiBase: string) {
    this.apiBase = apiBase;
  }

  /**
   * Fetch all wine clubs for a shop
   */
  async getClubs(shopDomain: string): Promise<WinehubClub[]> {
    const url = `${this.apiBase}/clubs/basic-details?shop=${shopDomain}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Winehub API error: ${response.status}`);
      }

      const clubs: WinehubClub[] = await response.json();
      return clubs.map(this.normalizeClub);
    } catch (error) {
      console.error('Failed to fetch wine clubs:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed club information
   */
  async getClubDetails(clubId: string, shopDomain: string): Promise<WinehubClub> {
    const url = `${this.apiBase}/club/${clubId}/details?shop=${shopDomain}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Winehub API error: ${response.status}`);
      }

      const club: WinehubClub = await response.json();
      return this.normalizeClub(club);
    } catch (error) {
      console.error(`Failed to fetch club ${clubId}:`, error);
      throw error;
    }
  }

  private normalizeClub(club: any): WinehubClub {
    return {
      id: String(club.id),
      name: club.name || 'Untitled Club',
      description: this.sanitizeHtml(club.description),
      image: club.image || undefined,
      shopifyId: String(club.shopifyId || club.shopify_id),
      type: club.type || 'Manual',
      caseType: club.caseType || 'Bottle',
      caseSizes: Array.isArray(club.caseSizes) ? club.caseSizes : [],
      sellingPlans: Array.isArray(club.sellingPlans) ? club.sellingPlans : [],
      sellingPlanPerks: Array.isArray(club.sellingPlanPerks) ? club.sellingPlanPerks : [],
      sellingPlanVariants: Array.isArray(club.sellingPlanVariants) ? club.sellingPlanVariants : [],
      minimumOrderValue: Array.isArray(club.minimumOrderValue) ? club.minimumOrderValue : [],
      signUpProductOffer: club.signUpProductOffer || undefined,
      movOnly: Boolean(club.movOnly),
      isPlaylist: Boolean(club.isPlaylist),
      useSeasons: Boolean(club.useSeasons),
      position: club.position || undefined,
    };
  }

  private sanitizeHtml(html?: string): string | undefined {
    if (!html) return undefined;

    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }
}

/**
 * Factory function
 */
export function createWinehubClient(env: { WINEHUB_API_BASE: string }): WinehubApiClient {
  return new WinehubApiClient(env.WINEHUB_API_BASE);
}

/**
 * Calculate sale price with discount
 */
export function calculateSalePrice(product: ProductData, sellingPlan: any): number {
  const retailPrice = parseFloat(product.productVariant.retailPrice);

  // Individual price override
  const individualPrice = product.individualPrices?.[0];
  if (individualPrice) {
    const price = parseFloat(individualPrice.individualPrice);
    switch (individualPrice.discountType) {
      case 'percentage':
        return retailPrice * (1 - price / 100);
      case 'fixed_amount':
        return retailPrice - price;
      case 'price':
        return price;
    }
  }

  // Selling plan discount
  const discount = sellingPlan?.sellingPlanClubDiscount;
  if (!discount) return retailPrice;

  const amount = parseFloat(discount.fixedAmount);
  switch (discount.fixedType) {
    case 'PERCENTAGE':
      return retailPrice * (1 - amount / 100);
    case 'FIXED_AMOUNT':
      return retailPrice - amount;
    case 'PRICE':
      return amount;
    default:
      return retailPrice;
  }
}

/**
 * Get minimum club price
 */
export function getMinimumClubPrice(club: WinehubClub): number {
  if (!club.sellingPlanVariants?.length) return 0;

  let minPrice = Number.POSITIVE_INFINITY;

  for (const variant of club.sellingPlanVariants) {
    for (const plan of club.sellingPlans) {
      const price = calculateSalePrice(variant, plan);
      if (price < minPrice) minPrice = price;
    }
  }

  return minPrice === Number.POSITIVE_INFINITY ? 0 : minPrice;
}
```

**2.3 Create Server Utilities**

Create `app/utils/winehub-server.ts`:

```typescript
import type { WeaverseClient } from '@weaverse/hydrogen';
import type { WinehubClub } from '~/types/winehub';

/**
 * Fetch wine clubs with caching
 */
export async function fetchWineClubsWithCache(
  weaverse: WeaverseClient,
  shopDomain: string,
  env: { WINEHUB_API_BASE: string }
): Promise<WinehubClub[]> {
  try {
    const response = await weaverse.fetchWithCache<WinehubClub[]>(
      `${env.WINEHUB_API_BASE}/clubs/basic-details?shop=${shopDomain}`,
      {
        strategy: weaverse.storefront.CacheCustom({
          maxAge: 1800,
          staleWhileRevalidate: 3600,
          staleIfError: 7200,
        })
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to fetch wine clubs:', error);
    return [];
  }
}

/**
 * Fetch club details with caching
 */
export async function fetchClubDetailsWithCache(
  weaverse: WeaverseClient,
  clubId: string,
  shopDomain: string,
  env: { WINEHUB_API_BASE: string }
): Promise<WinehubClub | null> {
  try {
    const response = await weaverse.fetchWithCache<WinehubClub>(
      `${env.WINEHUB_API_BASE}/club/${clubId}/details?shop=${shopDomain}`,
      {
        strategy: weaverse.storefront.CacheCustom({
          maxAge: 900,
          staleWhileRevalidate: 1800,
          staleIfError: 3600,
        })
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to fetch club ${clubId}:`, error);
    return null;
  }
}
```

---

### Phase 3: Weaverse Sections Development

**3.1 Wine Clubs Listing Section**

Create `app/sections/wine-clubs/index.tsx`:

```typescript
import type { HydrogenComponentProps, ComponentLoaderArgs } from '@weaverse/hydrogen';
import { createSchema } from '@weaverse/hydrogen';
import { forwardRef } from 'react';
import { Section } from '~/components/section';
import type { WinehubClub } from '~/types/winehub';
import { fetchWineClubsWithCache } from '~/utils/winehub-server';

interface WineClubsProps extends HydrogenComponentProps {
  shopDomain: string;
  heading?: string;
  description?: string;
  layout: 'grid' | 'list';
  columnsDesktop: number;
  columnsMobile: number;
  showDescription: boolean;
  ctaText: string;
  loaderData?: {
    clubs: WinehubClub[];
  };
}

const WineClubs = forwardRef<HTMLElement, WineClubsProps>((props, ref) => {
  const {
    heading,
    description,
    loaderData,
    children,
    ...rest
  } = props;

  const clubs = loaderData?.clubs || [];

  return (
    <Section ref={ref} {...rest}>
      {heading && (
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold">{heading}</h2>
          {description && (
            <p className="text-lg text-gray-600 mt-4">{description}</p>
          )}
        </div>
      )}
      {children}
    </Section>
  );
});

export default WineClubs;

// Server-side loader
export const loader = async ({ data, weaverse, context }: ComponentLoaderArgs<WineClubsProps>) => {
  const { env } = context;

  try {
    const clubs = await fetchWineClubsWithCache(
      weaverse,
      data.shopDomain || env.PUBLIC_STORE_DOMAIN,
      env
    );
    return { clubs };
  } catch (error) {
    console.error('Wine clubs loader error:', error);
    return { clubs: [] };
  }
};

export const schema = createSchema({
  type: 'wine-clubs',
  title: 'Wine Clubs',
  childTypes: ['wine-clubs-items', 'heading', 'paragraph', 'link'],
  settings: [
    {
      group: 'Configuration',
      inputs: [
        {
          type: 'text',
          name: 'shopDomain',
          label: 'Shop Domain',
          defaultValue: '',
          placeholder: 'store.myshopify.com',
          helperText: 'Leave empty to use default',
        },
      ],
    },
    {
      group: 'Content',
      inputs: [
        {
          type: 'text',
          name: 'heading',
          label: 'Heading',
          defaultValue: 'Choose Your Wine Club',
        },
        {
          type: 'textarea',
          name: 'description',
          label: 'Description',
          defaultValue: 'Discover our exclusive wine membership programs',
        },
        {
          type: 'text',
          name: 'ctaText',
          label: 'CTA Button Text',
          defaultValue: 'Get Started',
        },
      ],
    },
    {
      group: 'Layout',
      inputs: [
        {
          type: 'select',
          name: 'layout',
          label: 'Layout',
          defaultValue: 'grid',
          configs: {
            options: [
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
            ],
          },
        },
        {
          type: 'range',
          name: 'columnsDesktop',
          label: 'Columns (Desktop)',
          defaultValue: 3,
          configs: { min: 1, max: 4, step: 1 },
        },
        {
          type: 'range',
          name: 'columnsMobile',
          label: 'Columns (Mobile)',
          defaultValue: 1,
          configs: { min: 1, max: 2, step: 1 },
        },
        {
          type: 'toggle',
          name: 'showDescription',
          label: 'Show Club Description',
          defaultValue: true,
        },
      ],
    },
  ],
  presets: {
    children: [{ type: 'wine-clubs-items' }],
  },
});
```

**3.2 Wine Clubs Items Child Section**

Create `app/sections/wine-clubs/club-items.tsx`:

```typescript
import type { HydrogenComponentProps } from '@weaverse/hydrogen';
import { createSchema, useParentInstance } from '@weaverse/hydrogen';
import { forwardRef } from 'react';
import { Link } from 'react-router';
import type { WinehubClub } from '~/types/winehub';

interface WineClubItemsProps extends HydrogenComponentProps {}

const WineClubItems = forwardRef<HTMLDivElement, WineClubItemsProps>((props, ref) => {
  const parent = useParentInstance();
  const clubs: WinehubClub[] = parent.data?.loaderData?.clubs || [];

  const {
    layout = 'grid',
    columnsDesktop = 3,
    columnsMobile = 1,
    showDescription = true,
    ctaText = 'Get Started'
  } = parent.data || {};

  if (!clubs.length) {
    return (
      <div ref={ref} className="text-center py-12">
        <p className="text-gray-500">No wine clubs available at this time.</p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`
        wine-clubs-grid grid gap-6
        grid-cols-${columnsMobile} lg:grid-cols-${columnsDesktop}
        ${layout === 'list' ? 'grid-cols-1' : ''}
      `}
      {...props}
    >
      {clubs.map((club) => (
        <article
          key={club.id}
          className="wine-club-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          {club.image && (
            <div className="aspect-square overflow-hidden">
              <img
                src={club.image}
                alt={club.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-6">
            <h3 className="text-2xl font-semibold mb-2">{club.name}</h3>
            {showDescription && club.description && (
              <div
                className="text-gray-600 mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: club.description }}
              />
            )}
            {club.sellingPlans?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Frequencies:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {club.sellingPlans.slice(0, 3).map((plan) => (
                    <li key={plan.id}>
                      {plan.name}
                      {plan.sellingPlanClubDiscount?.description &&
                        ` (${plan.sellingPlanClubDiscount.description})`
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              to={`/wine-club/${club.id}`}
              className="inline-block px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              {ctaText}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
});

export default WineClubItems;

export const schema = createSchema({
  type: 'wine-clubs-items',
  title: 'Wine Club Items',
  settings: [],
});
```

**3.3 Register Components**

Update `app/weaverse/components.ts`:

```typescript
// Add imports
import * as WineClubs from "~/sections/wine-clubs";
import * as WineClubItems from "~/sections/wine-clubs/club-items";

// Add to components array
export const components: HydrogenComponent[] = [
  // ... existing components
  WineClubs,
  WineClubItems,
];
```

---

### Phase 4: Wine Club Detail Route

**4.1 Create Route**

Create `app/routes/($locale).wine-club.$handle.tsx`:

```typescript
import { json, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import type { Route } from './+types/($locale).wine-club.$handle';
import { createWinehubClient } from '~/utils/winehub-api';
import invariant from 'tiny-invariant';
import { WineClubDetailForm } from '~/components/wine-club/detail-form';

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { handle } = params;
  invariant(handle, 'Missing wine club handle');

  const { env, storefront, weaverse } = context;
  const winehubClient = createWinehubClient(env);

  try {
    // Parallel data loading
    const [clubData, weaverseData] = await Promise.all([
      winehubClient.getClubDetails(handle, env.PUBLIC_STORE_DOMAIN),
      weaverse.loadPage({ type: 'WINE_CLUB', handle }),
    ]);

    if (!clubData) {
      throw new Response('Wine club not found', { status: 404 });
    }

    return json({ clubData, weaverseData });
  } catch (error) {
    console.error('Wine club loader error:', error);
    throw new Response('Error loading wine club', { status: 500 });
  }
}

export default function WineClubDetail({ loaderData }: Route.ComponentProps) {
  const { clubData } = loaderData;

  return (
    <div className="wine-club-detail">
      <WineClubDetailForm club={clubData} />
    </div>
  );
}

export function routeHeaders() {
  return {
    'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
  };
}
```

**4.2 Wine Club Detail Form Component**

Create `app/components/wine-club/detail-form.tsx`:

```typescript
import { useState, useRef } from 'react';
import type { WinehubClub, WineClubFormState, ProductData, CaseSize, SellingPlan } from '~/types/winehub';
import { calculateSalePrice } from '~/utils/winehub-api';
import { ProgressBar } from './progress-bar';
import { CaseSizeSelector } from './case-size-selector';
import { FrequencySelector } from './frequency-selector';
import { QuantitySelector } from './quantity-selector';
import { AddonSelector } from './addon-selector';
import { ReviewSummary } from './review-summary';

interface WineClubDetailFormProps {
  club: WinehubClub;
}

export function WineClubDetailForm({ club }: WineClubDetailFormProps) {
  const [formState, setFormState] = useState<WineClubFormState>({
    step: 1,
    caseChoice: null,
    freqChoice: null,
    selectedProducts: [],
    totalQuantity: 0,
    totalPrice: 0,
    totalRetailPrice: 0,
    acceptedSignUpOffer: null,
  });

  const handleCaseSizeSelect = (caseSize: CaseSize) => {
    setFormState(prev => ({
      ...prev,
      step: 2,
      caseChoice: caseSize,
    }));
  };

  const handleFrequencySelect = (frequency: SellingPlan) => {
    setFormState(prev => ({
      ...prev,
      step: 3,
      freqChoice: frequency,
    }));
  };

  const handleQuantityComplete = (products: ProductData[], totals: any) => {
    setFormState(prev => ({
      ...prev,
      step: 4,
      selectedProducts: products,
      totalQuantity: totals.quantity,
      totalPrice: totals.price,
      totalRetailPrice: totals.retailPrice,
    }));
  };

  const handleAddonComplete = (products: ProductData[], totals: any) => {
    setFormState(prev => ({
      ...prev,
      step: 5,
      selectedProducts: products,
      totalQuantity: totals.quantity,
      totalPrice: totals.price,
      totalRetailPrice: totals.retailPrice,
    }));
  };

  const handleBackToStep = (step: number) => {
    setFormState(prev => ({ ...prev, step: step as any }));
  };

  return (
    <div className="wine-club-form">
      <div className="wine-club-header mb-8">
        <h1 className="text-4xl font-bold">{club.name}</h1>
        {club.description && (
          <div
            className="text-lg text-gray-600 mt-4"
            dangerouslySetInnerHTML={{ __html: club.description }}
          />
        )}
      </div>

      <ProgressBar
        currentStep={formState.step}
        onStepClick={handleBackToStep}
      />

      {formState.step === 1 && (
        <CaseSizeSelector
          caseSizes={club.caseSizes}
          onSelect={handleCaseSizeSelect}
        />
      )}

      {formState.step === 2 && (
        <FrequencySelector
          frequencies={club.sellingPlans}
          onSelect={handleFrequencySelect}
        />
      )}

      {formState.step === 3 && formState.caseChoice && formState.freqChoice && (
        <QuantitySelector
          products={club.sellingPlanVariants}
          caseChoice={formState.caseChoice}
          freqChoice={formState.freqChoice}
          minimumOrderValue={club.minimumOrderValue}
          onComplete={handleQuantityComplete}
        />
      )}

      {formState.step === 4 && formState.caseChoice && formState.freqChoice && (
        <AddonSelector
          products={club.sellingPlanVariants}
          caseChoice={formState.caseChoice}
          freqChoice={formState.freqChoice}
          currentProducts={formState.selectedProducts}
          currentTotals={{
            quantity: formState.totalQuantity,
            price: formState.totalPrice,
            retailPrice: formState.totalRetailPrice,
          }}
          onComplete={handleAddonComplete}
        />
      )}

      {formState.step === 5 && (
        <ReviewSummary
          club={club}
          formState={formState}
        />
      )}
    </div>
  );
}
```

**Note:** The child components (ProgressBar, CaseSizeSelector, FrequencySelector, QuantitySelector, AddonSelector, ReviewSummary) should be created to break down the complex 1035-line logic into modular, maintainable components. Each component handles a specific step of the wine club selection process.

---

### Phase 5: Styling Migration

**5.1 Create Wine Club Styles**

Create `app/styles/wine-clubs.css`:

```css
/* Wine Club Listing */
.wine-hub-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.wine-clubs-grid {
  margin-top: 2rem;
}

.wine-club-card {
  transition: box-shadow 0.3s ease;
}

.wine-club-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Wine Club Detail */
.wine-club-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Progress Bar */
.progress-bar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 3rem;
  gap: 1rem;
}

.progress-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.node-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.progress-node.active .node-circle {
  background-color: #1f2937;
  color: white;
}

.node-label {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Step Grids */
.step-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.case-size,
.frequency,
.quantity-item {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.case-size:hover,
.frequency:hover {
  border-color: #1f2937;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Quantity Controls */
.input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.quant-input {
  width: 60px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.quant-input-btn {
  width: 32px;
  height: 32px;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quant-input-btn:hover {
  background-color: #f3f4f6;
}

/* Buttons */
.review-button,
.checkout-button {
  background-color: #1f2937;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.25rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.review-button:hover,
.checkout-button:hover {
  background-color: #374151;
}

/* Review */
.review-wrapper {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.review-wine {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.review-wine-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .step-grid {
    grid-template-columns: 1fr;
  }

  .progress-bar-container {
    flex-wrap: wrap;
  }
}
```

**5.2 Import Styles**

Update `app/root.tsx`:

```typescript
import './styles/wine-clubs.css';
```

---

## Code Examples & Patterns

### React Router v7 Type Safety

```typescript
// Always run: npx react-router typegen

// ✅ Correct pattern
import type { Route } from './+types/route-name';

export const loader = async ({ params }: Route.LoaderArgs) => { /* ... */ };
export const meta: Route.MetaFunction = ({ data }) => { /* ... */ };

// ❌ Wrong - direct exports don't exist
import type { LoaderArgs } from './+types/route-name';
```

### Weaverse Parent-Child Pattern

```typescript
// Parent component with data
const ParentSection = forwardRef<HTMLElement, Props>((props, ref) => {
  const { loaderData, children, ...rest } = props;
  return <Section ref={ref} {...rest}>{children}</Section>;
});

export const loader = async ({ data, weaverse }) => {
  const response = await weaverse.fetchWithCache(url, options);
  return { data: response };
};

// Child component accessing parent
const ChildItems = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const parent = useParentInstance();
  const data = parent.data?.loaderData?.data || [];

  return <div ref={ref}>{data.map(...)}</div>;
});
```

### Caching Strategy

```typescript
// Multi-layer caching configuration
const cacheConfig = {
  strategy: weaverse.storefront.CacheCustom({
    maxAge: 1800,              // 30 minutes (fresh)
    staleWhileRevalidate: 3600, // 1 hour (stale but usable)
    staleIfError: 7200,        // 2 hours (fallback on errors)
  })
};
```

### Parallel Data Loading

```typescript
// Constitutional requirement: parallel loading
export async function loader({ params, context }: LoaderFunctionArgs) {
  const { storefront, weaverse, env } = context;

  // Load all data in parallel
  const [shopifyData, weaverseData, winehubData] = await Promise.all([
    storefront.query(QUERY, { variables }),
    weaverse.loadPage({ type: 'PAGE', handle }),
    fetchWinehubData(env),
  ]);

  return json({ shopifyData, weaverseData, winehubData });
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Wine Club Listing:**
- [ ] Clubs load from Winehub API
- [ ] Images display correctly
- [ ] Descriptions render safely
- [ ] Links navigate properly
- [ ] Responsive on mobile
- [ ] Empty state displays

**Wine Club Detail:**
- [ ] Step 1: Case size selection works
- [ ] Step 2: Frequency selection works
- [ ] Step 3: Quantity validation enforces min/max
- [ ] Step 4: Add-ons optional
- [ ] Step 5: Review shows all selections
- [ ] Progress bar navigation functions
- [ ] Sign-up offer modal appears
- [ ] Checkout redirects correctly

**Performance:**
- [ ] Initial load <2 seconds
- [ ] API responses cached
- [ ] No console errors
- [ ] Lighthouse score >90

### E2E Testing

Create `tests/wine-clubs.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Wine Club Integration', () => {
  test('should display wine clubs', async ({ page }) => {
    await page.goto('/wine-club');
    await page.waitForSelector('.wine-club-card');

    const cards = page.locator('.wine-club-card');
    await expect(cards).toHaveCountGreaterThan(0);
  });

  test('should navigate through selection flow', async ({ page }) => {
    await page.goto('/wine-club');
    await page.click('.wine-club-card a');

    await expect(page).toHaveURL(/\/wine-club\/\d+/);
    await expect(page.locator('.progress-bar-container')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/clubs/basic-details**', route => route.abort('failed'));
    await page.goto('/wine-club');

    await expect(page.locator('text=No wine clubs')).toBeVisible();
  });
});
```

Run tests:
```bash
npm run e2e
```

---

## Deployment & Rollback

### Pre-Deployment Checklist

- [ ] All tests passing (`npm run e2e`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run biome`)
- [ ] Environment variables configured
- [ ] Weaverse project connected
- [ ] Builder.io dependencies removed
- [ ] Performance benchmarks met

### Deployment

```bash
# Build for production
npm run build

# Preview locally
npm run preview

# Deploy to Oxygen
shopify hydrogen deploy
```

### Rollback Plan

**If Critical Issues Occur:**

```bash
# Immediate rollback via CLI
shopify hydrogen deploy --env-branch=previous-version

# Or via Oxygen dashboard
# Shopify Admin > Settings > Hydrogen > Rollback
```

**Rollback Time:** <1 hour
**Data Impact:** None (API-based, no data migrations)

---

## Quick Reference

### Key Commands

```bash
# Development
npm run dev              # Port 3456
npm run build            # Production build
npm run preview          # Preview build

# Code Quality
npm run typecheck        # TypeScript
npm run biome            # Lint/format check
npm run biome:fix        # Auto-fix

# Testing
npm run e2e              # E2E tests
npm run e2e:ui           # With UI

# GraphQL
npm run codegen          # Generate types

# Deployment
shopify hydrogen deploy  # Deploy to Oxygen
```

### File Structure

```
app/
├── types/
│   └── winehub.ts                      # Type definitions
├── utils/
│   ├── winehub-api.ts                  # API client
│   └── winehub-server.ts               # Server utilities
├── sections/
│   └── wine-clubs/
│       ├── index.tsx                   # Parent section
│       └── club-items.tsx              # Child section
├── components/
│   └── wine-club/
│       └── detail-form.tsx             # Multi-step form
├── routes/
│   └── ($locale).wine-club.$handle.tsx # Detail route
├── styles/
│   └── wine-clubs.css                  # Wine club styles
└── weaverse/
    └── components.ts                   # Component registration
```

### Environment Variables

```bash
WINEHUB_API_BASE=https://api.winehub.io/headless
PUBLIC_STORE_DOMAIN=5869b0-a7.myshopify.com
WEAVERSE_PROJECT_ID=your-project-id
PUBLIC_STOREFRONT_API_TOKEN=your-token
```

### Common Issues

**Issue: "weaverse is not defined"**
- Solution: Use `ComponentLoaderArgs` type in loader

**Issue: "Cannot read loaderData"**
- Solution: Use `useParentInstance()` in child components

**Issue: API not caching**
- Solution: Use `weaverse.fetchWithCache` with proper cache strategy

**Issue: Types not found**
- Solution: Import from `~/types/winehub` (not relative paths)

### Performance Targets

| Metric | Target |
|--------|--------|
| Page Load | <2s |
| API Response | <500ms |
| Cache Hit Rate | >80% |
| Lighthouse Score | >90 |
| Error Rate | <1% |

### Success Metrics

**Technical:**
- Page load time <2 seconds
- API cache hit rate >80%
- Zero TypeScript errors
- All tests passing

**Business:**
- Conversion rate maintained or improved
- No increase in support tickets
- Revenue stable or growing

---

## Appendix

### Winehub API Reference

**Base URL:** `https://api.winehub.io/headless`

**Endpoints:**
1. `GET /clubs/basic-details?shop={domain}` - List clubs
2. `GET /club/{id}/details?shop={domain}` - Club details

**Authentication:** None (public API)

### Technology Stack Changes

**Before:**
- Remix 2.15.3, React 18.2, Builder.io 4.0.3, Node 18+

**After:**
- React Router 7.8.2, React 19.1.1, Weaverse 5.4.2, Node 20+, Tailwind 4.1.13

### Expected Performance Improvements

- **Page Load:** 2.5s → 1.2s (52% faster)
- **API Response:** 500ms → 80ms (84% faster)
- **Lighthouse:** 70-80 → 90-95 (+15 points)
- **Cache Hit Rate:** 0% → 90% (+90%)

---

*Migration Plan v1.0.0*
*Created: 2025-10-24*
*For: Pilot-Theme v5.6.0, Weaverse 5.4.2, React 19.1.1*
