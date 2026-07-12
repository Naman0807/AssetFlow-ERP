import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireRole } from '../plugins/auth';

export default async function bookingRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, user_id, status, start_date, end_date, page = 1, limit = 20 } = request.query as any;

    let query = supabase
      .from('bookings')
      .select('*, asset:assets(id, asset_tag, name), user:profiles!bookings_user_id_fkey(id, name, email)', { count: 'exact' });

    if (asset_id) query = query.eq('asset_id', asset_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (status) query = query.eq('status', status);
    if (start_date) query = query.gte('start_time', start_date);
    if (end_date) query = query.lte('end_time', end_date);

    const from = ((page as number) - 1) * (limit as number);
    const to = from + (limit as number) - 1;

    const { data, error, count } = await query
      .order('start_time', { ascending: true })
      .range(from, to);

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ bookings: data, pagination: { page, limit, total: count || 0 } });
  });

  fastify.get('/calendar', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { start, end, asset_id } = request.query as any;

    let query = supabase
      .from('bookings')
      .select('*, asset:assets(id, asset_tag, name, location), user:profiles!bookings_user_id_fkey(id, name)')
      .not('status', 'eq', 'Cancelled')
      .gte('start_time', start)
      .lte('end_time', end);

    if (asset_id) query = query.eq('asset_id', asset_id);

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send({ bookings: data });
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { asset_id, start_time, end_time } = request.body as any;
    const user_id = request.auth.userId;

    if (new Date(start_time) >= new Date(end_time)) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'start_time must be before end_time' } });
    }

    const { data: asset } = await supabase
      .from('assets')
      .select('id, is_shared_bookable, status')
      .eq('id', asset_id)
      .single();

    if (!asset || !asset.is_shared_bookable) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Asset is not bookable' } });
    }

    if (asset.status === 'Under Maintenance' || asset.status === 'Retired') {
      return reply.status(409).send({ error: { code: 'ASSET_NOT_AVAILABLE', message: 'Asset is not available for booking' } });
    }

    const { data: overlaps } = await supabase
      .from('bookings')
      .select('id')
      .eq('asset_id', asset_id)
      .not('status', 'eq', 'Cancelled')
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (overlaps && overlaps.length > 0) {
      return reply.status(409).send({
        error: { code: 'BOOKING_CONFLICT', message: 'Time slot unavailable. Overlap detected.' },
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{ asset_id, user_id, start_time, end_time, status: 'Upcoming' }])
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });

    await supabase.from('activity_logs').insert([{
      user_id,
      action: 'booked',
      entity_type: 'booking',
      entity_id: booking.id,
      new_values: { asset_id, start_time, end_time },
    }]);

    return reply.status(201).send(booking);
  });

  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };
    const { start_time, end_time } = request.body as any;

    const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (!booking) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    if (booking.user_id !== request.auth.userId && !['Asset Manager', 'Admin'].includes(request.auth.role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not your booking' } });
    }

    const newStart = start_time || booking.start_time;
    const newEnd = end_time || booking.end_time;

    if (new Date(newStart) >= new Date(newEnd)) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid time range' } });
    }

    const { data: overlaps } = await supabase
      .from('bookings')
      .select('id')
      .eq('asset_id', booking.asset_id)
      .not('status', 'eq', 'Cancelled')
      .neq('id', id)
      .lt('start_time', newEnd)
      .gt('end_time', newStart);

    if (overlaps && overlaps.length > 0) {
      return reply.status(409).send({ error: { code: 'BOOKING_CONFLICT', message: 'New time slot conflicts with existing booking' } });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ start_time: newStart, end_time: newEnd })
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: { code: 'DB_ERROR', message: error.message } });
    return reply.send(data);
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const supabase = (fastify as any).supabase;
    const { id } = request.params as { id: string };

    const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (!booking) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    if (booking.user_id !== request.auth.userId && !['Asset Manager', 'Admin'].includes(request.auth.role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not your booking' } });
    }

    await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id);

    await supabase.from('activity_logs').insert([{
      user_id: request.auth.userId,
      action: 'cancelled',
      entity_type: 'booking',
      entity_id: id,
    }]);

    return reply.send({ message: 'Booking cancelled' });
  });
}
