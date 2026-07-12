'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  asset: { id: string; asset_tag: string; name: string; location: string } | null;
  user: { id: string; name: string } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - (view === 'week' ? 7 : 30));
      const end = new Date(currentDate);
      end.setDate(end.getDate() + (view === 'week' ? 14 : 30));

      const data = await apiFetch(`/api/v1/bookings/calendar?start=${start.toISOString()}&end=${end.toISOString()}`);
      setBookings(data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [currentDate, view]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const navigate = (dir: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (view === 'week' ? 7 * dir : 30 * dir));
    setCurrentDate(newDate);
  };

  // Generate week days
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(b => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      return bStart <= dayEnd && bEnd >= dayStart;
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-gray-500">Resource scheduling calendar</p>
        </div>
        <Link href="/bookings/new"><Button><Plus className="h-4 w-4" /> New Booking</Button></Link>
      </div>

      {/* Calendar Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Button variant="ghost" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </div>
          <div className="flex gap-2">
            <Button variant={view === 'week' ? 'primary' : 'ghost'} onClick={() => setView('week')}>Week</Button>
            <Button variant={view === 'month' ? 'primary' : 'ghost'} onClick={() => setView('month')}>Month</Button>
          </div>
        </div>
      </Card>

      {/* Week View */}
      {view === 'week' && (
        <Card>
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 text-xs font-medium text-gray-500 border-r">Time</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`p-3 text-center border-r last:border-r-0 ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}>
                <p className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className={`text-lg font-semibold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : ''}`}>{day.getDate()}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 max-h-[600px] overflow-y-auto">
            {hours.map(hour => (
              <div key={hour} className="contents">
                <div className="p-2 text-xs text-gray-500 border-r text-right">{hour}:00</div>
                {weekDays.map((day, di) => {
                  const dayBookings = getBookingsForDay(day).filter(b => {
                    const bHour = new Date(b.start_time).getHours();
                    return bHour === hour;
                  });
                  return (
                    <div key={di} className={`border-r border-b p-1 min-h-[60px] ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50/50' : ''}`}>
                      {dayBookings.map(b => (
                        <div key={b.id} className={`text-xs p-1.5 rounded mb-1 cursor-pointer ${
                          b.status === 'Cancelled' ? 'bg-gray-100 text-gray-500 line-through' :
                          b.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          b.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          <p className="font-medium truncate">{b.asset?.name}</p>
                          <p className="truncate">{b.user?.name}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Month View — Simple list */}
      {view === 'month' && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : bookings.length === 0 ? (
              <EmptyState title="No bookings" description="No bookings in this period" />
            ) : (
              <div className="divide-y">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{b.asset?.name} <span className="text-gray-400 font-mono">{b.asset?.asset_tag}</span></p>
                        <p className="text-xs text-gray-500">{b.user?.name} · {formatDateTime(b.start_time)} → {formatDateTime(b.end_time)}</p>
                      </div>
                    </div>
                    <Badge value={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
