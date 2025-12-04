import { Hono } from 'hono';
import type { Bindings } from '../types';
import type { ChatRequest, ChatResponse, ChatMessage, SupportedLanguage } from '@lcau/shared';
import { CHATBOT_CONFIG, IFC_CONTACTS } from '@lcau/shared';
import { retrieveContext } from '../services/retrieval';
import { detectLanguageWithConfidence, type LanguageDetectionResult } from '../services/language';

export const chatRoutes = new Hono<{ Bindings: Bindings }>();

chatRoutes.post('/chat', async (c) => {
  const body = await c.req.json<ChatRequest>();

  if (!body.message || body.message.length > CHATBOT_CONFIG.MAX_MESSAGE_LENGTH) {
    return c.json({ error: 'Invalid message', code: 'INVALID_MESSAGE' }, 400);
  }

  // Enhanced language detection with confidence
  const detection = await detectLanguageWithConfidence(body.message);

  // Language priority: explicit user selection > high-confidence detection > conversation history > detected
  let language: SupportedLanguage;
  if (body.language && detection.confidence < 0.8) {
    // User has a preference and detection isn't highly confident - use user preference
    language = body.language;
  } else if (detection.confidence >= 0.7) {
    // High confidence detection - use it
    language = detection.language;
  } else if (body.history?.length) {
    // Low confidence - check conversation history for language continuity
    const assistantMessages = body.history.filter(m => m.role === 'assistant');
    const lastAssistantLang = assistantMessages.length > 0
      ? assistantMessages[assistantMessages.length - 1].language
      : undefined;
    language = lastAssistantLang || body.language || detection.language;
  } else {
    // No history, use detected or provided
    language = body.language || detection.language;
  }

  const context = await retrieveContext(c.env.VECTORIZE, body.message, language);
  const systemPrompt = buildSystemPrompt(language, context, detection);
  const conversationHistory = buildConversationHistory(body.history || []);

  try {
    // Build messages for Llama
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: body.message },
    ];

    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages });

    const responseText = result.response || 'Sorry, I could not generate a response.';

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: responseText,
      type: 'text',
      language,
      timestamp: Date.now(),
    };

    const response: ChatResponse = {
      message: assistantMessage,
      conversationId: body.conversationId || crypto.randomUUID(),
      sources: context.map((chunk) => ({
        title: chunk.title,
        url: chunk.url,
        snippet: chunk.content.substring(0, 150) + '...',
      })),
    };

    return c.json(response);
  } catch (error) {
    console.error('AI error:', error);
    return c.json({ error: 'Failed to generate response', code: 'GENERATION_ERROR' }, 500);
  }
});

function buildSystemPrompt(
  language: SupportedLanguage,
  context: Array<{ content: string; title: string; url: string }>,
  detection?: LanguageDetectionResult
): string {
  const languageInstructions: Record<SupportedLanguage, string> = {
    fr: `Tu es l'assistant virtuel de l'Institut Français du Cambodge (IFC). Réponds en français.`,
    km: `អ្នកជាជំនួយការនិម្មិតរបស់វិទ្យាស្ថានបារាំងកម្ពុជា (IFC)។ ឆ្លើយតបជាភាសាខ្មែរ។`,
    en: `You are the virtual assistant of Institut Français du Cambodge (IFC). Respond in English.`,
  };

  // Add code-switching awareness if detected
  let codeSwitchingHint = '';
  if (detection?.isCodeSwitching && detection.secondaryLanguage) {
    const hints: Record<SupportedLanguage, string> = {
      fr: `Note: L'utilisateur mélange ${detection.language === 'km' ? 'khmer' : 'anglais'} et français. Tu peux adapter ta réponse si nécessaire.`,
      km: `ចំណាំ៖ អ្នកប្រើប្រាស់កំពុងលាយភាសា។ អ្នកអាចសម្របសម្រួលចម្លើយរបស់អ្នកប្រសិនបើចាំបាច់។`,
      en: `Note: The user is mixing ${detection.language === 'km' ? 'Khmer' : 'French'} and English. You may adapt your response if needed.`,
    };
    codeSwitchingHint = `\n${hints[language]}`;
  }

  const contactInfo = `Contact: ${IFC_CONTACTS.email} | ${IFC_CONTACTS.phone}`;
  const contextSection = context.length > 0
    ? `\n\nContext:\n${context.map((c) => c.content).join('\n\n')}`
    : '';

  return `${languageInstructions[language]}${codeSwitchingHint}\n${contactInfo}${contextSection}`;
}

function buildConversationHistory(messages: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.slice(-10).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));
}
