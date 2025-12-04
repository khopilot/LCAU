'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useChatContext } from './ChatContext';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useChatApi } from '@/hooks/useChatApi';
import clsx from 'clsx';

export function ChatInput() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t, isLoading, isRecording, setSendMessage } = useChatContext();
  const { startRecording, stopRecording } = useVoiceRecorder();
  const { sendMessage, sendVoiceMessage } = useChatApi();

  // Register sendMessage with context so WelcomeScreen can use it
  useEffect(() => {
    if (setSendMessage) {
      setSendMessage(sendMessage);
    }
  }, [sendMessage, setSendMessage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    await sendMessage(trimmed);
    inputRef.current?.focus();
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        await sendVoiceMessage(audioBlob);
      }
    } else {
      await startRecording();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={isLoading || isRecording}
            rows={1}
            className={clsx(
              'w-full px-4 py-2 pr-10 resize-none',
              'border border-gray-300 rounded-xl',
              'focus:outline-none focus:ring-2 focus:ring-ifc-blue focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              'text-sm'
            )}
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Voice button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          disabled={isLoading}
          className={clsx(
            'p-2 rounded-full transition-all',
            isRecording
              ? 'bg-red-500 text-white animate-recording'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={isRecording ? t('recording') : 'Start recording'}
        >
          <MicIcon className="w-5 h-5" />
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={clsx(
            'p-2 rounded-full transition-all',
            'bg-ifc-blue text-white',
            'hover:bg-blue-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={t('send')}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>

      {isRecording && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {t('recording')}
        </p>
      )}
    </form>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
