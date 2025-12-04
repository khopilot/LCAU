'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatContext } from './ChatContext';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@lcau/shared';
import clsx from 'clsx';

export function LanguageSelector() {
  const { language, setLanguage, t } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-white/10 rounded transition-colors"
        aria-label={t('languageSelect')}
        aria-expanded={isOpen}
      >
        <span className="uppercase font-medium">{language}</span>
        <ChevronIcon className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[140px] z-10">
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={clsx(
                'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors',
                'flex items-center justify-between',
                language === lang.code && 'bg-gray-50 font-medium'
              )}
            >
              <span>{lang.nativeName}</span>
              <span className="text-gray-400 uppercase text-xs">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
