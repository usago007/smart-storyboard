# FatMug — Smart Storyboard

An AI-powered advertising storyboard generator that turns ad copy into professional shot-by-shot breakdowns — entirely in the browser. No backend, no API keys, no database.

**[Live Demo](https://usago007.github.io/smart-storyboard/)**

---

## What It Does

### 🎬 Smart Storyboard Generation
Paste ad copy, upload a `.txt` file, dictate with your voice, import from a URL, or pick a template — the generator splits your script into scenes with the right shot duration for short-form video ads (5s / 10s / 12s per shot).

Every scene auto-generates:

- **Shot prompt** — camera direction for the full scene
- **First frame prompt** — opening composition, lighting, character performance
- **Last frame prompt** — closing composition, product placement, transition

### ✍️ Manual Storyboard Editor
Fine-tune every scene by hand. Edit dialogue, shot prompts, and frame descriptions. Lock scenes to prevent accidental edits. Copy full scene specs to clipboard. Delete unwanted scenes with automatic renumbering.

Sync scenes one-by-one or in bulk from Smart Create — all AI-generated content (prompts, frame descriptions, reference images) is preserved.

### 🖼️ Visual Reference Placeholders
Each scene produces first-frame and last-frame reference cards, ready for replacement with real AI-generated images when connected to an image service.

### ⚙️ Infrastructure Dashboard
A read-only settings page that maps out every API route, AI model, database table, and environment variable — designed as a blueprint for connecting real backends.

---

## Architecture

| Layer | Path | Purpose |
|---|---|---|
| Domain | `src/domain/` | Types, entities, converters (`Scene`, `StoryboardSession`, `FramePrompt`) |
| Application | `src/application/` | Use-case services (`StoryboardService`, `SessionService`, `AssetService`) |
| Infrastructure | `src/infrastructure/` | Repository implementations (mock + remote adapters) |
| Presentation | `src/app/` | Next.js App Router pages (`smart-create`, `manual-create`, `result`, `settings`) |

**Data flow**: `Pages → getClientServices() → Service interfaces → Mock Repositories`
Zero `fetch()` calls in mock mode — everything runs client-side.

---

## Getting Started

```bash
npm install
npm run dev        # → http://localhost:3000
```

The app defaults to **mock mode** (`NEXT_PUBLIC_DATA_MODE=mock`) — no database or API configuration needed.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build + static export |
| `npm run lint` | ESLint |
| `npm test` | Vitest (40 tests) |
| `npx tsc --noEmit` | TypeScript type-check |

---

## Deployment

GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — every push to `main` triggers a static export build and force-pushes the `out/` directory to the `gh-pages` branch.

Requires:
- GitHub Pages source set to **Deploy from branch → `gh-pages` / `(root)`**
- Repository visibility set to **Public**
- Workflow permissions: `contents: write` + `pages: write`

---

## Connecting a Real Backend

1. Implement adapters in `src/infrastructure/remote/` against the existing service interfaces
2. Set `NEXT_PUBLIC_DATA_MODE=remote` in `.env.local`
3. Update `createClientServices()` to swap in remote repositories
4. Pages and services remain unchanged — only the adapter injection changes

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4**
- **TypeScript 5**
- **Vitest** (test runner)

---

MIT
