# Frontend — CLAUDE.md

React 19 · Vite 6 · TypeScript strict · Tailwind v4 · TanStack Query v5 · React Router v7 · Axios.

## Commands

```bash
npm install
npm run dev          # :5173 — Vite dev server, proxies /api → :8000
npm test             # vitest (uses vitest.config.ts — separate from vite.config.ts)
npm run test:watch   # watch mode
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # dist/ for production
npm run preview      # preview dist/ locally
```

## Feature structure (required for every new domain)

```
src/features/<domain>/
  <domain>.api.ts       all API calls for this domain
  use<Domain>.ts        TanStack Query hooks (useQuery / useMutation)
  <Domain>Page.tsx      page component (imports from hooks, not API directly)
```

Register the page in `src/App.tsx`. Wrap protected pages in `<ProtectedRoute />`.

## Rules

**State management**
- TanStack Query v5 for ALL server state. No `useState + useEffect` for data fetching.
- `queryKey` must be stable arrays: `['users', id]`, not inline objects.
- Mutations: `useMutation` with `queryClient.invalidateQueries` on success.
- v5 breaking changes: `onSuccess`/`onError` removed from `useQuery` → use `useEffect` or mutation callbacks. `cacheTime` → `gcTime`.

**TypeScript**
- `strict: true`. No `any` without an explaining comment. No `// @ts-ignore` without justification.
- All API response types in `src/types/api.ts` or the feature's `*.api.ts`.

**Styling**
- Tailwind v4 — no `tailwind.config.js`. Custom design tokens go in `@theme {}` in `src/index.css`.
- `cn()` (from `src/lib/cn.ts`) for conditional classes. No inline styles. No string concatenation.
- UI primitives from `src/components/ui/` (Button, Card, Spinner) — don't reinvent.

**Auth / security**
- JWT stored in `sessionStorage` (NOT `localStorage` — XSS risk).
- Token attached automatically by Axios interceptor in `src/lib/axios.ts`.
- 401 responses trigger redirect to `/login` via interceptor — do NOT add per-component 401 handling.
- Protected pages: wrap in `<ProtectedRoute />` in `src/App.tsx`.

**HTTP**
- All API calls via the configured Axios instance (`src/lib/axios.ts`). Not `fetch`.
- Login must use `application/x-www-form-urlencoded` (`URLSearchParams`) — not JSON.

## Test setup

`vitest.config.ts` is SEPARATE from `vite.config.ts` — merging causes type conflicts (vitest/config bundles its own vite).

Use `renderWithProviders` from `tests/test-utils.tsx` — it wraps with `MemoryRouter` + fresh `QueryClient` (retry: false). Create a new `QueryClient` per test to avoid cache sharing.
