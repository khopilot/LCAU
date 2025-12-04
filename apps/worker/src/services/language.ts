import type { SupportedLanguage } from '@lcau/shared';

/**
 * Result of language detection with confidence scoring
 */
export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number; // 0-1
  isCodeSwitching: boolean;
  detectedScripts: ('khmer' | 'latin')[];
  secondaryLanguage?: SupportedLanguage;
}

// Common French words (high frequency, distinctive)
const FRENCH_WORDS = new Set([
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'est', 'sont', 'être', 'avoir', 'fait', 'faire', 'suis', 'es', 'sommes', 'êtes',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
  'bonjour', 'merci', 'comment', 'pourquoi', 'quand', 'où', 'combien',
  'avec', 'pour', 'dans', 'sur', 'sous', 'par', 'sans', 'chez',
  'ce', 'cette', 'ces', 'cet', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'ne', 'pas', 'plus', 'jamais', 'rien', 'personne',
  'oui', 'non', 'bien', 'très', 'aussi', 'encore', 'déjà', 'toujours',
  'cours', 'français', 'apprendre', 'parler', 'inscription', 'information',
  'voudrais', 'veux', 'peux', 'dois', 'faut', 'peut', 'doit',
]);

// Common English words (high frequency, distinctive)
const ENGLISH_WORDS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'its',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'and', 'or', 'but', 'so', 'because', 'if', 'when', 'where', 'what', 'who', 'how',
  'hello', 'hi', 'please', 'thank', 'thanks', 'sorry', 'yes', 'no', 'okay', 'ok',
  'with', 'for', 'in', 'on', 'at', 'to', 'from', 'by', 'about', 'into',
  'want', 'need', 'like', 'know', 'think', 'see', 'get', 'make', 'go', 'come',
  'class', 'course', 'learn', 'study', 'speak', 'information', 'register',
]);

// French-specific accented characters
const FRENCH_ACCENTS = /[àâäéèêëïîôùûüçœæ]/i;

/**
 * Check if text contains Khmer script (Unicode range U+1780 to U+17FF)
 */
function containsKhmer(text: string): boolean {
  return /[\u1780-\u17FF]/.test(text);
}

/**
 * Count Khmer characters in text
 */
function countKhmerChars(text: string): number {
  const matches = text.match(/[\u1780-\u17FF]/g);
  return matches ? matches.length : 0;
}

/**
 * Count Latin characters in text (excluding spaces and punctuation)
 */
function countLatinChars(text: string): number {
  const matches = text.match(/[a-zA-Z]/g);
  return matches ? matches.length : 0;
}

/**
 * Extract words from text (Latin script only)
 */
function extractWords(text: string): string[] {
  return text.toLowerCase().match(/[a-zA-ZàâäéèêëïîôùûüçœæÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆ]+/g) || [];
}

/**
 * Count matches from a word set
 */
function countWordMatches(words: string[], wordSet: Set<string>): number {
  return words.filter(word => wordSet.has(word)).length;
}

/**
 * Enhanced language detection with confidence scoring and code-switching detection.
 */
export async function detectLanguageWithConfidence(text: string): Promise<LanguageDetectionResult> {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      language: 'fr',
      confidence: 0.3,
      isCodeSwitching: false,
      detectedScripts: [],
    };
  }

  const hasKhmer = containsKhmer(trimmed);
  const khmerCount = countKhmerChars(trimmed);
  const latinCount = countLatinChars(trimmed);
  const totalChars = khmerCount + latinCount;

  const detectedScripts: ('khmer' | 'latin')[] = [];
  if (khmerCount > 0) detectedScripts.push('khmer');
  if (latinCount > 0) detectedScripts.push('latin');

  // Extract Latin words for French/English detection
  const words = extractWords(trimmed);
  const frenchMatches = countWordMatches(words, FRENCH_WORDS);
  const englishMatches = countWordMatches(words, ENGLISH_WORDS);
  const hasFrenchAccents = FRENCH_ACCENTS.test(trimmed);

  // Detect code-switching (mixed scripts or significant both-language matches)
  const isCodeSwitching =
    (hasKhmer && latinCount > 3) || // Khmer + meaningful Latin text
    (frenchMatches > 0 && englishMatches > 0 && Math.min(frenchMatches, englishMatches) >= 2);

  // Calculate language scores
  let khmerScore = 0;
  let frenchScore = 0;
  let englishScore = 0;

  // Khmer scoring
  if (hasKhmer) {
    const khmerRatio = totalChars > 0 ? khmerCount / totalChars : 0;
    khmerScore = khmerRatio * 100;

    // Bonus for majority Khmer
    if (khmerRatio > 0.7) khmerScore += 20;
    else if (khmerRatio > 0.5) khmerScore += 10;
  }

  // French scoring
  frenchScore = frenchMatches * 10;
  if (hasFrenchAccents) frenchScore += 15;

  // Bonus for distinctive French patterns
  if (/\b(qu'|l'|d'|c'|j'|n'|s')\w/i.test(trimmed)) frenchScore += 10; // Contractions
  if (/\ble\s+\w+\s+(de|du|des)\b/i.test(trimmed)) frenchScore += 5; // Article patterns

  // English scoring
  englishScore = englishMatches * 10;

  // Penalty for French accents in "English"
  if (hasFrenchAccents && englishScore > 0) englishScore -= 5;

  // Determine primary language
  let language: SupportedLanguage;
  let confidence: number;
  let secondaryLanguage: SupportedLanguage | undefined;

  const maxScore = Math.max(khmerScore, frenchScore, englishScore);

  if (khmerScore === maxScore && khmerScore > 0) {
    language = 'km';
    confidence = calculateConfidence(khmerScore, frenchScore + englishScore, totalChars);

    if (isCodeSwitching) {
      secondaryLanguage = frenchScore >= englishScore ? 'fr' : 'en';
    }
  } else if (frenchScore >= englishScore) {
    language = 'fr';
    confidence = calculateConfidence(frenchScore, englishScore, words.length);

    if (isCodeSwitching && hasKhmer) {
      secondaryLanguage = 'km';
    } else if (englishMatches > 2) {
      secondaryLanguage = 'en';
    }
  } else {
    language = 'en';
    confidence = calculateConfidence(englishScore, frenchScore, words.length);

    if (isCodeSwitching && hasKhmer) {
      secondaryLanguage = 'km';
    } else if (frenchMatches > 2) {
      secondaryLanguage = 'fr';
    }
  }

  // Adjust confidence for very short texts
  if (trimmed.length < 10) {
    confidence *= 0.7;
  } else if (trimmed.length < 20) {
    confidence *= 0.85;
  }

  // Cap confidence
  confidence = Math.min(0.99, Math.max(0.1, confidence));

  return {
    language,
    confidence,
    isCodeSwitching,
    detectedScripts,
    secondaryLanguage,
  };
}

/**
 * Calculate confidence based on score differential and sample size
 */
function calculateConfidence(primaryScore: number, secondaryScore: number, sampleSize: number): number {
  if (primaryScore === 0) return 0.3;

  const scoreDiff = primaryScore - secondaryScore;
  const diffRatio = scoreDiff / Math.max(primaryScore, 1);

  // Base confidence from score differential
  let confidence = 0.5 + (diffRatio * 0.4);

  // Adjust for sample size
  if (sampleSize < 3) {
    confidence *= 0.6;
  } else if (sampleSize < 5) {
    confidence *= 0.8;
  } else if (sampleSize >= 10) {
    confidence *= 1.1;
  }

  return Math.min(0.95, Math.max(0.3, confidence));
}

/**
 * Simple language detection (backwards compatible)
 * Returns just the language code for simple use cases
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  const result = await detectLanguageWithConfidence(text);
  return result.language;
}

/**
 * Check if the language is valid
 */
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return ['fr', 'km', 'en'].includes(lang);
}
