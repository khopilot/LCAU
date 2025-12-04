# LCAU - IFC Cambodia Multilingual Chatbot

Chatbot multilingue (FR/KH/EN) pour l'Institut Français du Cambodge avec reconnaissance vocale et RAG.

## Architecture

```
/apps
  /web          # Next.js frontend (Cloudflare Pages)
  /worker       # Cloudflare Worker API (Hono)
/packages
  /shared       # Types et constantes partagés
  /crawler      # Script d'indexation du site IFC
```

## Stack technique

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono
- **LLM**: Google Gemini 1.5 Flash
- **STT**: Google Cloud Speech-to-Text
- **Vector Store**: Cloudflare Vectorize
- **Embeddings**: Cloudflare Workers AI (BGE)

## Prérequis

- Node.js >= 20
- pnpm >= 9
- Compte Cloudflare (Workers, Pages, Vectorize)
- Google Cloud API Key (Gemini + Speech-to-Text)

## Installation

```bash
pnpm install
```

## Configuration

### 1. Frontend (apps/web)

```bash
cp apps/web/.env.example apps/web/.env.local
```

### 2. Worker (apps/worker)

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Éditer .dev.vars avec vos clés API
```

Secrets pour production :
```bash
cd apps/worker
wrangler secret put GEMINI_API_KEY
wrangler secret put GOOGLE_CLOUD_API_KEY
```

### 3. Crawler (packages/crawler)

```bash
cp packages/crawler/.env.example packages/crawler/.env
# Éditer .env avec vos credentials Cloudflare
```

### 4. Créer l'index Vectorize

```bash
cd apps/worker
wrangler vectorize create ifc-content --dimensions 768 --metric cosine
```

## Développement

```bash
# Terminal 1 - Worker API
pnpm dev:worker

# Terminal 2 - Frontend
pnpm dev
```

## Crawl et indexation

```bash
pnpm crawl
```

## Déploiement

### Worker API

```bash
pnpm deploy:worker
```

### Frontend

```bash
pnpm deploy:web
```

## Langues supportées

| Code | Langue | Natif |
|------|--------|-------|
| fr | Français | Français |
| km | Khmer | ភាសាខ្មែរ |
| en | English | English |

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/chat` | Envoi de message |
| POST | `/api/transcribe` | Transcription vocale |
| GET | `/api/health` | Healthcheck |

## Licence

Propriétaire - IFC Cambodge
