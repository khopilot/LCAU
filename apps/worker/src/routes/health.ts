import { Hono } from 'hono';
import type { Bindings } from '../types';
import type { HealthResponse } from '@lcau/shared';

export const healthRoutes = new Hono<{ Bindings: Bindings }>();

healthRoutes.get('/health', async (c) => {
  const services = {
    vectorize: false,
    gemini: false,
    speechToText: false,
  };

  // Check Vectorize
  try {
    if (c.env.VECTORIZE) {
      services.vectorize = true;
    }
  } catch {
    // Vectorize not available
  }

  // Check Gemini API key
  services.gemini = !!c.env.GEMINI_API_KEY;

  // Check Google Cloud API key
  services.speechToText = !!c.env.GOOGLE_CLOUD_API_KEY;

  const allHealthy = Object.values(services).every(Boolean);

  const response: HealthResponse = {
    status: allHealthy ? 'ok' : 'degraded',
    version: '0.1.0',
    timestamp: Date.now(),
    services,
  };

  return c.json(response, allHealthy ? 200 : 503);
});
