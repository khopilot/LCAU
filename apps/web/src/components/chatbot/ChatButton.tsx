'use client';

import { useChatContext } from './ChatContext';
import clsx from 'clsx';

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  const { t } = useChatContext();

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulse ring effect - behind the button */}
      <span
        className="absolute inset-0 rounded-full bg-ifc-blue pulse-ring pointer-events-none"
        aria-hidden="true"
      />

      {/* Main button */}
      <button
        onClick={onClick}
        className={clsx(
          'relative',
          'w-16 h-16 md:w-auto md:h-auto md:px-5 md:py-3',
          'flex items-center justify-center md:gap-3',
          'gradient-ifc text-white rounded-full',
          'shadow-button hover:shadow-button-hover',
          'transform hover:scale-105 active:scale-95',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus-ring'
        )}
        aria-label={t('chatButton')}
      >
        {/* IFC Logo icon */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <IFCLogoIcon className="w-7 h-7" />
        </div>

        {/* Text - hidden on mobile */}
        <span className="hidden md:block text-sm font-semibold tracking-wide">
          {t('chatButton')}
        </span>

        {/* Online indicator */}
        <span className="absolute top-0 right-0 md:top-1 md:right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>
    </div>
  );
}

function IFCLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chat bubble shape */}
      <path
        d="M16 4C9.373 4 4 8.477 4 14c0 2.334.916 4.471 2.44 6.15L4 28l6.4-3.2C11.89 25.57 13.89 26 16 26c6.627 0 12-4.477 12-10S22.627 4 16 4z"
        fill="currentColor"
        opacity="0.2"
      />
      {/* French flag stripes inside bubble - representing IFC Cambodia */}
      <rect x="9" y="10" width="4" height="8" rx="1" fill="#003366" />
      <rect x="14" y="10" width="4" height="8" rx="1" fill="#ffffff" />
      <rect x="19" y="10" width="4" height="8" rx="1" fill="#E30613" />
    </svg>
  );
}
