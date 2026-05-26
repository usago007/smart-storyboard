# AGENTS.md

## Working directory

All commands must run from `ad-script-splitter/`, not the repo root.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run all vitest tests |
| `npm run test:watch` | vitest in watch mode |

There is no separate `typecheck` script. Run `npx tsc --noEmit` for type checking.

## Architecture

```
src/
├── app/                # Next.js App Router pages (presentation layer)
│   ├── (with-nav)/     # Pages with sidebar (smart-create, manual-create, settings)
│   ├── result/         # Result page (no sidebar)
│   └── _api/           # LEGACY — old API routes, not registered as Next.js routes
├── application/        # Use-case service layer (StoryboardService, SessionService, etc.)
├── domain/             # Types, entities, converters (Scene, StoryboardSession, etc.)
├── infrastructure/mock/# Mock data sources (fixtures, generators, repositories)
├── shared/             # Browser storage wrappers, runtime config
├── contexts/           # React context (AppContext: language, theme, settings)
├── components/         # Shared components (MainLayout only; old ones cleaned)
├── storage/            # LEGACY — DB, S3, Drizzle ORM. Not used by current pages.
├── lib/                # Utility libs. Only error-handler.ts is active.
└── utils/              # LEGACY — imageProcessor.ts (old AI route helper)
```

## Data flow (V1 mock mode)

```
Pages → getClientServices() → Service interfaces → Mock Repositories → Fixtures / Generators
```

- Pages import from `@/application` and call `getClientServices()`
- `createClientServices()` wires 4 mock repositories (settings, session, storyboard, asset) into 4 service implementations
- Mock repositories simulate latency via `mockDelayMs` and may throw via `mockFailureRate` (configured in settings page)
- **Zero `fetch('/api')` calls in any page**

## Session persistence

- **Settings** (language, theme, mockDelayMs, mockFailureRate): `localStorage` key `smart-storyboard:settings` + in-memory cache
- **Sessions** (auto / manual storyboard data): `sessionStorage` keys `smart-storyboard:auto-session` / `smart-storyboard:manual-session`
- Demo mode: data survives page refresh within the same tab; lost on tab close

## Running without backend

Set `NEXT_PUBLIC_DATA_MODE=mock` (default in `.env.example`). No PostgreSQL, Coze API key, or S3 needed.

## Runtime boundary

- Local `next dev` / server-mode builds can use `NEXT_PUBLIC_DATA_MODE=remote` with SQLite-backed BFF routes.
- GitHub Pages export is mock-only because static export cannot host Next.js API routes or SQLite persistence.

## Legacy zone

These directories contain old Coze/DB/S3 code. They are **not imported by any current page** and are excluded from ESLint:

| Directory / File | What it was |
|---|---|
| `src/app/_api/` | Old Next.js API routes (renamed; not registered as routes) |
| `src/storage/` | Drizzle ORM, PostgreSQL, S3, session manager |
| `src/lib/llm-client.ts` | LangChain LLM calls (old AI routes only) |
| `src/lib/model-config.ts` | AI service config registry |
| `src/lib/mock-data.ts` | Old mock types (old API routes only) |
| `src/utils/imageProcessor.ts` | Sharp-based image post-processing |

## Future: connecting real backend

1. Create `src/infrastructure/remote/` with adapters implementing the same service interfaces
2. Change `NEXT_PUBLIC_DATA_MODE=remote` in `.env.local`
3. Update `createClientServices()` to swap in remote repositories when `dataMode === 'remote'`
4. Pages and service interfaces do not change — only the adapter injection
