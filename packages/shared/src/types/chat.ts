import type { SupportedLanguage } from './language';

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType = 'text' | 'voice';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  language: SupportedLanguage;
  timestamp: number;
  /** Original voice transcription if message was from voice input */
  transcription?: string;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  language: SupportedLanguage;
  createdAt: number;
  updatedAt: number;
}

export interface ChatContext {
  conversationId: string;
  language: SupportedLanguage;
  /** Retrieved document chunks from RAG */
  retrievedContext?: RetrievedChunk[];
}

export interface RetrievedChunk {
  id: string;
  content: string;
  source: string;
  score: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  url: string;
  title: string;
  language: SupportedLanguage;
  section?: string;
  lastCrawled: number;
}
