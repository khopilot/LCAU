'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatContext } from './ChatContext';
import { LanguageSelector } from './LanguageSelector';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import clsx from 'clsx';

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { t, clearMessages, language } = useChatContext();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={clsx(
          'fixed bottom-6 right-6 z-50',
          'flex items-center gap-3 px-4 py-3',
          'gradient-ifc text-white rounded-full',
          'shadow-button hover:shadow-button-hover',
          'transform hover:scale-105 transition-all duration-300'
        )}
      >
        <IFCLogo className="w-8 h-8" />
        <span className="text-sm font-medium">IFC Assistant</span>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full sm:max-w-md',
          'h-full sm:h-[600px] sm:max-h-[85vh]',
          'glass rounded-none sm:rounded-2xl',
          'shadow-chat',
          'flex flex-col overflow-hidden',
          'animate-slide-up',
          language === 'km' && 'font-khmer'
        )}
      >
        {/* Header with gradient */}
        <header className="relative gradient-ifc text-white">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 60">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="currentColor" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IFCLogo className="w-10 h-10" />
                <div>
                  <h2 id="chat-title" className="font-semibold text-base">
                    IFC Assistant
                  </h2>
                  <p className="text-xs text-blue-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    {t('online') || 'Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <LanguageSelector />
                <button
                  onClick={() => clearMessages()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={t('newConversation')}
                >
                  <RefreshIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="hidden sm:flex p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <MinimizeIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={t('close')}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <ChatInput />

        {/* Safe area padding for mobile */}
        <div className="safe-area-bottom" />
      </div>
    </div>
  );
}

function IFCLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      <div className="absolute inset-0 bg-white rounded-full" />
      <svg className="relative w-full h-full p-1.5" viewBox="0 0 32 32" fill="none">
        {/* French flag stripes */}
        <rect x="4" y="8" width="8" height="16" rx="2" fill="#003366" />
        <rect x="12" y="8" width="8" height="16" rx="0" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
        <rect x="20" y="8" width="8" height="16" rx="2" fill="#E30613" />
      </svg>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
