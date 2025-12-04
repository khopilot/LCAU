'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatContext } from './ChatContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { ChatMessage } from '@lcau/shared';

export function MessageList() {
  const { messages, isLoading, language } = useChatContext();
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <WelcomeScreen language={language} />;
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar bg-gray-50/50">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  );
}

function MessageBubble({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  const isUser = message.role === 'user';
  const isVoice = message.type === 'voice';
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success('Copied to clipboard', {
      duration: 2000,
      position: 'bottom-center',
      style: {
        background: '#003366',
        color: '#fff',
        fontSize: '14px',
      },
    });
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast.success(type === 'up' ? 'Thanks for your feedback!' : 'We\'ll improve our responses', {
      duration: 2000,
      position: 'bottom-center',
      style: {
        background: '#003366',
        color: '#fff',
        fontSize: '14px',
      },
    });
  };

  return (
    <div
      className={clsx(
        'flex gap-2 group',
        isUser ? 'justify-end' : 'justify-start',
        isLast && 'animate-slide-up'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-ifc flex items-center justify-center">
          <span className="text-white text-xs font-bold">IFC</span>
        </div>
      )}

      <div className="flex flex-col max-w-[80%]">
        <div
          className={clsx(
            'px-4 py-3 shadow-sm',
            isUser
              ? 'message-user text-white'
              : 'message-assistant text-gray-800'
          )}
        >
          {isVoice && (
            <div className="flex items-center gap-1.5 text-xs opacity-70 mb-1.5">
              <MicIcon className="w-3 h-3" />
              <span>Voice message</span>
            </div>
          )}

          {/* Markdown or plain text */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ifc-blue underline hover:text-ifc-blue-600"
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => <p className="my-1">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          <time
            className={clsx(
              'block text-xs mt-2 opacity-60',
              isUser ? 'text-blue-100' : 'text-gray-500'
            )}
            dateTime={new Date(message.timestamp).toISOString()}
          >
            {formatTime(message.timestamp)}
          </time>
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && (
          <div
            className={clsx(
              'flex items-center gap-1 mt-1 transition-opacity duration-200',
              showActions || feedback ? 'opacity-100' : 'opacity-0'
            )}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-ifc-blue hover:bg-gray-100 rounded-md transition-colors"
              title="Copy"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback('up')}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                feedback === 'up'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-gray-100'
              )}
              title="Helpful"
            >
              <ThumbUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                feedback === 'down'
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
              )}
              title="Not helpful"
            >
              <ThumbDownIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* User avatar placeholder for alignment */}
      {isUser && <div className="flex-shrink-0 w-8" />}
    </div>
  );
}

function WelcomeScreen({ language }: { language: string }) {
  const { sendMessage } = useChatContext();

  const content = {
    fr: {
      greeting: 'Bonjour !',
      subtitle: 'Je suis l\'assistant IFC. Comment puis-je vous aider ?',
      suggestions: [
        'Quels sont les horaires d\'ouverture ?',
        'Quels cours proposez-vous ?',
        'Comment s\'inscrire ?',
      ],
    },
    km: {
      greeting: 'សួស្តី!',
      subtitle: 'ខ្ញុំជាជំនួយការ IFC។ តើខ្ញុំអាចជួយអ្វីបាន?',
      suggestions: [
        'តើម៉ោងបើកផ្ដល់សេវាជាម៉ោងប៉ុន្មាន?',
        'តើមានវគ្គសិក្សាអ្វីខ្លះ?',
        'តើចុះឈ្មោះចូលរៀនដូចម្តេច?',
      ],
    },
    en: {
      greeting: 'Hello!',
      subtitle: 'I\'m the IFC Assistant. How can I help you?',
      suggestions: [
        'What are your opening hours?',
        'What courses do you offer?',
        'How do I register?',
      ],
    },
  };

  const { greeting, subtitle, suggestions } = content[language as keyof typeof content] || content.fr;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
      {/* Logo */}
      <div className="w-20 h-20 mb-6 rounded-full gradient-ifc flex items-center justify-center shadow-lg animate-bounce-in">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-12 h-12">
            <rect x="4" y="8" width="8" height="16" rx="2" fill="#003366" />
            <rect x="12" y="8" width="8" height="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.5" />
            <rect x="20" y="8" width="8" height="16" rx="2" fill="#E30613" />
          </svg>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-ifc-blue mb-2">{greeting}</h3>
      <p className="text-gray-600 mb-8 max-w-xs">{subtitle}</p>

      {/* Suggested questions */}
      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          {language === 'km' ? 'សំណួរណែនាំ' : language === 'en' ? 'Suggested questions' : 'Questions suggérées'}
        </p>
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => sendMessage?.(suggestion)}
            className={clsx(
              'w-full px-4 py-3 text-left text-sm',
              'bg-white border border-gray-200 rounded-xl',
              'hover:border-ifc-blue hover:bg-ifc-blue-50 hover:shadow-md',
              'transition-all duration-200',
              'group'
            )}
          >
            <span className="text-gray-700 group-hover:text-ifc-blue">{suggestion}</span>
            <span className="float-right text-gray-300 group-hover:text-ifc-blue">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 justify-start animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-ifc flex items-center justify-center">
        <span className="text-white text-xs font-bold">IFC</span>
      </div>
      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex gap-1.5">
          <span className="typing-dot w-2 h-2 bg-ifc-blue rounded-full" />
          <span className="typing-dot w-2 h-2 bg-ifc-blue rounded-full" />
          <span className="typing-dot w-2 h-2 bg-ifc-blue rounded-full" />
        </div>
      </div>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  );
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
    </svg>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
