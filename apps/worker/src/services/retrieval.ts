import type { SupportedLanguage } from '@lcau/shared';
import { CHATBOT_CONFIG } from '@lcau/shared';

interface RetrievedDocument {
  content: string;
  title: string;
  url: string;
  score: number;
}

interface VectorMetadata {
  content: string;
  title: string;
  url: string;
  language: SupportedLanguage;
  section?: string;
}

/**
 * Retrieve relevant context from Vectorize based on the user query.
 */
export async function retrieveContext(
  vectorize: VectorizeIndex | undefined,
  query: string,
  language: SupportedLanguage
): Promise<RetrievedDocument[]> {
  if (!vectorize) {
    console.warn('Vectorize not available, returning empty context');
    return [];
  }

  try {
    // Generate embedding for the query
    // Note: In production, use the same embedding model as indexing
    const embedding = await generateQueryEmbedding(query);

    // Query Vectorize with language filter
    const results = await vectorize.query(embedding, {
      topK: CHATBOT_CONFIG.MAX_CONTEXT_CHUNKS,
      filter: {
        language: { $eq: language },
      },
      returnMetadata: 'all',
    });

    // Filter by similarity threshold and map to documents
    return results.matches
      .filter((match) => match.score >= CHATBOT_CONFIG.SIMILARITY_THRESHOLD)
      .map((match) => {
        const metadata = match.metadata as unknown as VectorMetadata;
        return {
          content: metadata.content || '',
          title: metadata.title || 'Untitled',
          url: metadata.url || '',
          score: match.score,
        };
      });
  } catch (error) {
    console.error('Retrieval error:', error);
    return [];
  }
}

/**
 * Generate embedding for a query.
 * This is a placeholder - in production, use the same embedding model as indexing.
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  // TODO: Implement actual embedding generation
  // Options:
  // 1. Use Cloudflare Workers AI for embeddings
  // 2. Use Google's text-embedding model
  // 3. Use OpenAI embeddings

  // For now, return a placeholder
  // This needs to be replaced with actual embedding generation
  const dimension = 768; // Typical dimension for text embeddings
  return new Array(dimension).fill(0).map(() => Math.random() - 0.5);
}

/**
 * Batch retrieve for multiple languages (fallback strategy)
 */
export async function retrieveContextMultilingual(
  vectorize: VectorizeIndex | undefined,
  query: string,
  primaryLanguage: SupportedLanguage
): Promise<RetrievedDocument[]> {
  if (!vectorize) return [];

  // First try primary language
  const primaryResults = await retrieveContext(vectorize, query, primaryLanguage);

  // If we have enough results, return them
  if (primaryResults.length >= CHATBOT_CONFIG.MAX_CONTEXT_CHUNKS) {
    return primaryResults;
  }

  // Otherwise, try other languages as fallback
  const otherLanguages: SupportedLanguage[] = ['fr', 'km', 'en'].filter(
    (l) => l !== primaryLanguage
  ) as SupportedLanguage[];

  const additionalResults: RetrievedDocument[] = [];

  for (const lang of otherLanguages) {
    if (primaryResults.length + additionalResults.length >= CHATBOT_CONFIG.MAX_CONTEXT_CHUNKS) {
      break;
    }

    const langResults = await retrieveContext(vectorize, query, lang);
    additionalResults.push(...langResults);
  }

  // Combine and sort by score
  return [...primaryResults, ...additionalResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, CHATBOT_CONFIG.MAX_CONTEXT_CHUNKS);
}
