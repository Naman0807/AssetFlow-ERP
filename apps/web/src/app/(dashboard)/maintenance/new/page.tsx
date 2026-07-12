'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState({ asset_id: '', description: '', priority: 'Medium' });
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/v1/assets?limit=100').then(d => setAssets(d.assets || [])).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/v1/maintenance', { method: 'POST', body: JSON.stringify(form) });
      router.push('/maintenance');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/maintenance" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">Report Maintenance Issue</h1></div>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="label">Asset *</label>
              <select value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} className="input" required>
                <option value="">Select asset</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority *</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input" required>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" rows={4} required placeholder="Describe the issue in detail..." />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/maintenance"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" loading={loading}>Submit Request</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
