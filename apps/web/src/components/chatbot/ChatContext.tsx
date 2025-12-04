'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SupportedLanguage, ChatMessage } from '@lcau/shared';
import { UI_TEXT } from '@lcau/shared';

interface ChatContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  t: (key: keyof (typeof UI_TEXT)['fr']) => string;
  sendMessage?: (content: string) => Promise<void>;
  setSendMessage?: (fn: (content: string) => Promise<void>) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export function ChatProvider({ children, language, onLanguageChange }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sendMessageFn, setSendMessageFn] = useState<((content: string) => Promise<void>) | undefined>();

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const t = useCallback(
    (key: keyof (typeof UI_TEXT)['fr']) => {
      return UI_TEXT[language][key];
    },
    [language]
  );

  const setSendMessage = useCallback((fn: (content: string) => Promise<void>) => {
    setSendMessageFn(() => fn);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        language,
        setLanguage: onLanguageChange,
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setIsLoading,
        isRecording,
        setIsRecording,
        conversationId,
        setConversationId,
        t,
        sendMessage: sendMessageFn,
        setSendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
