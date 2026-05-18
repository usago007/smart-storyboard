# AI Smart Storyboard System

> AI-powered storyboard generation system with local demo mode - zero configuration required for local presentations.

## Features

- **Demo Mode**: Run locally without database or AI services - perfect for demos
- **Smart Generation**: AI-powered shot prompts and image generation
- **Manual Creation**: Hand-craft storyboards with full control
- **Black & White Sketch Style**: Auto-convert images to pencil sketch style
- **Session Management**: Automatic data cleanup with configurable retention

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Drizzle ORM) - optional for demo mode
- **AI Integration**: Coze Coding Dev SDK

## Quick Start

### DEMO Mode (Recommended for Local Demo)

No database or API keys required. All data is stored in memory.

```bash
cd ad-script-splitter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Mode

1. Copy and configure environment variables:
```bash
cp .env.example .env.local
```

2. Set up PostgreSQL database and configure `.env.local`:
```env
PGDATABASE_URL=postgresql://user:password@localhost:5432/storyboard_db
COZE_WORKLOAD_IDENTITY_API_KEY=your-api-key
```

3. Start the development server:
```bash
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all available options.

| Variable | Required | Description |
|----------|----------|-------------|
| `DEMO_MODE` | No | Set to `true` to enable demo mode (no database/AI needed) |
| `PGDATABASE_URL` | Yes (production) | PostgreSQL connection string |
| `COZE_WORKLOAD_IDENTITY_API_KEY` | Yes (production) | Coze API key |

## Project Structure

```
ad-script-splitter/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries and mock data
│   └── storage/          # Database schema and managers
├── public/               # Static assets
├── .env.example          # Environment variable template
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Notes

- DEMO mode stores data in memory - data is lost on page refresh
- Image generation in DEMO mode returns placeholder images
- AI responses in DEMO mode are simulated with mock data

## License

Private - All rights reserved
