import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabasePlugin } from './plugins/supabase';
import { authPlugin } from './plugins/auth';
import assetRoutes from './routes/assets';
import allocationRoutes from './routes/allocations';
import bookingRoutes from './routes/bookings';
import maintenanceRoutes from './routes/maintenance';
import auditRoutes from './routes/audits';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';
import transferRoutes from './routes/transfers';
import activityLogRoutes from './routes/activity-log';

// Bun loads .env automatically — no dotenv needed

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

// Register plugins
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
fastify.register(supabasePlugin);
fastify.register(authPlugin);

// Register routes
fastify.register(assetRoutes, { prefix: '/api/v1/assets' });
fastify.register(allocationRoutes, { prefix: '/api/v1/allocations' });
fastify.register(bookingRoutes, { prefix: '/api/v1/bookings' });
fastify.register(maintenanceRoutes, { prefix: '/api/v1/maintenance' });
fastify.register(auditRoutes, { prefix: '/api/v1/audits' });
fastify.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });
fastify.register(transferRoutes, { prefix: '/api/v1/transfers' });
fastify.register(activityLogRoutes, { prefix: '/api/v1/activity-log' });

// Health check
fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
