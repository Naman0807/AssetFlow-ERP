import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function assetRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { search, status, category_id, department_id, location, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('assets')
      .select('*, category:asset_categories(id, name), current_holder:profiles!assets_current_holder_id_fkey(id, name, email), department:departments!assets_current_department_id_fkey(id, name)', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }
    if (status) query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (department_id) query = query.eq('current_department_id', department_id);
    if (location) query = query.ilike('location', `%${location}%`);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    return reply.send({
      assets: data,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / (limit as number)) },
    });
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('assets')
      .select('*, category:asset_categories(id, name), current_holder:profiles!assets_current_holder_id_fkey(id, name, email), department:departments!assets_current_department_id_fkey(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });

    const { data: history } = await supabase
      .from('allocations')
      .select('*, user:profiles!allocations_assigned_to_user_id_fkey(id, name, email), department:departments!allocations_assigned_to_dept_id_fkey(id, name)')
      .eq('asset_id', id)
      .order('allocated_at', { ascending: false });

    return reply.send({ ...data, allocation_history: history || [] });
  });

  fastify.post('/', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const body = request.body as any;

    const { count } = await supabase.from('assets').select('*', { count: 'exact', head: true });
    const tagNumber = (count || 0) + 1;
    const asset_tag = `AF-${String(tagNumber).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('assets')
      .insert([{ ...body, asset_tag }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'created',
      entity_type: 'asset',
      entity_id: data.id,
      new_values: { asset_tag: data.asset_tag, name: data.name },
    }]);

    return reply.status(201).send(data);
  });

  fastify.patch('/:id', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const { data: old } = await supabase.from('assets').select('*').eq('id', id).single();

    const { data, error } = await supabase
      .from('assets')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'updated',
      entity_type: 'asset',
      entity_id: id,
      old_values: old ? { name: old.name, status: old.status } : null,
      new_values: body,
    }]);

    return reply.send(data);
  });

  fastify.delete('/:id', { preHandler: [requireRole('Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('assets')
      .update({ status: 'Retired' })
      .eq('id', id);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'retired',
      entity_type: 'asset',
      entity_id: id,
    }]);

    return reply.send({ message: 'Asset retired' });
  });
}
