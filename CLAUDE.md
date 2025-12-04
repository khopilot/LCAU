# LCAU - IFC Cambodia Multilingual Chatbot

## Project Overview
Multilingual chatbot for Institut Français du Cambodge (IFC) supporting French, Khmer, and English with voice input.

## Tech Stack
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS v4
- **Backend**: Cloudflare Workers + Hono
- **LLM**: Cloudflare Workers AI (Llama 3.1 8B Instruct)
- **STT**: Cloudflare Workers AI (Whisper)
- **Vector Store**: Cloudflare Vectorize
- **Monorepo**: pnpm workspaces

## Cloudflare Configuration
- **Account ID**: `e8fa8d76479de666118db7977d6a949e`
- **Worker Name**: `lcau-api`
- **Production URL**: https://lcau-api.pienikdelrieu.workers.dev
- **Vectorize Index**: `ifc-content` (768 dimensions, cosine metric)

## Project Structure
```
apps/
  web/          # Next.js frontend (port 3000)
  worker/       # Cloudflare Worker API (port 8787)
packages/
  shared/       # Shared types, constants, configs
  crawler/      # IFC website crawler for indexing
```

## Development Commands
```bash
# Start frontend
pnpm --filter @lcau/web dev

# Start worker (local mode - limited AI)
pnpm --filter @lcau/worker dev

# Start worker (remote mode - full AI access)
cd apps/worker && npx wrangler dev --remote

# Deploy worker to production
cd apps/worker && npx wrangler deploy
```

## API Endpoints
- `POST /api/chat` - Chat with Llama 3.1 (supports FR/KM/EN)
- `POST /api/transcribe` - Voice transcription with Whisper
- `GET /api/health` - Health check

## Environment Variables
### Worker (.dev.vars)
```
GEMINI_API_KEY=<deprecated>
GOOGLE_CLOUD_API_KEY=<deprecated>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Key Files
- `apps/worker/wrangler.toml` - Worker configuration
- `apps/worker/src/routes/chat.ts` - Chat endpoint (Llama)
- `apps/worker/src/routes/transcribe.ts` - Transcription endpoint (Whisper)
- `apps/worker/src/services/retrieval.ts` - RAG retrieval service
- `packages/shared/src/constants.ts` - Shared constants
- `packages/shared/src/types/` - TypeScript types

## Supported Languages
- French (fr) - Default
- Khmer (km)
- English (en)

## Notes
- Worker must run with `--remote` flag locally to access Workers AI
- Vectorize index is empty - needs indexing via crawler
- CORS configured to allow any localhost port
