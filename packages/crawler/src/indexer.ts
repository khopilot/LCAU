import type { ContentChunk, IndexResult } from './types';

// Cloudflare API configuration
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const VECTORIZE_INDEX = 'ifc-content';

// Embedding configuration
const EMBEDDING_MODEL = 'bge-base-en-v1.5'; // Cloudflare Workers AI model
const EMBEDDING_DIMENSION = 768;

/**
 * Index chunks to Cloudflare Vectorize
 */
export async function indexToVectorize(chunks: ContentChunk[]): Promise<IndexResult> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn('   ⚠ Cloudflare credentials not configured, skipping indexing');
    console.log('   Set CF_ACCOUNT_ID and CF_API_TOKEN environment variables');
    return { success: false, indexed: 0, errors: chunks.length };
  }

  let indexed = 0;
  let errors = 0;

  // Process in batches of 100
  const batchSize = 100;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    try {
      // Generate embeddings for batch
      const embeddings = await generateEmbeddings(batch.map((c) => c.content));

      // Prepare vectors for Vectorize
      const vectors = batch.map((chunk, idx) => ({
        id: chunk.id,
        values: embeddings[idx] || new Array(EMBEDDING_DIMENSION).fill(0),
        metadata: {
          content: chunk.content.slice(0, 10000), // Vectorize metadata limit
          title: chunk.metadata.title,
          url: chunk.metadata.url,
          language: chunk.metadata.language,
          section: chunk.metadata.section || '',
          crawledAt: chunk.metadata.crawledAt,
        },
      }));

      // Upsert to Vectorize
      await upsertVectors(vectors);

      indexed += batch.length;
      console.log(`   Progress: ${indexed}/${chunks.length} chunks indexed`);
    } catch (error) {
      console.error(`   ⚠ Batch error:`, (error as Error).message);
      errors += batch.length;
    }
  }

  return {
    success: errors === 0,
    indexed,
    errors,
  };
}

/**
 * Generate embeddings using Cloudflare Workers AI
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/${EMBEDDING_MODEL}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const result = await response.json() as EmbeddingResponse;

  if (!result.success || !result.result?.data) {
    throw new Error('Invalid embedding response');
  }

  return result.result.data;
}

/**
 * Upsert vectors to Vectorize
 */
async function upsertVectors(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, unknown>;
  }>
): Promise<void> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/indexes/${VECTORIZE_INDEX}/upsert`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vectors }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vectorize upsert error: ${error}`);
  }
}

interface EmbeddingResponse {
  success: boolean;
  result?: {
    data: number[][];
  };
  errors?: Array<{ message: string }>;
}

/**
 * Create the Vectorize index if it doesn't exist
 */
export async function ensureVectorizeIndex(): Promise<void> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    throw new Error('Cloudflare credentials not configured');
  }

  // Check if index exists
  const checkResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/indexes/${VECTORIZE_INDEX}`,
    {
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
      },
    }
  );

  if (checkResponse.ok) {
    console.log(`   Index "${VECTORIZE_INDEX}" already exists`);
    return;
  }

  // Create index
  const createResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/vectorize/indexes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: VECTORIZE_INDEX,
        config: {
          dimensions: EMBEDDING_DIMENSION,
          metric: 'cosine',
        },
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create index: ${error}`);
  }

  console.log(`   ✓ Created Vectorize index "${VECTORIZE_INDEX}"`);
}
