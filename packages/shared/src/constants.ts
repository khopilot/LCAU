// IFC Cambodia website
export const IFC_BASE_URL = 'https://www.ifcambodge.com';

// API paths
export const API_PATHS = {
  CHAT: '/api/chat',
  TRANSCRIBE: '/api/transcribe',
  DETECT_LANGUAGE: '/api/detect-language',
  HEALTH: '/api/health',
} as const;

// Chatbot configuration
export const CHATBOT_CONFIG = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_HISTORY_MESSAGES: 20,
  MAX_CONTEXT_CHUNKS: 5,
  SIMILARITY_THRESHOLD: 0.7,
} as const;

// Voice recording configuration
export const VOICE_CONFIG = {
  MAX_RECORDING_SECONDS: 60,
  SAMPLE_RATE: 16000,
  MIME_TYPE: 'audio/wav', // WAV format for Cloudflare Whisper compatibility
} as const;

// UI text in all supported languages
export const UI_TEXT = {
  fr: {
    chatButton: 'Besoin d\'aide ?',
    placeholder: 'Posez votre question...',
    send: 'Envoyer',
    recording: 'Enregistrement en cours...',
    processing: 'Traitement...',
    errorGeneric: 'Une erreur est survenue. Veuillez réessayer.',
    errorNoInfo: 'Je n\'ai pas trouvé cette information. Veuillez contacter l\'IFC directement.',
    languageSelect: 'Choisir la langue',
    close: 'Fermer',
    newConversation: 'Nouvelle conversation',
    online: 'En ligne',
  },
  km: {
    chatButton: 'ត្រូវការជំនួយ?',
    placeholder: 'សួរសំណួររបស់អ្នក...',
    send: 'ផ្ញើ',
    recording: 'កំពុងថត...',
    processing: 'កំពុងដំណើរការ...',
    errorGeneric: 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។',
    errorNoInfo: 'ខ្ញុំរកមិនឃើញព័ត៌មាននេះទេ។ សូមទាក់ទង IFC ដោយផ្ទាល់។',
    languageSelect: 'ជ្រើសរើសភាសា',
    close: 'បិទ',
    newConversation: 'ការសន្ទនាថ្មី',
    online: 'អនឡាញ',
  },
  en: {
    chatButton: 'Need help?',
    placeholder: 'Ask your question...',
    send: 'Send',
    recording: 'Recording...',
    processing: 'Processing...',
    errorGeneric: 'An error occurred. Please try again.',
    errorNoInfo: 'I couldn\'t find this information. Please contact IFC directly.',
    languageSelect: 'Select language',
    close: 'Close',
    newConversation: 'New conversation',
    online: 'Online',
  },
} as const;

// IFC contact information for fallback responses
export const IFC_CONTACTS = {
  email: 'info@ifcambodge.com',
  phone: '+855 23 430 610',
  address: '218, Street 184, Phnom Penh, Cambodia',
  website: IFC_BASE_URL,
} as const;
