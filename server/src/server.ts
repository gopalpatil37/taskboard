import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { projectsRoutes } from './routes/projects.js';

const app = new Hono();

// Configure CORS before API routes so browser preflight requests are handled.
app.use('/api/*', cors({
  origin: env.CLIENT_ORIGIN,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

app.route('/api/auth', authRoutes);
app.route('/api/projects', projectsRoutes);

app.get('/', (c) => {
  return c.json({
    message: 'TaskBoard API is running!',
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});

console.log('Server running on http://localhost:3000');