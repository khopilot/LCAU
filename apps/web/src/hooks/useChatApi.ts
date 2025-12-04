'use client';

import { useCallback } from 'react';
import { useChatContext } from '@/components/chatbot/ChatContext';
import { API_PATHS } from '@lcau/shared';
import type { ChatRequest, ChatResponse, TranscribeRequest, TranscribeResponse } from '@lcau/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export function useChatApi() {
  const {
    language,
    messages,
    addMessage,
    setIsLoading,
    conversationId,
    setConversationId,
    t,
  } = useChatContext();

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content,
        type: 'text' as const,
        language,
        timestamp: Date.now(),
      };
      addMessage(userMessage);
      setIsLoading(true);

      try {
        const request: ChatRequest = {
          message: content,
          conversationId: conversationId ?? undefined,
          language,
          history: messages.slice(-10), // Last 10 messages for context
        };

        const response = await fetch(`${API_BASE}${API_PATHS.CHAT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: ChatResponse = await response.json();

        addMessage(data.message);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: t('errorGeneric'),
          type: 'text',
          language,
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [language, messages, conversationId, addMessage, setIsLoading, setConversationId, t]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      setIsLoading(true);

      try {
        // Convert blob to base64
        const base64 = await blobToBase64(audioBlob);

        const transcribeRequest: TranscribeRequest = {
          audio: base64,
          format: 'webm',
          languageHint: language,
        };

        const transcribeResponse = await fetch(`${API_BASE}${API_PATHS.TRANSCRIBE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transcribeRequest),
        });

        if (!transcribeResponse.ok) {
          throw new Error(`Transcription error: ${transcribeResponse.status}`);
        }

        const transcription: TranscribeResponse = await transcribeResponse.json();

        if (!transcription.text.trim()) {
          throw new Error('Empty transcription');
        }

        // Add user message with transcription
        const userMessage = {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: transcription.text,
          type: 'voice' as const,
          language: transcription.detectedLanguage,
          timestamp: Date.now(),
          transcription: transcription.text,
        };
        addMessage(userMessage);

        // Now send to chat API
        const chatRequest: ChatRequest = {
          message: transcription.text,
          conversationId: conversationId ?? undefined,
          language: transcription.detectedLanguage,
          history: messages.slice(-10),
        };

        const chatResponse = await fetch(`${API_BASE}${API_PATHS.CHAT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatRequest),
        });

        if (!chatResponse.ok) {
          throw new Error(`Chat error: ${chatResponse.status}`);
        }

        const data: ChatResponse = await chatResponse.json();

        addMessage(data.message);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } catch (error) {
        console.error('Voice message error:', error);
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: t('errorGeneric'),
          type: 'text',
          language,
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [language, messages, conversationId, addMessage, setIsLoading, setConversationId, t]
  );

  return {
    sendMessage,
    sendVoiceMessage,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      if (base64Data) {
        resolve(base64Data);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
