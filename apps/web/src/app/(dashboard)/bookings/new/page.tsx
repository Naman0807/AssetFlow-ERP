'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState({ asset_id: '', start_time: '', end_time: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/v1/assets?limit=100')
      .then(d => setAssets((d.assets || []).filter((a: any) => a.is_shared_bookable)))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/bookings');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bookings" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">New Booking</h1><p className="text-gray-500">Reserve a shared resource</p></div>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="label">Asset *</label>
              <select value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} className="input" required>
                <option value="">Select bookable asset</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Time *</label>
                <input type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">End Time *</label>
                <input type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="input" required />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/bookings"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Create Booking</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
