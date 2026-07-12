import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function auditRoutes(fastify: FastifyInstance) {
  fastify.get('/cycles', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { is_closed, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('audit_cycles')
      .select('*, department:departments!audit_cycles_scope_department_id_fkey(id, name), assignments:audit_assignments(id, auditor:profiles!audit_assignments_auditor_id_fkey(id, name))', { count: 'exact' });

    if (is_closed !== undefined) query = query.eq('is_closed', is_closed === 'true');

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ cycles: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.post('/cycles', { preHandler: [requireRole('Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data, error } = await supabase
      .from('audit_cycles')
      .insert([request.body])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.status(201).send(data);
  });

  fastify.get('/cycles/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('audit_cycles')
      .select('*, department:departments!audit_cycles_scope_department_id_fkey(id, name), assignments:audit_assignments(*, auditor:profiles!audit_assignments_auditor_id_fkey(id, name))')
      .eq('id', id)
      .single();

    if (error || !data) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Cycle not found' } });
    return reply.send(data);
  });

  fastify.post('/cycles/:id/assignments', { preHandler: [requireRole('Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const { auditor_ids } = request.body as { auditor_ids: string[] };

    const assignments = auditor_ids.map((auditor_id) => ({
      audit_cycle_id: id,
      auditor_id,
    }));

    const { data, error } = await supabase
      .from('audit_assignments')
      .insert(assignments)
      .select();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.status(201).send(data);
  });

  fastify.post('/assignments/:id/results', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const { asset_id, verification_status, notes } = request.body as any;

    const { data: assignment } = await supabase
      .from('audit_assignments')
      .select('audit_cycle_id')
      .eq('id', id)
      .single();

    if (!assignment) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } });

    const { data, error } = await supabase
      .from('audit_results')
      .insert([{
        audit_cycle_id: assignment.audit_cycle_id,
        asset_id,
        auditor_id: request.auth.userId,
        verification_status,
        notes: notes || null,
      }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.status(201).send(data);
  });

  fastify.post('/cycles/:id/close', { preHandler: [requireRole('Admin')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: results } = await supabase
      .from('audit_results')
      .select('*')
      .eq('audit_cycle_id', id);

    if (results) {
      for (const result of results) {
        if (result.verification_status === 'Missing') {
          await supabase.from('assets').update({ status: 'Lost' }).eq('id', result.asset_id);
        }
      }
    }

    await supabase.from('audit_cycles').update({ is_closed: true }).eq('id', id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'audit_closed',
      entity_type: 'audit_cycle',
      entity_id: id,
      new_values: { results_count: results?.length || 0 },
    }]);

    return reply.send({ message: 'Audit cycle closed' });
  });
}
