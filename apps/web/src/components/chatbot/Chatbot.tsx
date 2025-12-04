'use client';

import { useState, useCallback } from 'react';
import { ChatButton } from './ChatButton';
import { ChatModal } from './ChatModal';
import { ChatProvider } from './ChatContext';
import { Toaster } from 'react-hot-toast';
import type { SupportedLanguage } from '@lcau/shared';
import { DEFAULT_LANGUAGE } from '@lcau/shared';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <ChatProvider language={language} onLanguageChange={setLanguage}>
      <ChatButton onClick={handleOpen} isOpen={isOpen} />
      {isOpen && <ChatModal onClose={handleClose} />}
      <Toaster />
    </ChatProvider>
  );
}
