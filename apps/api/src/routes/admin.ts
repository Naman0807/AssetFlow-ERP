import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireRole('Admin'));

  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { search, role, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('profiles')
      .select('*, department:departments!profiles_department_id_fkey(id, name)', { count: 'exact' });

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role) query = query.eq('role', role);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ users: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.patch('/users/:id/role', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const { role } = request.body as { role: string };

    const validRoles = ['Employee', 'Asset Manager', 'Department Head', 'Admin'];
    if (!validRoles.includes(role)) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } });
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'role_changed',
      entity_type: 'profile',
      entity_id: id,
      new_values: { role },
    }]);

    return reply.send({ message: 'Role updated' });
  });

  fastify.get('/departments', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data, error } = await supabase
      .from('departments')
      .select('*, manager:profiles!fk_departments_manager(id, name, email)')
      .order('name');

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ departments: data });
  });

  fastify.post('/departments', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data, error } = await supabase
      .from('departments')
      .insert([request.body])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.status(201).send(data);
  });

  fastify.patch('/departments/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('departments')
      .update(request.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send(data);
  });

  fastify.get('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { data, error } = await supabase.from('asset_categories').select('*').order('name');
    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ categories: data });
  });

  fastify.post('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data, error } = await supabase
      .from('asset_categories')
      .insert([request.body])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.status(201).send(data);
  });

  fastify.patch('/categories/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('asset_categories')
      .update(request.body)
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send(data);
  });
}
