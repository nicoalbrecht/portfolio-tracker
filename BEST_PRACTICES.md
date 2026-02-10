# Next.js 16 + React 19 + Zustand 5 + React Query 5 Best Practices & Anti-Patterns

> **Focus**: What can go wrong and how to avoid it

---

## 1. Next.js 16 App Router - "use client" Directives

### ❌ ANTI-PATTERNS

#### 1.1 Overusing "use client"
```typescript
// ❌ BAD: Marking entire page as client component
"use client";

export default function Page() {
  return <StaticContent />; // No interactivity needed
}

// ✅ GOOD: Only mark interactive components
export default function Page() {
  return (
    <>
      <StaticContent />
      <InteractiveWidget /> {/* "use client" inside this file */}
    </>
  );
}
```

**Why it matters**: Every "use client" creates a boundary that ships JavaScript to the browser. Unnecessary client components:
- Increase bundle size
- Lose RSC benefits (streaming, zero-JS static content)
- Slower initial page load

#### 1.2 Missing "use client" on Hook Usage
```typescript
// ❌ BAD: Using hooks without "use client"
import { useState } from 'react';

export default function Component() {
  const [count, setCount] = useState(0); // Error at build time
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ✅ GOOD: Add directive at file top
"use client";

import { useState } from 'react';

export default function Component() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### 1.3 Passing Non-Serializable Props Across Boundary
```typescript
// ❌ BAD: Passing functions from Server to Client Component
// app/page.tsx (server component)
export default function Page() {
  const handleClick = () => console.log('clicked'); // Server-side function
  return <ClientButton onClick={handleClick} />; // ❌ Cannot serialize
}

// ✅ GOOD: Use Server Actions instead
// app/page.tsx
import { ClientButton } from './client-button';

async function handleClick() {
  "use server";
  console.log('clicked on server');
}

export default function Page() {
  return <ClientButton action={handleClick} />;
}

// client-button.tsx
"use client";
export function ClientButton({ action }: { action: () => Promise<void> }) {
  return <button onClick={() => action()}>Click</button>;
}
```

#### 1.4 Importing Server-Only Code in Client Components
```typescript
// ❌ BAD: Importing database in client component
"use client";

import { db } from '@/lib/database'; // ❌ Exposes DB connection string

export function Component() {
  // ...
}

// ✅ GOOD: Use Server Actions or Route Handlers
"use client";

async function fetchData() {
  const res = await fetch('/api/data');
  return res.json();
}
```

### ⚠️ GOTCHAS

1. **"use client" propagates**: If A imports B and A has "use client", B becomes client-side too
2. **Environment variables**: `NEXT_PUBLIC_*` are exposed to client; others are server-only
3. **Third-party libraries**: Many don't have "use client" - you may need wrapper components

---

## 2. React 19 Patterns

### ❌ ANTI-PATTERNS

#### 2.1 Misusing the `use()` Hook
```typescript
// ❌ BAD: Creating promises in render
"use client";
import { use } from 'react';

function Component() {
  const data = use(fetch('/api/data')); // ❌ New promise every render
  return <div>{data.title}</div>;
}

// ✅ GOOD: Pass promise from parent or use suspense-compatible library
import { use } from 'react';

function Component({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise); // ✅ Stable promise reference
  return <div>{data.title}</div>;
}
```

**React's warning**: "Creating promises inside a Client Component or hook is not yet supported"

#### 2.2 Using `use()` with Context Before Early Returns
```typescript
// ❌ BAD: Can't call use() after conditional return
import { use } from 'react';
import ThemeContext from './ThemeContext';

function Heading({ children }) {
  if (children == null) {
    return null;
  }
  
  const theme = use(ThemeContext); // ✅ This works in React 19
  return <h1 style={{ color: theme.color }}>{children}</h1>;
}

// ⚠️ NOTE: This is actually allowed in React 19, unlike useContext
// Just be aware it's a new capability
```

#### 2.3 Misusing `useTransition` with Async Functions
```typescript
// ❌ BAD: Not handling errors in transitions
"use client";
import { useTransition } from 'react';

function Component() {
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = () => {
    startTransition(async () => {
      await updateName(name); // ❌ Unhandled error
    });
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}

// ✅ GOOD: Use useActionState for error handling
import { useActionState } from 'react';

function Component() {
  const [error, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateName(formData.get("name"));
      if (error) return error;
      return null;
    },
    null,
  );
  
  return (
    <form action={submitAction}>
      <button disabled={isPending}>Submit</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

#### 2.4 Forgetting `ref` Cleanup Functions (React 19)
```typescript
// ❌ BAD: Memory leak with event listeners
"use client";

function Component() {
  return (
    <div
      ref={(node) => {
        if (node) {
          node.addEventListener('scroll', handleScroll);
        }
        // ❌ Never cleaned up
      }}
    />
  );
}

// ✅ GOOD: Return cleanup function
function Component() {
  return (
    <div
      ref={(node) => {
        if (node) {
          node.addEventListener('scroll', handleScroll);
          
          return () => {
            node.removeEventListener('scroll', handleScroll); // ✅ Cleanup
          };
        }
      }}
    />
  );
}
```

---

## 3. Zustand 5 Best Practices

### ❌ ANTI-PATTERNS

#### 3.1 Direct State Mutation
```typescript
// ❌ BAD: Mutating state directly
import { create } from 'zustand';

const useStore = create((set) => ({
  portfolio: { holdings: [] },
  addHolding: (holding) => {
    useStore.getState().portfolio.holdings.push(holding); // ❌ MUTATION
  },
}));

// ✅ GOOD: Immutable updates
const useStore = create((set) => ({
  portfolio: { holdings: [] },
  addHolding: (holding) => 
    set((state) => ({
      portfolio: {
        ...state.portfolio,
        holdings: [...state.portfolio.holdings, holding],
      },
    })),
}));
```

#### 3.2 Persist Middleware with Sensitive Data
```typescript
// ❌ BAD: Storing API keys in localStorage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      apiKey: '', // ❌ Never persist secrets!
      setApiKey: (key) => set({ apiKey: key }),
    }),
    { name: 'app-storage' }
  )
);

// ✅ GOOD: Use environment variables or secure storage
// .env.local
ALPHA_VANTAGE_API_KEY=your_key_here

// In code, access via process.env or route handlers
```

#### 3.3 Overusing Global State
```typescript
// ❌ BAD: Everything in Zustand
const useStore = create((set) => ({
  // Global state
  portfolio: {},
  
  // ❌ Component-local state in global store
  isModalOpen: false,
  modalData: null,
  searchQuery: '',
  hoveredRow: null,
}));

// ✅ GOOD: Keep local state local
const useStore = create((set) => ({
  // Only truly global state
  portfolio: {},
  activePortfolioId: null,
}));

function Component() {
  // Local state for UI concerns
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
}
```

#### 3.4 Slice Pattern Pitfalls
```typescript
// ❌ BAD: Circular dependencies between slices
// portfolioSlice.ts
export const createPortfolioSlice = (set, get) => ({
  portfolio: {},
  updatePortfolio: () => {
    // ❌ Accessing dashboard slice creates coupling
    get().refreshWidgets();
  },
});

// dashboardSlice.ts
export const createDashboardSlice = (set, get) => ({
  widgets: [],
  refreshWidgets: () => {
    // ❌ Accessing portfolio slice
    const portfolio = get().portfolio;
  },
});

// ✅ GOOD: Single direction dependencies or events
// Use a pub/sub pattern or make slices independent
```

#### 3.5 Persist Middleware Version Conflicts
```typescript
// ❌ BAD: Not handling version migrations
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // Schema changed from v1 to v2, but no migration
      holdings: [], // Was { id, symbol } now needs { id, symbol, shares }
    }),
    { name: 'portfolio-storage' }
  )
);

// ✅ GOOD: Use version and migrate function
const useStore = create(
  persist(
    (set) => ({
      holdings: [],
    }),
    {
      name: 'portfolio-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate v1 to v2
          return {
            ...persistedState,
            holdings: persistedState.holdings.map(h => ({
              ...h,
              shares: 0, // Add missing field
            })),
          };
        }
        return persistedState;
      },
    }
  )
);
```

### ⚠️ PERSIST GOTCHAS

1. **Hydration mismatch**: Server renders with empty state, client with persisted state
   ```typescript
   // Fix: Use separate hydrated flag
   const useStore = create(
     persist(
       (set) => ({
         _hasHydrated: false,
         setHasHydrated: (state) => set({ _hasHydrated: state }),
         // ... your state
       }),
       {
         name: 'storage',
         onRehydrateStorage: () => (state) => {
           state?.setHasHydrated(true);
         },
       }
     )
   );
   
   function Component() {
     const hasHydrated = useStore((s) => s._hasHydrated);
     if (!hasHydrated) return <Skeleton />;
     // Render with hydrated state
   }
   ```

2. **Storage quota exceeded**: Zustand persist doesn't handle quota errors
   ```typescript
   // Add try/catch or size limits
   const useStore = create(
     persist(
       (set) => ({ /* ... */ }),
       {
         name: 'storage',
         storage: {
           getItem: (name) => {
             const str = localStorage.getItem(name);
             return str ? JSON.parse(str) : null;
           },
           setItem: (name, value) => {
             try {
               localStorage.setItem(name, JSON.stringify(value));
             } catch (e) {
               console.error('Storage quota exceeded', e);
               // Clear old data or notify user
             }
           },
           removeItem: (name) => localStorage.removeItem(name),
         },
       }
     )
   );
   ```

---

## 4. React Query 5 Best Practices

### ❌ ANTI-PATTERNS

#### 4.1 No Error Boundaries for Query Errors
```typescript
// ❌ BAD: Unhandled query errors crash the app
"use client";
import { useQuery } from '@tanstack/react-query';

function Component() {
  const { data } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    suspense: true, // ❌ Errors will throw without boundary
  });
  
  return <div>{data.name}</div>;
}

// ✅ GOOD: Wrap with ErrorBoundary or handle errors
import { ErrorBoundary } from 'react-error-boundary';

function Component() {
  const { data, error, isError } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    retry: 3,
  });
  
  if (isError) return <ErrorMessage error={error} />;
  if (!data) return <Skeleton />;
  
  return <div>{data.name}</div>;
}
```

#### 4.2 Wrong `staleTime` Defaults
```typescript
// ❌ BAD: Refetching every time (staleTime: 0 is default)
const { data } = useQuery({
  queryKey: ['quotes', symbols],
  queryFn: () => fetchQuotes(symbols),
  // No staleTime = refetches on every mount/window focus
});

// ✅ GOOD: Set appropriate staleTime
const { data } = useQuery({
  queryKey: ['quotes', symbols],
  queryFn: () => fetchQuotes(symbols),
  staleTime: 1000 * 60 * 5, // 5 minutes for quotes
  refetchInterval: 1000 * 60, // Auto-refresh every minute
});

// For static data
const { data } = useQuery({
  queryKey: ['portfolio', id],
  queryFn: () => fetchPortfolio(id),
  staleTime: Infinity, // Never stale until manually invalidated
});
```

#### 4.3 Not Using `queryKey` Properly
```typescript
// ❌ BAD: Missing dependencies in queryKey
const { data } = useQuery({
  queryKey: ['portfolios'], // ❌ Doesn't include filter/sort
  queryFn: () => fetchPortfolios({ filter, sortBy }),
});

// When filter changes, same cached data returned!

// ✅ GOOD: Include all dependencies
const { data } = useQuery({
  queryKey: ['portfolios', { filter, sortBy }],
  queryFn: () => fetchPortfolios({ filter, sortBy }),
});
```

#### 4.4 QueryClient in Client Components (Next.js)
```typescript
// ❌ BAD: Creating QueryClient in render
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function Providers({ children }) {
  const queryClient = new QueryClient(); // ❌ New client every render!
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ✅ GOOD: Use useState to maintain single instance
"use client";
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 3,
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### 4.5 Mutations Without Optimistic Updates
```typescript
// ❌ BAD: No feedback during mutation
const mutation = useMutation({
  mutationFn: updateHolding,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['holdings'] });
  },
});

// ✅ GOOD: Optimistic updates for better UX
const mutation = useMutation({
  mutationFn: updateHolding,
  onMutate: async (newHolding) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['holdings', newHolding.id] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['holdings', newHolding.id]);
    
    // Optimistically update
    queryClient.setQueryData(['holdings', newHolding.id], newHolding);
    
    return { previous };
  },
  onError: (err, newHolding, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['holdings', newHolding.id],
      context?.previous
    );
  },
  onSettled: (newHolding) => {
    queryClient.invalidateQueries({ queryKey: ['holdings', newHolding.id] });
  },
});
```

---

## 5. API Keys Security in Next.js

### ❌ CRITICAL ANTI-PATTERNS

#### 5.1 Exposing API Keys in Client Code
```typescript
// ❌ EXTREMELY BAD: API key in client component
"use client";

const API_KEY = "ABCD1234"; // ❌ VISIBLE IN BROWSER DEVTOOLS

export async function fetchQuote(symbol: string) {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
  );
  return response.json();
}

// ✅ GOOD: Use Route Handler
// app/api/quote/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  );
  const data = await response.json();
  
  return NextResponse.json(data);
}

// Client component
"use client";
export async function fetchQuote(symbol: string) {
  const response = await fetch(`/api/quote?symbol=${symbol}`);
  return response.json();
}
```

#### 5.2 Using `NEXT_PUBLIC_` Prefix for Secrets
```env
# ❌ BAD: Exposes to browser
NEXT_PUBLIC_API_KEY=your_secret_key

# ✅ GOOD: Server-only
API_KEY=your_secret_key
DATABASE_URL=postgresql://...
```

#### 5.3 Committing .env Files
```bash
# ❌ BAD: .env.local in git
git add .env.local # ❌ NEVER!

# ✅ GOOD: Add to .gitignore
echo ".env*.local" >> .gitignore

# Use .env.example for documentation
# .env.example
ALPHA_VANTAGE_API_KEY=your_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

#### 5.4 No Rate Limiting on API Routes
```typescript
// ❌ BAD: No protection against abuse
// app/api/quote/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  // Anyone can hammer this endpoint
  const response = await fetch(`https://api.example.com/quote?symbol=${symbol}`);
  return NextResponse.json(await response.json());
}

// ✅ GOOD: Add rate limiting (example with upstash)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // ... fetch data
}
```

---

## 6. Tailwind CSS 4 Migration Issues

### ❌ ANTI-PATTERNS

#### 6.1 Using Old @tailwind Directives
```css
/* ❌ BAD: v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ GOOD: v4 syntax */
@import "tailwindcss";
```

#### 6.2 Deprecated Utility Classes
```html
<!-- ❌ BAD: Deprecated in v4 -->
<div class="shadow-sm rounded-sm bg-opacity-50">

<!-- ✅ GOOD: v4 equivalents -->
<div class="shadow-xs rounded-xs bg-black/50">
```

#### 6.3 Old Config Format
```javascript
// ❌ BAD: JavaScript config (still works but deprecated)
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#ff0000',
      },
    },
  },
};

// ✅ GOOD: CSS variables in v4
/* app.css */
@import "tailwindcss";

@theme {
  --color-brand: #ff0000;
  --color-brand-50: #fff5f5;
  --color-brand-100: #ffe0e0;
}
```

#### 6.4 @apply with External Styles (CSS Modules, Vue, Svelte)
```vue
<!-- ❌ BAD: @apply without @reference -->
<template>
  <h1>Hello</h1>
</template>

<style scoped>
h1 {
  @apply text-2xl font-bold; /* ❌ Can't find utilities */
}
</style>

<!-- ✅ GOOD: Use @reference -->
<style scoped>
@reference "../../app.css";

h1 {
  @apply text-2xl font-bold;
}
</style>

<!-- ✅ BETTER: Use CSS variables directly -->
<style scoped>
h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}
</style>
```

---

## 7. shadcn/ui Accessibility Requirements

### ❌ ANTI-PATTERNS

#### 7.1 Removing aria-* Attributes
```tsx
// ❌ BAD: Stripping accessibility
import { Button } from "@/components/ui/button";

function Component() {
  return <Button aria-label="Close" />; // Custom prop
}

// Then modifying Button component:
export function Button({ className, "aria-label": ariaLabel, ...props }) {
  // ❌ Ignoring aria-label
  return <button className={cn(buttonVariants(), className)} {...props} />;
}

// ✅ GOOD: Preserve all aria-* and role attributes
export function Button({ className, ...props }) {
  return (
    <button
      className={cn(buttonVariants(), className)}
      {...props} // Spreads aria-*, role, etc.
    />
  );
}
```

#### 7.2 Missing Keyboard Navigation
```tsx
// ❌ BAD: Only mouse interactions
import { Dialog } from "@/components/ui/dialog";

function Component() {
  return (
    <Dialog>
      <DialogTrigger onClick={() => setOpen(true)}>Open</DialogTrigger>
      {/* ❌ Can't close with Escape, no focus trap */}
    </Dialog>
  );
}

// ✅ GOOD: shadcn/ui Dialog handles this automatically
// Built on Radix UI with full keyboard support:
// - Escape to close
// - Tab trap inside dialog
// - Focus returns to trigger on close
```

#### 7.3 Poor Color Contrast
```css
/* ❌ BAD: Insufficient contrast */
.button {
  background: #ffeb3b; /* Yellow */
  color: #ffffff; /* White - fails WCAG */
}

/* ✅ GOOD: Use shadcn color palette */
.button {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  /* shadcn ensures proper contrast */
}
```

#### 7.4 Form Fields Without Labels
```tsx
// ❌ BAD: No label association
import { Input } from "@/components/ui/input";

function Component() {
  return <Input placeholder="Enter name" />; // ❌ Screen readers can't identify
}

// ✅ GOOD: Use Label component
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Component() {
  return (
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Enter name" />
    </div>
  );
}
```

---

## 8. Recharts 3 Performance

### ❌ ANTI-PATTERNS

#### 8.1 Re-rendering Charts on Every Data Change
```tsx
// ❌ BAD: New array reference every render
function Component() {
  const data = portfolio.holdings.map(h => ({
    name: h.symbol,
    value: h.shares * h.price,
  })); // ❌ New array every time
  
  return <PieChart data={data} />;
}

// ✅ GOOD: Memoize data
import { useMemo } from 'react';

function Component() {
  const data = useMemo(
    () => portfolio.holdings.map(h => ({
      name: h.symbol,
      value: h.shares * h.price,
    })),
    [portfolio.holdings]
  );
  
  return <PieChart data={data} />;
}
```

#### 8.2 Too Many Data Points
```tsx
// ❌ BAD: Rendering 10,000 data points
const { data } = useQuery({
  queryKey: ['historical-prices'],
  queryFn: fetchHistoricalPrices,
});

return <LineChart data={data} />; // 10k points = slow

// ✅ GOOD: Downsample data
function downsample(data: any[], maxPoints: number) {
  if (data.length <= maxPoints) return data;
  
  const step = Math.floor(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

const chartData = useMemo(
  () => downsample(data, 100),
  [data]
);

return <LineChart data={chartData} />;
```

#### 8.3 Animating Large Datasets
```tsx
// ❌ BAD: Animating 1000+ bars
<BarChart data={largeDataset}>
  <Bar dataKey="value" animationDuration={1000} /> {/* Laggy */}
</BarChart>

// ✅ GOOD: Disable animations for large datasets
<BarChart data={largeDataset}>
  <Bar 
    dataKey="value" 
    isAnimationActive={largeDataset.length < 100}
  />
</BarChart>
```

---

## 9. TypeScript Strict Mode Violations

### ❌ ANTI-PATTERNS

#### 9.1 Implicit `any`
```typescript
// ❌ BAD: Implicit any
function processHolding(holding) { // any
  return holding.symbol.toUpperCase();
}

// ✅ GOOD: Explicit types
interface Holding {
  id: string;
  symbol: string;
  shares: number;
}

function processHolding(holding: Holding): string {
  return holding.symbol.toUpperCase();
}
```

#### 9.2 Non-null Assertions (`!`)
```typescript
// ❌ BAD: Asserting non-null unsafely
const portfolio = portfolios.find(p => p.id === id)!; // ❌ Can be undefined
console.log(portfolio.name); // Runtime error if not found

// ✅ GOOD: Handle undefined case
const portfolio = portfolios.find(p => p.id === id);
if (!portfolio) {
  throw new Error(`Portfolio ${id} not found`);
}
console.log(portfolio.name);

// ✅ ALSO GOOD: Optional chaining
const name = portfolios.find(p => p.id === id)?.name ?? 'Unknown';
```

#### 9.3 Type Assertions (`as`)
```typescript
// ❌ BAD: Unsafe type assertion
const data = await fetch('/api/data').then(r => r.json()) as Portfolio;
// If API returns wrong shape, TypeScript won't catch it

// ✅ GOOD: Runtime validation with Zod
import { z } from 'zod';

const portfolioSchema = z.object({
  id: z.string(),
  name: z.string(),
  holdings: z.array(z.object({
    symbol: z.string(),
    shares: z.number(),
  })),
});

const data = await fetch('/api/data')
  .then(r => r.json())
  .then(json => portfolioSchema.parse(json)); // Validates at runtime
```

---

## 10. Zod 4 Validation Best Practices

### ❌ ANTI-PATTERNS

#### 10.1 No Validation on User Input
```typescript
// ❌ BAD: Trusting user input
"use server";

export async function addHolding(formData: FormData) {
  const symbol = formData.get('symbol');
  const shares = formData.get('shares');
  
  // ❌ No validation - shares could be negative, symbol empty
  await db.holdings.create({
    data: { symbol, shares: Number(shares) },
  });
}

// ✅ GOOD: Validate with Zod
import { z } from 'zod';

const holdingSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  shares: z.number().positive().int(),
});

export async function addHolding(formData: FormData) {
  const parsed = holdingSchema.safeParse({
    symbol: formData.get('symbol'),
    shares: Number(formData.get('shares')),
  });
  
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  
  await db.holdings.create({ data: parsed.data });
  return { success: true };
}
```

#### 10.2 Complex Nested Validation
```typescript
// ❌ BAD: Hard to read nested schemas
const schema = z.object({
  portfolio: z.object({
    name: z.string().min(1),
    holdings: z.array(z.object({
      symbol: z.string(),
      shares: z.number(),
      transactions: z.array(z.object({
        date: z.string(),
        price: z.number(),
      })),
    })),
  }),
});

// ✅ GOOD: Break into smaller schemas
const transactionSchema = z.object({
  date: z.string(),
  price: z.number().positive(),
});

const holdingSchema = z.object({
  symbol: z.string().min(1).max(10),
  shares: z.number().positive().int(),
  transactions: z.array(transactionSchema),
});

const portfolioSchema = z.object({
  name: z.string().min(1),
  holdings: z.array(holdingSchema),
});
```

#### 10.3 Not Using `.transform()` for Data Normalization
```typescript
// ❌ BAD: Manual normalization after validation
const schema = z.object({
  symbol: z.string(),
  shares: z.string(), // From form input
});

const result = schema.parse(formData);
const shares = parseInt(result.shares, 10); // Manual conversion

// ✅ GOOD: Use .transform()
const schema = z.object({
  symbol: z.string().toUpperCase(), // Built-in transform
  shares: z.string().transform(s => parseInt(s, 10)).pipe(z.number().positive()),
});

const result = schema.parse(formData);
// result.shares is already a number
```

#### 10.4 Ignoring Error Messages
```typescript
// ❌ BAD: Generic error message
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

const result = schema.safeParse(data);
if (!result.success) {
  return { error: "Validation failed" }; // ❌ Not helpful
}

// ✅ GOOD: Custom error messages
const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  age: z.number().min(18, "You must be at least 18 years old"),
});

const result = schema.safeParse(data);
if (!result.success) {
  return { errors: result.error.flatten().fieldErrors };
}

// Returns: { errors: { email: ["Please enter a valid email address"] } }
```

---

## Summary Checklist

### Before You Ship

- [ ] All "use client" directives are necessary
- [ ] No API keys in client-side code
- [ ] `.env.local` in `.gitignore`
- [ ] React Query `staleTime` configured appropriately
- [ ] Zustand persist has version/migration strategy
- [ ] Error boundaries wrap suspense boundaries
- [ ] Forms have proper validation (Zod)
- [ ] All interactive elements have accessible labels
- [ ] Large datasets are memoized or paginated
- [ ] TypeScript strict mode enabled with no suppressions
- [ ] Tailwind v4 syntax (`@import "tailwindcss"`)

---

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Accessibility](https://ui.shadcn.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

