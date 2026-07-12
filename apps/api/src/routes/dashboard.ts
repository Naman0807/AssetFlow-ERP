import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/kpis', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const [assetsTotal, assetsAvailable, assetsAllocated, maintenancePending, activeBookings, pendingTransfers] = await Promise.all([
      supabase.from('assets').select('*', { count: 'exact', head: true }),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Available'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'Allocated'),
      supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['Upcoming', 'Ongoing']),
      supabase.from('transfer_requests').select('*', { count: 'exact', head: true }).eq('status', 'Requested'),
    ]);

    const { count: overdueCount } = await supabase
      .from('allocations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      .lt('expected_return_date', new Date().toISOString().split('T')[0]);

    return reply.send({
      total_assets: assetsTotal.count || 0,
      available: assetsAvailable.count || 0,
      allocated: assetsAllocated.count || 0,
      maintenance_pending: maintenancePending.count || 0,
      active_bookings: activeBookings.count || 0,
      pending_transfers: pendingTransfers.count || 0,
      overdue_allocations: overdueCount || 0,
    });
  });

  fastify.get('/assets-by-status', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const statuses = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];
    const results = await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', status);
        return { status, count: count || 0 };
      })
    );

    return reply.send({ data: results });
  });

  fastify.get('/assets-by-dept', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true);

    const results = await Promise.all(
      (data || []).map(async (dept: { id: string; name: string }) => {
        const { count } = await supabase.from('assets').select('*', { count: 'exact', head: true }).eq('current_department_id', dept.id);
        return { department: dept.name, count: count || 0 };
      })
    );

    return reply.send({ data: results });
  });

  fastify.get('/recent-activity', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, user:profiles!activity_logs_user_id_fkey(id, name)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ activities: data });
  });
}
