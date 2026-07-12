import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function activityLogRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { entity_type, user_id, page = 1, limit = 50 } = request.query as any;

    let query = supabase
      .from('activity_logs')
      .select('*, user:profiles!activity_logs_user_id_fkey(id, name, email)', { count: 'exact' });

    if (entity_type) query = query.eq('entity_type', entity_type);
    if (user_id) query = query.eq('user_id', user_id);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ logs: data, pagination: { page, limit, total: count || 0 } });
  });
}
