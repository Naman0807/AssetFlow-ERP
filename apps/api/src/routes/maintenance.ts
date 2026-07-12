import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Pending': ['Approved', 'Rejected'],
  'Approved': ['Technician Assigned'],
  'Technician Assigned': ['In Progress'],
  'In Progress': ['Resolved'],
};

export default async function maintenanceRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { status, asset_id, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('maintenance_requests')
      .select('*, asset:assets(id, asset_tag, name), reporter:profiles!maintenance_requests_reporter_id_fkey(id, name, email)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (asset_id) query = query.eq('asset_id', asset_id);

    if (request.auth.role === 'Employee') {
      query = query.eq('reporter_id', request.auth.userId);
    }

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ requests: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*, asset:assets(id, asset_tag, name, location), reporter:profiles!maintenance_requests_reporter_id_fkey(id, name, email)')
      .eq('id', id)
      .single();

    if (error || !data) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Request not found' } });
    return reply.send(data);
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, description, priority, photo_url } = request.body as any;

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([{
        asset_id,
        reporter_id: request.auth.userId,
        description,
        priority,
        photo_url: photo_url || null,
        status: 'Pending',
      }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'reported',
      entity_type: 'maintenance',
      entity_id: data.id,
      new_values: { asset_id, priority },
    }]);

    return reply.status(201).send(data);
  });

  fastify.patch('/:id/approve', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: current } = await supabase.from('maintenance_requests').select('*').eq('id', id).single();
    if (!current) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

    if (!VALID_TRANSITIONS[current.status]?.includes('Approved')) {
      return reply.status(409).send({ error: { code: 'INVALID_TRANSITION', message: `Cannot approve from status: ${current.status}` } });
    }

    await supabase.from('maintenance_requests').update({ status: 'Approved' }).eq('id', id);
    await supabase.from('assets').update({ status: 'Under Maintenance' }).eq('id', current.asset_id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'approved',
      entity_type: 'maintenance',
      entity_id: id,
    }]);

    return reply.send({ message: 'Request approved' });
  });

  fastify.patch('/:id/assign', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const { technician_name } = request.body as any;

    const { data: current } = await supabase.from('maintenance_requests').select('*').eq('id', id).single();
    if (!current) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

    if (!VALID_TRANSITIONS[current.status]?.includes('Technician Assigned')) {
      return reply.status(409).send({ error: { code: 'INVALID_TRANSITION', message: `Cannot assign from status: ${current.status}` } });
    }

    await supabase.from('maintenance_requests').update({
      status: 'Technician Assigned',
      technician_name,
    }).eq('id', id);

    return reply.send({ message: 'Technician assigned' });
  });

  fastify.patch('/:id/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: current } = await supabase.from('maintenance_requests').select('*').eq('id', id).single();
    if (!current) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

    if (!VALID_TRANSITIONS[current.status]?.includes('Resolved')) {
      return reply.status(409).send({ error: { code: 'INVALID_TRANSITION', message: `Cannot resolve from status: ${current.status}` } });
    }

    await supabase.from('maintenance_requests').update({
      status: 'Resolved',
      resolved_at: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('assets').update({ status: 'Available' }).eq('id', current.asset_id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'resolved',
      entity_type: 'maintenance',
      entity_id: id,
    }]);

    return reply.send({ message: 'Request resolved' });
  });

  fastify.patch('/:id/reject', { preHandler: [requireRole('Asset Manager', 'Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: current } = await supabase.from('maintenance_requests').select('*').eq('id', id).single();
    if (!current) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

    if (!VALID_TRANSITIONS[current.status]?.includes('Rejected')) {
      return reply.status(409).send({ error: { code: 'INVALID_TRANSITION', message: `Cannot reject from status: ${current.status}` } });
    }

    await supabase.from('maintenance_requests').update({ status: 'Rejected' }).eq('id', id);

    return reply.send({ message: 'Request rejected' });
  });
}
