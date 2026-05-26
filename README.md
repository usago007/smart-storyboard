# FatMug — Smart Storyboard

AI-powered storyboard generator with a pure frontend mock mode — zero backend required for local demo.

## Quick Start

```bash
cd ad-script-splitter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Mock Mode (default)** — Runs entirely in the browser. No database, API keys, or external services.
- **Smart Scene Splitting** — Split ad scripts into scenes by duration and word count.
- **AI Prompt Generation** — Auto-generate shot prompts, first/last frame descriptions.
- **Image Placeholders** — Generate black-and-white storyboard images (demo mock).
- **Batch Operations** — Generate prompts, frames, and images for all scenes at once.
- **Manual Creation** — Hand-craft storyboards with full edit control.
- **Session Persistence** — Auto-save and restore sessions across page refreshes.
- **Theme & Language** — Light/dark theme, Chinese/English UI.
- **Remote Backend (Phase 2)** — Optional SQLite-backed BFF for real session & settings persistence.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend (optional)**: Next.js API Routes, SQLite via Drizzle ORM
- **Testing**: Vitest
- **Legacy (archived)**: PostgreSQL, S3, Coze AI, Sharp image processing

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npx tsc --noEmit` | Type checking |

## Environment Variables

```bash
# .env.local (optional)
NEXT_PUBLIC_DATA_MODE=mock          # mock | remote (default: mock)
SQLITE_DB_PATH=./data/storyboard.db # Only used in remote mode
```

### Mock Mode (`NEXT_PUBLIC_DATA_MODE=mock`)

No backend needed. All data is stored in `localStorage` (settings) and `sessionStorage` (scenes).
- Session survives page refresh within the same tab.
- All AI generation returns mock data with configurable latency and failure rate.

### Remote Mode (`NEXT_PUBLIC_DATA_MODE=remote`)

Requires running dev server (BFF routes serve SQLite-backed persistence).
- Session and settings are persisted to SQLite via API routes.
- AI generation (prompts, frames, images) remains mock.
- See `src/infrastructure/remote/` for implementation.

## Architecture

```
src/
├── app/                  # Next.js pages (presentation)
│   ├── (with-nav)/       # Pages with sidebar navigation
│   ├── api/              # BFF routes (session, settings)
│   └── _api/             # LEGACY — old Coze/DB routes (archived)
├── application/          # Service layer (StoryboardService, SessionService, etc.)
├── domain/               # Types, entities, converters
├── infrastructure/
│   ├── mock/             # Mock data sources (fixtures, generators, repositories)
│   ├── remote/           # SQLite-backed repositories + HTTP client repositories
│   └── repository-interfaces.ts
├── shared/               # Browser storage, runtime config
├── contexts/             # React context (language, theme, settings)
├── storage/              # LEGACY — old PostgreSQL / S3 / Drizzle code
└── lib/                  # Utilities (only error-handler.ts is active)
```

## Data Flow

```
Pages → getClientServices() → Service interfaces → Repository (mock | remote) → Storage
```

Pages never call `fetch('/api/...')` directly. All data access goes through the service layer.

## License

MIT
