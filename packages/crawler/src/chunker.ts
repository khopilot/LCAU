import type { CrawledPage, ChunkOptions, ContentChunk } from './types';
import { createHash } from 'crypto';

/**
 * Process crawled pages and split them into semantic chunks
 */
export async function processAndChunk(
  pages: CrawledPage[],
  options: ChunkOptions
): Promise<ContentChunk[]> {
  const chunks: ContentChunk[] = [];

  for (const page of pages) {
    const pageChunks = chunkContent(page, options);
    chunks.push(...pageChunks);
  }

  return chunks;
}

/**
 * Split a page's content into overlapping chunks
 */
function chunkContent(page: CrawledPage, options: ChunkOptions): ContentChunk[] {
  const { maxChunkSize, overlap } = options;
  const chunks: ContentChunk[] = [];

  // First, try to split by paragraphs/sections
  const sections = splitBySections(page.content);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const section of sections) {
    // If adding this section would exceed max size, save current chunk
    if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(createChunk(page, currentChunk, chunkIndex, chunks.length));
      chunkIndex++;

      // Keep overlap from previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 5)).join(' ');
      currentChunk = overlapWords + ' ' + section;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + section : section;
    }

    // If single section is too large, split it further
    if (currentChunk.length > maxChunkSize * 1.5) {
      const subChunks = splitLargeSection(currentChunk, maxChunkSize, overlap);
      for (const subChunk of subChunks) {
        chunks.push(createChunk(page, subChunk, chunkIndex, chunks.length));
        chunkIndex++;
      }
      currentChunk = '';
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 50) {
    chunks.push(createChunk(page, currentChunk, chunkIndex, chunks.length));
  }

  // Update total chunks count
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  return chunks;
}

/**
 * Split content by logical sections (paragraphs, headers, etc.)
 */
function splitBySections(content: string): string[] {
  // Split by double newlines or common section markers
  const sections = content
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  return sections;
}

/**
 * Split a large section into smaller chunks with overlap
 */
function splitLargeSection(
  section: string,
  maxSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  const sentences = section.match(/[^.!?]+[.!?]+/g) || [section];

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());

      // Create overlap
      const words = currentChunk.split(' ');
      const overlapText = words.slice(-Math.ceil(overlap / 5)).join(' ');
      currentChunk = overlapText + ' ' + sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Create a chunk object with generated ID
 */
function createChunk(
  page: CrawledPage,
  content: string,
  chunkIndex: number,
  totalChunks: number
): ContentChunk {
  // Generate deterministic ID based on content
  const hash = createHash('md5')
    .update(`${page.url}:${chunkIndex}:${content.slice(0, 100)}`)
    .digest('hex')
    .slice(0, 12);

  return {
    id: `chunk_${hash}`,
    content: content.trim(),
    metadata: {
      url: page.url,
      title: page.title,
      language: page.language,
      section: page.section,
      chunkIndex,
      totalChunks,
      crawledAt: page.crawledAt,
    },
  };
}
