# AGENTS.md - AI Agent Guidelines

> ETF Portfolio Dashboard - Next.js 16 + React 19 + TypeScript + Tailwind CSS 4

## Quick Reference

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# No test framework configured
```

## Project Structure

```
src/
├── app/             # Next.js App Router (pages, layouts)
├── components/
│   ├── ui/          # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── dashboard/   # Dashboard components (WidgetGrid, WidgetWrapper)
│   ├── widgets/     # Widget implementations (charts, tables, summaries)
│   ├── layout/      # Layout components (ThemeToggle, PortfolioSwitcher)
│   └── providers/   # React providers (QueryProvider)
├── config/          # Configuration (widget registry)
├── hooks/           # Custom React hooks
├── lib/
│   ├── api/         # API clients (Alpha Vantage)
│   ├── formatters.ts
│   ├── validators.ts
│   └── utils.ts     # cn() utility
├── stores/          # Zustand state slices
└── types/           # TypeScript type definitions
```

## Code Style

### Imports

**Order** (enforced by ESLint):
1. React/Next.js imports
2. External libraries
3. Internal absolute imports (`@/...`)
4. Relative imports (same directory only)

```typescript
// Example
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBulkQuotes } from "@/lib/api";
import { Quote } from "@/types";
import { useStore } from "@/stores";
```

**Path aliases**: Always use `@/` for src imports:
- `@/components`, `@/hooks`, `@/lib`, `@/stores`, `@/types`, `@/config`

**Barrel exports**: Each major directory has an `index.ts` re-exporting public APIs.

### TypeScript

- **Strict mode enabled** - no implicit any
- **Interface over type** for object shapes
- **Explicit return types** on exported functions
- **Union types** for string literals: `"USD" | "EUR" | "GBP"`

```typescript
// Type definitions in src/types/
export interface Portfolio {
  id: string;
  name: string;
  currency: "USD" | "EUR" | "GBP";
  createdAt: string;
  holdings: Holding[];
}

// Props interfaces defined inline or co-located
interface DashboardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}
```

### Components

- **Function components only** - no class components
- **Named exports** - `export function Component()` not default
- **"use client"** directive at top for client components
- **Props destructuring** with default values

```typescript
"use client";

export function Dashboard({ onRefresh, isLoading = false }: DashboardProps) {
  // ...
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PortfolioSummary`, `HoldingsTable` |
| Files (components) | PascalCase.tsx | `Dashboard.tsx`, `WidgetGrid.tsx` |
| Files (utils/hooks) | camelCase.ts | `formatters.ts`, `useQuotes.ts` |
| Hooks | use* prefix | `useStore`, `useQuotes` |
| Zustand slices | create*Slice | `createPortfolioSlice` |
| Constants | SCREAMING_SNAKE | `WIDGET_REGISTRY` |
| Interfaces | PascalCase | `PortfolioSlice`, `Quote` |

### Styling

- **Tailwind CSS 4** with CSS variables
- **shadcn/ui** components (new-york style)
- **cn()** utility for conditional classes: `cn("base-class", condition && "conditional-class")`
- **Color classes**: `text-muted-foreground`, `bg-primary`, `text-emerald-500`, `text-rose-500`

```typescript
import { cn } from "@/lib/utils";

<span className={cn(
  "text-xs font-mono-numbers",
  isPositive ? "text-emerald-500" : "text-rose-500"
)}>
```

### State Management

**Zustand** with slices pattern:
- `portfolioSlice.ts` - Portfolio and holdings
- `dashboardSlice.ts` - Widgets and layouts
- `uiSlice.ts` - Theme and UI state

```typescript
import { useStore } from "@/stores";

const portfolio = useStore((state) => state.getActivePortfolio());
const addHolding = useStore((state) => state.addHolding);
```

**React Query** for server state:
```typescript
const { data: quotes } = useQuotes(symbols);
```

### Validation

**Zod** for form validation:
```typescript
import { z } from "zod";

export const holdingSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  shares: z.number().positive(),
});
```

### Error Handling

- **try/catch** with console.error for API calls
- **Return null** or empty array on failure (graceful degradation)
- **Optional chaining** and nullish coalescing for safety

```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Network error");
  // ...
} catch (error) {
  console.error(`Failed to fetch quote for ${symbol}:`, error);
  return null;
}
```

### Formatting Utilities

Use functions from `@/lib/formatters`:
```typescript
formatCurrency(1234.56)        // "$1,234.56"
formatPercent(5.25)            // "+5.25%"
formatNumber(1234.5678, 2)     // "1,234.57"
formatDate("2025-02-10")       // "Feb 10, 2025"
```

## Key Technologies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | App Router, RSC |
| react | 19.2.3 | UI library |
| zustand | 5.x | Client state |
| @tanstack/react-query | 5.x | Server state |
| zod | 4.x | Validation |
| radix-ui | 1.x | Headless UI primitives |
| recharts | 3.x | Charts |
| lucide-react | 0.563 | Icons |
| tailwindcss | 4.x | Styling |

## Don'ts

- No `as any` or `@ts-ignore`
- No default exports (except pages)
- No inline styles (use Tailwind)
- No direct localStorage access (use Zustand persist)
- No class components

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
