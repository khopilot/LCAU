import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { chatRoutes } from './routes/chat';
import { transcribeRoutes } from './routes/transcribe';
import { healthRoutes } from './routes/health';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow localhost on any port for development
      if (origin?.startsWith('http://localhost:')) {
        return origin;
      }
      // Production origins
      if (origin === 'https://ifc-cambodge.pages.dev') {
        return origin;
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

// Routes
app.route('/api', chatRoutes);
app.route('/api', transcribeRoutes);
app.route('/api', healthRoutes);

// Root
app.get('/', (c) => {
  return c.json({
    name: 'LCAU API',
    version: '0.1.0',
    description: 'IFC Cambodia Multilingual Chatbot API',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: c.env.ENVIRONMENT === 'development' ? { message: err.message } : undefined,
    },
    500
  );
});

export default app;
