import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function allocationRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, user_id, status = 'Active', page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('allocations')
      .select('*, asset:assets(id, asset_tag, name, status), user:profiles!allocations_assigned_to_user_id_fkey(id, name, email), department:departments!allocations_assigned_to_dept_id_fkey(id, name)', { count: 'exact' });

    if (asset_id) query = query.eq('asset_id', asset_id);
    if (user_id) query = query.eq('assigned_to_user_id', user_id);
    if (status) query = query.eq('status', status);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('allocated_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ allocations: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.post('/', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, assigned_to_user_id, assigned_to_dept_id, expected_return_date } = request.body as any;

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, status, name')
      .eq('id', asset_id)
      .single();

    if (assetError || !asset) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
    }

    if (asset.status !== 'Available') {
      return reply.status(409).send({
        error: { code: 'ASSET_NOT_AVAILABLE', message: `Asset is currently ${asset.status}` },
      });
    }

    const { data: existing } = await supabase
      .from('allocations')
      .select('id')
      .eq('asset_id', asset_id)
      .eq('status', 'Active')
      .limit(1);

    if (existing && existing.length > 0) {
      return reply.status(409).send({
        error: { code: 'ALREADY_ALLOCATED', message: 'Asset already has an active allocation' },
      });
    }

    const { data: allocation, error } = await supabase
      .from('allocations')
      .insert([{
        asset_id,
        assigned_to_user_id: assigned_to_user_id || null,
        assigned_to_dept_id: assigned_to_dept_id || null,
        expected_return_date: expected_return_date || null,
        status: 'Active',
      }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('assets').update({
      status: 'Allocated',
      current_holder_id: assigned_to_user_id || null,
      current_department_id: assigned_to_dept_id || null,
    }).eq('id', asset_id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'allocated',
      entity_type: 'allocation',
      entity_id: allocation.id,
      new_values: { asset_id, assigned_to_user_id, assigned_to_dept_id },
    }]);

    return reply.status(201).send(allocation);
  });

  fastify.post('/:id/return', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const body = (request.body as any) || {};
    const { condition_on_return } = body;

    const { data: allocation } = await supabase
      .from('allocations')
      .select('*, asset:assets(id)')
      .eq('id', id)
      .single();

    if (!allocation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Allocation not found' } });
    }

    await supabase.from('allocations').update({
      status: 'Returned',
      actual_return_date: new Date().toISOString().split('T')[0],
      condition_on_return: condition_on_return || null,
    }).eq('id', id);

    await supabase.from('assets').update({
      status: 'Available',
      current_holder_id: null,
      current_department_id: null,
    }).eq('id', allocation.asset_id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'returned',
      entity_type: 'allocation',
      entity_id: id,
      new_values: { condition_on_return, actual_return_date: new Date().toISOString() },
    }]);

    return reply.send({ message: 'Asset returned successfully' });
  });
}
