import type { SupportedLanguage } from '@lcau/shared';

export interface CrawlOptions {
  maxPages: number;
  concurrency: number;
  delay: number;
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  language: SupportedLanguage;
  section?: string;
  crawledAt: number;
}

export interface ChunkOptions {
  maxChunkSize: number;
  overlap: number;
}

export interface ContentChunk {
  id: string;
  content: string;
  metadata: {
    url: string;
    title: string;
    language: SupportedLanguage;
    section?: string;
    chunkIndex: number;
    totalChunks: number;
    crawledAt: number;
  };
}

export interface IndexResult {
  success: boolean;
  indexed: number;
  errors: number;
}
