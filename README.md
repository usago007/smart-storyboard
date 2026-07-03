# FatMug — Smart Storyboard

An AI-powered storyboard generator that turns advertising ideas into professional shot-by-shot breakdowns. Runs entirely in the browser with no backend, no API keys, and no database.

**Online demo:** [https://usago007.github.io/smart-storyboard/](https://usago007.github.io/smart-storyboard/)

---

## Use Cases

### Ad Creative to Storyboard
Input an ad script or product description. The system analyzes the material, generates a creative brief with content type, target audience, core message, and visual style. Confirm the brief and receive a complete storyboard with shot prompts, frame descriptions, and dialogue.

### Product Launch Video Planning
Describe a product and its selling points. Get a structured storyboard that maps each feature to a specific shot — from pain point introduction through product reveal to call to action.

### Short-Form Content Production
Generate shot-by-shot breakdowns optimized for 5s, 10s, or 12s segments — ideal for TikTok, Instagram Reels, YouTube Shorts, or in-feed advertising.

### Brand Storytelling
Transform brand values and positioning into visual narratives with structured shot sequences, camera direction, and frame composition guidance.

---

## Features

### Smart Storyboard Generation
Five input methods: manual text entry, file upload (`.txt`), voice dictation, URL content extraction, and preset templates. The system detects material type (ad copy, product info, talking script, brand intro) and automatically generates a creative brief with content analysis, target audience, and visual direction.

### Creative Brief Confirmation
Before scenes are generated, you review and confirm a read-only brief that shows: material recognition, content type, suggested shot count, creative objective, target audience, core message, video structure, and visual style. This prevents raw text from being directly converted into shots without direction.

### Inline Scene Editing
Generated scenes appear below the brief — all fields are editable. Modify dialogue, shot prompts, and frame descriptions directly in the result cards. Changes are preserved when syncing to the manual editor.

### Dual Brief Switching
Switch between a default creative brief and an alternative version with a different narrative structure — useful for A/B testing creative directions before generating final scenes.

### Manual Storyboard Editor
A full editor workbench for scene-by-scene refinement. Each scene card includes dialogue, shot prompts, first-frame and last-frame descriptions, and visual reference placeholders. Lock scenes to prevent accidental edits. Delete and renumber scenes automatically.

### Pencil-Sketch Reference Frames
Six hand-drawn black-and-white pencil-sketch SVGs serve as visual reference placeholders for first and last frames. Each sketch corresponds to a scene type with storyboard frame borders and scene labels. Click to preview full-size and download as SVG.

### One-Click Sample
Load a complete sample script with pre-configured parameters, review the generated brief, confirm, and explore the full workflow — from creative idea through storyboard generation to manual refinement.

### Sync to Manual Editor
Sync individual scenes or all scenes from the smart generator to the manual editor. All AI-generated content — shot prompts, frame descriptions, and reference images — is preserved during sync. After syncing, the page auto-navigates to the manual editor for further refinement.

### Infrastructure Dashboard
A read-only status panel mapping every planned API route, AI model, database table, and environment variable — designed as a blueprint for connecting real backends in the future.

---

## Architecture

| Layer | Path | Purpose |
|---|---|---|
| Domain | `src/domain/` | Types and entities (`Scene`, `StoryboardSession`, `FramePrompt`) |
| Application | `src/application/` | Use-case services (`StoryboardService`, `SessionService`, `AssetService`) |
| Infrastructure | `src/infrastructure/` | Repository implementations (mock + remote adapters) |
| Presentation | `src/app/` | Next.js App Router pages |

**Data flow**: `Pages → getClientServices() → Service interfaces → Mock Repositories`

Zero `fetch()` calls in mock mode — everything runs client-side.

---

## Getting Started

```bash
npm install
npm run dev        # → http://localhost:3000
```

The app defaults to mock mode (`NEXT_PUBLIC_DATA_MODE=mock`) — no database or API configuration needed.

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

Deployed at [https://usago007.github.io/smart-storyboard/](https://usago007.github.io/smart-storyboard/) via `.github/workflows/deploy.yml` — every push to `main` triggers a static export and deploys to the `gh-pages` branch.

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
