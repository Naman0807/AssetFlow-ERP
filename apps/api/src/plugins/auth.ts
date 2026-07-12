import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      userId: string;
      role: string;
      departmentId: string | null;
    };
  }
}

// Role hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
  Employee: 0,
  'Department Head': 1,
  'Asset Manager': 2,
  Admin: 3,
};

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    const userLevel = ROLE_HIERARCHY[request.auth.role] ?? 0;
    const hasAccess = allowedRoles.some((role) => userLevel >= (ROLE_HIERARCHY[role] ?? 0));
    if (!hasAccess) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  };
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest('auth', undefined as any);

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health check and public routes
    if (request.url === '/api/health' || request.url.startsWith('/api/v1/auth/')) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }

    const token = authHeader.slice(7);

    try {
      const supabase = (fastify as any).supabase;

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
      }

      // Fetch profile from DB
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, department_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Profile not found' } });
      }

      request.auth = {
        userId: profile.id,
        role: profile.role,
        departmentId: profile.department_id,
      };
    } catch (err: any) {
      console.error('Auth error:', err?.message || err);
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: `Token verification failed: ${err?.message || 'unknown'}` } });
    }
  });
});
