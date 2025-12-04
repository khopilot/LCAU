import { Hono } from 'hono';
import type { Bindings } from '../types';
import type { TranscribeRequest, TranscribeResponse, SupportedLanguage } from '@lcau/shared';
import { detectLanguageWithConfidence } from '../services/language';

export const transcribeRoutes = new Hono<{ Bindings: Bindings }>();

// Map our language codes to Whisper's language codes
const WHISPER_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  fr: 'french',
  km: 'khmer',
  en: 'english',
};

// Map Whisper's detected language back to our codes
const WHISPER_TO_SUPPORTED: Record<string, SupportedLanguage> = {
  french: 'fr',
  khmer: 'km',
  english: 'en',
  fr: 'fr',
  km: 'km',
  en: 'en',
};

transcribeRoutes.post('/transcribe', async (c) => {
  const body = await c.req.json<TranscribeRequest>();

  if (!body.audio) {
    return c.json({ error: 'No audio provided', code: 'MISSING_AUDIO' }, 400);
  }

  try {
    // Decode base64 audio to byte array (required by ALL Cloudflare Whisper models)
    const binaryString = atob(body.audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // DEBUG: Log audio info
    console.log('=== AUDIO DEBUG ===');
    console.log('Audio bytes length:', bytes.length);
    const first12 = Array.from(bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log('First 12 bytes (hex):', first12);

    // Check audio format by magic bytes
    // WAV: 52 49 46 46 (RIFF)
    // WebM: 1a 45 df a3 (EBML)
    // MP3: ff fb or 49 44 33 (ID3)
    const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebM = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    const isMp3 = (bytes[0] === 0xff && bytes[1] === 0xfb) || (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33);
    console.log('Format detection - WAV:', isWav, 'WebM:', isWebM, 'MP3:', isMp3);
    console.log('===================');

    // Call Whisper model via Workers AI
    let result: { text?: string; language?: string; vtt?: string; word_count?: number };

    // Both Cloudflare Whisper models use the same input format: array of numbers
    // The error about 'string' suggests JSON serialization issue
    const audioArray = Array.from(bytes);

    console.log('Audio array type:', typeof audioArray, 'isArray:', Array.isArray(audioArray));
    console.log('First element type:', typeof audioArray[0]);

    // Use basic whisper model which is more reliable
    // whisper-large-v3-turbo has API issues with the current SDK
    result = await c.env.AI.run('@cf/openai/whisper', {
      audio: audioArray,
    });

    // DEBUG: Log Whisper response
    console.log('=== WHISPER DEBUG ===');
    console.log('Model used: whisper (basic)');
    console.log('Text:', result.text);
    console.log('Detected language:', result.language);
    console.log('===================');

    if (!result.text || result.text.trim() === '') {
      return c.json({ error: 'No speech detected', code: 'NO_SPEECH' }, 400);
    }

    const transcribedText = result.text.trim();

    // Detect language from transcribed text with confidence scoring
    const textDetection = await detectLanguageWithConfidence(transcribedText);

    // Get Whisper's detected language if available
    const whisperLang = result.language
      ? WHISPER_TO_SUPPORTED[result.language.toLowerCase()]
      : null;

    // Determine final language:
    // 1. If Whisper detected a language and we support it, prefer that for voice
    // 2. Otherwise use text detection
    // 3. If there's a mismatch with high confidence, prefer Whisper for voice
    let finalLanguage: SupportedLanguage;
    let confidence: number;

    if (whisperLang) {
      // Whisper detected a supported language
      if (whisperLang === textDetection.language) {
        // Both agree - high confidence
        finalLanguage = whisperLang;
        confidence = Math.max(0.95, textDetection.confidence);
      } else if (textDetection.confidence < 0.7) {
        // Text detection uncertain - trust Whisper for voice
        finalLanguage = whisperLang;
        confidence = 0.85;
      } else {
        // Conflict - check if it's code-switching
        if (textDetection.isCodeSwitching) {
          // Mixed language detected, use text detection's dominant
          finalLanguage = textDetection.language;
          confidence = textDetection.confidence * 0.9;
        } else {
          // For voice, prefer Whisper's detection
          finalLanguage = whisperLang;
          confidence = 0.8;
        }
      }
    } else {
      // Whisper didn't return language, use text detection
      // If text detection is uncertain, use the languageHint as fallback
      if (textDetection.confidence < 0.5 && body.languageHint) {
        finalLanguage = body.languageHint;
        confidence = 0.5; // Low confidence since we're using fallback
      } else {
        finalLanguage = textDetection.language;
        confidence = textDetection.confidence;
      }
    }

    const transcribeResponse: TranscribeResponse = {
      text: transcribedText,
      detectedLanguage: finalLanguage,
      confidence,
    };

    return c.json(transcribeResponse);
  } catch (error) {
    console.error('Transcription error:', error);
    return c.json(
      { error: 'Transcription failed', code: 'TRANSCRIPTION_ERROR' },
      500
    );
  }
});
