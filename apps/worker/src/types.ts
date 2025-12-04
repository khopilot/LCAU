export interface Bindings {
  // Environment
  ENVIRONMENT: string;

  // Secrets (set via wrangler secret)
  GEMINI_API_KEY: string;

  // Cloudflare bindings
  VECTORIZE: VectorizeIndex;
  AI: Ai;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorizeQueryResult {
  matches: VectorizeMatch[];
  count: number;
}
