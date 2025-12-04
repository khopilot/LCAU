import type { SupportedLanguage } from './language';
import type { ChatMessage } from './chat';

// Chat API
export interface ChatRequest {
  message: string;
  conversationId?: string;
  language: SupportedLanguage;
  history?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  sources?: SourceReference[];
}

export interface SourceReference {
  title: string;
  url: string;
  snippet: string;
}

// Transcription API
export interface TranscribeRequest {
  /** Base64 encoded audio data */
  audio: string;
  /** Audio format (webm, wav, etc.) */
  format: string;
  /** Optional language hint for better recognition */
  languageHint?: SupportedLanguage;
}

export interface TranscribeResponse {
  text: string;
  detectedLanguage: SupportedLanguage;
  confidence: number;
}

// Language Detection API
export interface DetectLanguageRequest {
  text: string;
}

export interface DetectLanguageResponse {
  language: SupportedLanguage;
  confidence: number;
}

// Health Check
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  timestamp: number;
  services: {
    vectorize: boolean;
    gemini: boolean;
    speechToText: boolean;
  };
}

// Error Response
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
