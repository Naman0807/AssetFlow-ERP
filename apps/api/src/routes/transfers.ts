import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function transferRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { status, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('transfer_requests')
      .select('*, asset:assets(id, asset_tag, name), requester:profiles!transfer_requests_requester_id_fkey(id, name, email), department:departments!transfer_requests_target_department_id_fkey(id, name)', { count: 'exact' });

    if (status) query = query.eq('status', status);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ transfers: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, target_department_id, notes } = request.body as any;

    const { data, error } = await supabase
      .from('transfer_requests')
      .insert([{
        asset_id,
        requester_id: request.auth.userId,
        target_department_id,
        notes: notes || null,
        status: 'Requested',
      }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'transfer_requested',
      entity_type: 'transfer',
      entity_id: data.id,
      new_values: { asset_id, target_department_id },
    }]);

    return reply.status(201).send(data);
  });

  fastify.patch('/:id/approve', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: transfer } = await supabase.from('transfer_requests').select('*').eq('id', id).single();
    if (!transfer) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Transfer not found' } });
    if (transfer.status !== 'Requested') return reply.status(409).send({ error: { code: 'INVALID_TRANSITION', message: 'Transfer already processed' } });

    await supabase.from('transfer_requests').update({ status: 'Approved' }).eq('id', id);
    await supabase.from('assets').update({ current_department_id: transfer.target_department_id }).eq('id', transfer.asset_id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'transfer_approved',
      entity_type: 'transfer',
      entity_id: id,
    }]);

    return reply.send({ message: 'Transfer approved and executed' });
  });

  fastify.patch('/:id/reject', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    await supabase.from('transfer_requests').update({ status: 'Rejected' }).eq('id', id);

    return reply.send({ message: 'Transfer rejected' });
  });
}
